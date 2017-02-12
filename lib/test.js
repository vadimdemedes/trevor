'use strict';

/**
 * Dependencies
 */

var Promise = require('bluebird');
var format = require('util').format;

var service = require('./service');
var run = require('../util/run');


/**
 * Expose `test`
 */

module.exports = test;


/**
 * Run `npm test`
 */

function test (context) {
	// append default environment
	// variables to arguments
	var env = {
		CONTINUOUS_INTEGRATION: true,
		TRAVIS: true,
		CI: true
	};

	return Promise.resolve(context.services)
		.map(function (serviceName) {
			return service.start(serviceName, context);
		})
		.then(function (services) {
			var image = format('test-%s-%s', context.name, context.version);

			var args = [
				'run',
				'--rm'
			];

			// expose environment variables
			Object.keys(env).forEach(function (name) {
				var arg = format('%s=%s', name, env[name]);

				args.push('-e', arg);
			});

			// expose services
			services.forEach(function (service) {
				var serviceName = format('%s-%s-%s', service.name, context.name, context.version);
				var arg = format('%s:%s', serviceName, service.host);

				args.push('--link', arg);
			});

			args.push(image, 'npm', 'test');

			return run('docker', args).return(context);
		})
		.return(context);
}
