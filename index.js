var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');

exports.search = function (query, callback) {
    'use strict';

    if (! query || ! query.searchTerm) {
        callback(null, {data: []});
        return;
    }

    var options;
    if (!query.host) {
        options = {
            host: 'ucelinks.cdlib.org',
            port: 8888,
            path: '/sfx_ucsf/az'
        };
    } else {
        options = {
            host: query.host,
            port: query.port,
            path: query.path || '/'
        };
    }

    options.path = options.path + '?param_textSearchType_value=startsWith&' +
                querystring.stringify({param_pattern_value: query.searchTerm});

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
                if (! url.match(/^(https?:)?\/\/.+/)) {
                    url = 'http://' + options.host + url;
                }
                result.push({
                    name: $(this).text(),
                    url: url
                });
            });

            callback(null, {data: result});
        });
    }).on('error', function (e) {
        callback(e);
    });
};