/*jshint expr: true*/

var rewire = require('rewire');

var events = require('events');
var eventEmitter = new events.EventEmitter();

var sfx = rewire('../index.js');

var nock = require('nock');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;

var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;

describe('sfx', function () {

	beforeEach(function (done) {
		nock.disableNetConnect();
		done();
	});

	afterEach(function (done) {
		nock.cleanAll();
		done();
	});

	it('returns an empty result if no search term provided', function (done) {
		sfx.search({searchTerm: ''}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns an empty result if no first argument', function (done) {
		sfx.search(null, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns results if a non-ridiculous search term is provided', function (done) {
		nock('http://ucelinks.cdlib.org:8888')
			.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=medicine')
			.reply('200', '<a class="Results" href="#">Medicine</a><a class="Results" href="#">Medicine</a>');

		sfx.search({searchTerm: 'medicine'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(2);
			done();
		});
	});

	it('returns an empty result if ridiculous search term is provided', function (done) {
		nock('http://ucelinks.cdlib.org:8888')
			.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=fhqwhgads')
			.reply('200', '<html></html>');

		sfx.search({searchTerm: 'fhqwhgads'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(0);
			done();
		});
	});

	it('returns a single result for insanely specific search', function (done) {
		nock('http://ucelinks.cdlib.org:8888')
			.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=medicine%20and%20health%2C%20Rhode%20Island')
			.reply('200', '<a class="Results" href="#">medicine and health, Rhode Island</a>');

		sfx.search({searchTerm: 'medicine and health, Rhode Island'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(1);
			done();
		});
	});

	it('returns an error object if there was an HTTP error', function (done) {
		sfx.search({searchTerm: 'medicine'}, function (err, result) {
			nock.enableNetConnect();
			expect(result).to.be.not.ok;
			expect(err.message).to.equal('Nock: Not allow net connect for "ucelinks.cdlib.org:8888"');
			done();
		});
	});

	it('should use host, port, and path options if they are passed', function (done) {
		var revert = sfx.__set__('http', {get: function (options) {
			expect(options.host).to.equal('example.com');
			expect(options.port).to.equal(8000);
			expect(options.path).to.equal('/path?param_textSearchType_value=startsWith&param_pattern_value=medicine');
			eventEmitter.emit('optionsChecked');
			return {on: function () {}};
		}});

		eventEmitter.on('optionsChecked', function () {
			revert();
			done();
		});

		sfx.search({searchTerm: 'medicine', host: 'example.com', port: 8000, path: '/path'});
	});

	it('returns a URL that includes the domain name', function (done) {
		nock('http://ucelinks.cdlib.org:8888')
			.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=medicine')
			.reply('200', '<a class="Results" href="/path">Just A Path</a>');

		sfx.search({searchTerm: 'medicine'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(1);
			expect(result.data[0].url).to.equal('http://ucelinks.cdlib.org:8888/path');
			done();
		});
	});

	it('returns a URL that includes the protocol and domain name if none specified', function (done) {
		nock('http://example.com:80')
			.get('/?param_textSearchType_value=startsWith&param_pattern_value=medicine')
			.reply('200', '<a class="Results" href="/path">Just A Path</a>');

		sfx.search({searchTerm: 'medicine', host: 'example.com'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(1);
			expect(result.data[0].url).to.equal('http://example.com/path');
			done();
		});
	});

	it('should return fully-qualified URLs intact', function (done) {
		nock('http://example.com:80')
			.get('/?param_textSearchType_value=startsWith&param_pattern_value=medicine')
			.reply('200', '<a class="Results" href="http://example.com/path">FQDN</a><a class="Results" href="https://example.com/path">Another FQDN</a><a class="Results" href="//example.com/path">One more FQDN</a>');

		sfx.search({searchTerm: 'medicine', host: 'example.com'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(3);
			expect(result.data[0].url).to.equal('http://example.com/path');
			expect(result.data[1].url).to.equal('https://example.com/path');
			expect(result.data[2].url).to.equal('//example.com/path');
			done();
		});
	});

	it('should strip leading and trailing whitespace from URLs', function (done) {
		nock('http://example.com:80')
			.get('/?param_textSearchType_value=startsWith&param_pattern_value=medicine')
			.reply('200', '<a class="Results" href=" http://example.com/path\n">FQDN</a>');

		sfx.search({searchTerm: 'medicine', host: 'example.com'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(1);
			expect(result.data[0].url).to.equal('http://example.com/path');
			done();
		});
	});

	it('should gracefully handle missing URLs', function (done) {
		nock('http://example.com:80')
			.get('/?param_textSearchType_value=startsWith&param_pattern_value=medicine')
			.reply('200', '<a class="Results">FQDN</a>');

		sfx.search({searchTerm: 'medicine', host: 'example.com'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(0);
			done();
		});
	});
});
