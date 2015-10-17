'use strict';

/**
 * Dependencies
 */

var format = require('util').format;
var join = require('path').join;
var fs = require('mz/fs');

var run = require('../util/run');


/**
 * Expose `build`
 */

module.exports = build;


/**
 * Build docker image for a specific node version
 */

function build (context) {
	var dockerfile = format('FROM node:%s-onbuild', context.version);
	var tmpPath = join(context.path, '.' + context.version + '.dockerfile');

	return fs.writeFile(tmpPath, dockerfile)
		.then(function () {
			var image = format('test-%s-%s', context.name, context.version);

			return run('docker', ['build', '-t', image, '-f', tmpPath, '.']).return(context);
		});
}
