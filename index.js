var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');
var extend = require('util-extend');
var url = require('url');

var options = {
    url: 'http://ucelinks.cdlib.org:8888/sfx_ucsf/az'
};

exports.setOptions = function (newOptions) {
    options = extend(options, newOptions);
};

exports.search = function (query, callback) {
    'use strict';

    if (! query || ! query.searchTerm) {
        callback(null, {data: []});
        return;
    }

    var myUrl = options.url + '?param_textSearchType_value=startsWith&' +
            querystring.stringify({param_pattern_value: query.searchTerm});

    var myOptions = url.parse(myUrl);
    myOptions.withCredentials = false;

    http.get(myOptions, function (resp) {
        var rawData = '';

        resp.on('data', function (chunk) {
            rawData += chunk;
        });

        resp.on('end', function () {
            var $ = cheerio.load(rawData);
            var result = [];
            $('a.Results').each(function () {
                var href = $(this).attr('href');
                if (typeof href === 'string') {
                    href = href.trim();
                    
                    href = url.resolve(myUrl, href);

                    result.push({
                        name: $(this).text(),
                        url: href
                    });
                }
            });

            callback(null, {data: result, url: myUrl});
        });
    }).on('error', function (e) {
        callback(e);
    });
};