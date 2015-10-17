'use strict';

/**
 * Dependencies
 */

var format = require('util').format;

var run = require('../util/run');


/**
 * Expose `test`
 */

module.exports = test;


/**
 * Run `npm test`
 */

function test (context) {
	var image = format('test-%s-%s', context.name, context.version);

	var args = [
		'run',
		'--rm'
	];

	// append default environment
	// variables to arguments
	var env = {
		CONTINUOUS_INTEGRATION: true,
		TRAVIS: true,
		CI: true
	};

	Object.keys(env).forEach(function (name) {
		var arg = format('%s=%s', name, env[name]);

		args.push('-e', arg);
	});

	args.push(image, 'npm', 'test');

	return run('docker', args).return(context);
}
