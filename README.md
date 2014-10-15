[![Build Status](https://travis-ci.org/ucsf-ckm/amalgamatic-sfx.svg?branch=master)](https://travis-ci.org/ucsf-ckm/amalgamatic-sfx)

amalgamatic-sfx
======================

[Amalgamatic](https://github.com/ucsf-ckm/amalgamatic) plugin for [SFX](http://www.exlibrisgroup.com/category/SFXOverview)

## Installation

Install amalgamatic and this plugin via `npm`:

`npm install amalgamatic amalgamatic-sfx`

## Usage

````
var amalgamatic = require('amalgamatic'),
    sfx = require('amalgamatic-sfx');

// Set the URL to point to your SFX A-Z list
sfx.setOptions({url: 'http://ucelinks.cdlib.org:8888/sfx_ucsf/az'});

// Add this plugin to your Amalgamatic instance along with any other plugins you've configured.
amalgamatic.add('sfx', sfx);

//Use it!
var callback = function (err, results) {
    if (err) {
        console.dir(err);
    } else {
        results.forEach(function (result) {
            console.log(result.name);
            console.dir(result.data);
        });
    }
};

amalgamatic.search({searchTerm: 'medicine'}, callback);
````
