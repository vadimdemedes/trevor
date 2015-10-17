'use strict';

/**
 * Dependencies
 */

var Promise = require('bluebird');
var format = require('util').format;

var run = require('../util/run');


/**
 * Expose `clean`
 */

module.exports = clean;


/**
 * Remove docker image after tests
 */

function clean (context) {
	if (context.args.clean === false) {
		return Promise.resolve();
	}

	var image = format('test-%s-%s', context.name, context.version);

	return run('docker', ['rmi', image]).return(context);
}
