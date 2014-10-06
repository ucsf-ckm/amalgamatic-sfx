var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');
var extend = require('util-extend');

var options = {
    host: 'ucelinks.cdlib.org',
    port: 8888,
    path: '/sfx_ucsf/az'
};

exports.setOptions = function (newOptions) {
    options = extend(options, newOptions);
    if (newOptions.host) {
        options.hostname = newOptions.host;
    }
};

exports.search = function (query, callback) {
    'use strict';

    var myOptions = options;

    if (! query || ! query.searchTerm) {
        callback(null, {data: []});
        return;
    }

    myOptions.path = myOptions.path + '?param_textSearchType_value=startsWith&' +
            querystring.stringify({param_pattern_value: query.searchTerm});

    var port = myOptions.port;
    var hostname = myOptions.hostname || myOptions.host;

    http.get(myOptions, function (resp) {
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
                        var fqdn = 'http://' + hostname;
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