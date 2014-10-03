var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');

exports.search = function (query, callback) {
    'use strict';

    if (! query || ! query.searchTerm) {
        callback(null, {data: []});
        return;
    }

    var host, port, path;
    if (!query.host) {
        host = 'ucelinks.cdlib.org';
        port = 8888;
        path = '/sfx_ucsf/az';
    } else {
        host = query.host;
        port = parseInt(query.port, 10); 
        path = query.path || '/';
    }

    path = path + '?param_textSearchType_value=startsWith&' +
            querystring.stringify({param_pattern_value: query.searchTerm});

    var options = {
        host: host,
        path: path
    };

    if (port) {
        options.port = port;
    }

    http.get(options, function (resp) {
        var rawData = '';

        resp.on('data', function (chunk) {
            rawData += chunk;
        });

        resp.on('end', function () {
            var $ = cheerio.load(rawData);
            var result = [];
            $('a.Results').each(function () {
                var url = $(this).attr('href');
                if (typeof url === 'string') {
                    url = url.trim();
                    
                    if (! url.match(/^(https?:)?\/\/.+/)) {
                        var fqdn = 'http://' + host;
                        if (port) {
                            fqdn = fqdn + ':' + port;
                        } 
                        url = fqdn + url;
                    }

                    result.push({
                        name: $(this).text(),
                        url: url
                    });
                }
            });

            callback(null, {data: result});
        });
    }).on('error', function (e) {
        callback(e);
    });
};