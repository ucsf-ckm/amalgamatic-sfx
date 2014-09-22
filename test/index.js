/*jshint expr: true*/

var sfx = require('../index.js');

var nock = require('nock');
nock.disableNetConnect();

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;

var afterEach = lab.afterEach;

describe('sfx', function () {

	afterEach(function (done) {
		nock.cleanAll();
		done();
	});

	it('returns an empty result if no search term provided', function (done) {
		sfx.search({searchTerm: ''}, function (result) {
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns an empty result if no first argument', function (done) {
		sfx.search(null, function (result) {
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns results if a non-ridiculous search term is provided', function (done) {
		nock('http://ucelinks.cdlib.org:8888')
			.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=medicine')
			.reply('200', '<a class="Results" href="#">Medicine</a><a class="Results" href="#">Medicine</a>');

		sfx.search({searchTerm: 'medicine'}, function (result) {
			expect(result.data.length).to.equal(2);
			done();
		});
	});

	it('returns an empty result if ridiculous search term is provided', function (done) {
		nock('http://ucelinks.cdlib.org:8888')
			.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=fhqwhgads')
			.reply('200', '<html></html>');

		sfx.search({searchTerm: 'fhqwhgads'}, function (result) {
			expect(result.data.length).to.equal(0);
			done();
		});
	});

	it('returns a single result for insanely specific search', function (done) {
		nock('http://ucelinks.cdlib.org:8888')
			.get('/sfx_ucsf/az?param_textSearchType_value=startsWith&param_pattern_value=medicine%20and%20health%2C%20Rhode%20Island')
			.reply('200', '<a class="Results" href="#">medicine and health, Rhode Island</a>');

		sfx.search({searchTerm: 'medicine and health, Rhode Island'}, function (result) {
			expect(result.data.length).to.equal(1);
			done();
		});
	});

	it('returns an error object if there was an HTTP error', function (done) {
		sfx.search({searchTerm: 'medicine'}, function (result) {
			nock.enableNetConnect();
			expect(result.data).to.be.undefined;
			expect(result.error).to.equal('Nock: Not allow net connect for "ucelinks.cdlib.org:8888"');
			done();
		});
	});
});
