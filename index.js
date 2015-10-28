#!/usr/bin/env node

'use strict';

/**
 * Dependencies
 */

var logUpdate = require('log-update');
var Promise = require('bluebird');
var figures = require('figures');
var chalk = require('chalk');
var join = require('path').join;
var meow = require('meow');
var fs = require('mz/fs');

var updateState = require('./lib/update-state');
var getVersions = require('./lib/get-versions');
var pullImage = require('./lib/pull-image');
var parseConfig = require('./lib/parse-config');
var states = require('./lib/states');
var clean = require('./lib/clean');
var build = require('./lib/build');
var copy = require('./util/copy');
var stat = require('./util/stat');
var test = require('./lib/test');


/**
 * CLI
 */

var cli = meow({
	help: [
		'Usage: trevor [options]',
		'',
		'Options:',
		'',
		'  -h, --help    Show this help',
		'  --no-clean    Don\' remove the Docker image after tests',
		'',
		'Required files (in the current directory):',
		'',
		'  - package.json',
		'  - .travis.yml'
	]
}, {
	alias: {
		h: 'help'
	},
	boolean: [
		'h'
	]
});


/**
 * Your own Travis CI to run tests locally
 */

var path = process.cwd();

if (!stat(join(path, '.travis.yml'))) {
	console.log('\n  ' + chalk.red('error') + ' .travis.yml does not exist in the current directory\n');
	process.exit(1);
}

if (!stat(join(path, 'package.json'))) {
	console.log('\n  ' + chalk.red('error') + ' package.json does not exist in the current directory\n');
	process.exit(1);
}

var pkg = require(join(path, 'package.json'));

// if there's no .dockerignore
// copy .gitignore to .dockerignore
var exists = stat(join(path, '.dockerignore'));

if (!exists) {
	copy(join(path, '.gitignore'), join(path, '.dockerignore'));
}

var state = {};
var errors = {};

var config = parseConfig(join(path, '.travis.yml'));

if (config.language !== 'node_js') {
	console.log('\n  ' + chalk.red('error') + ' only Node.js is supported\n');
	process.exit(1);
}

getVersions(config)
	.map(function (version) {
		var context = {
			version: version,
			name: pkg.name.toLowerCase(),
			path: path,
			args: cli.flags
		};

		return Promise.resolve(context)
			.tap(function () {
				state[version] = states.downloading;
				updateState(state);
			})
			.then(pullImage)
			.tap(function () {
				state[version] = states.building;
				updateState(state);
			})
			.then(build)
			.tap(function () {
				state[version] = states.running;
				updateState(state);
			})
			.then(test)
			.tap(function () {
				state[version] = states.cleaning;
				updateState(state);
			})
			.then(clean)
			.tap(function () {
				state[version] = states.success;
				updateState(state);
			})
			.catch(function (output) {
				state[version] = states.error;
				errors[version] = output;
				updateState(state);
			})
			.then(function () {
				var tmpPath = join(path, '.' + version + '.dockerfile');

				return fs.unlink(tmpPath).catch(function () {});
			});
	})
	.then(function () {
		if (!exists) {
			return fs.unlink(join(path, '.dockerignore')).catch(function () { });
		}
	})
	.then(function () {
		logUpdate.done();

		// display output from failed node.js versions
		Object.keys(errors).forEach(function (version) {
			console.log('\n   ' + chalk.red(figures.cross + '  node v' + version + ':'));
			console.log(errors[version]);
		});

		process.exit(Object.keys(errors).length);
	});
