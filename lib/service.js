'use strict';

/**
 * Dependencies
 */

var format = require('util').format;
var objectAssign = require('object-assign');

var pullImage = require('./pull-image');
var run = require('../util/run');


/**
 * Services
 */

var services = {
	mongodb: {
		host: 'db',
		repository: 'mongo',
		tag: 'latest'
	}
};


/**
 * Expose
 */

module.exports.start = startService;
module.exports.pull = pullService;


/**
 * Pull the service
 */

function pullService (serviceName) {
	var service = services[serviceName];

	if (!startService) {
		// TODO start custom image
		throw new Error(serviceName + ' is not supported');
	}

	return pullImage(service.repository, { version: service.tag });
}


/**
 * Start the service for a specific context
 */

function startService (serviceName, context) {
	var service = services[serviceName];

	var name = format('%s-%s-%s', serviceName, context.name, context.version);
	var image = format('%s:%s', service.repository, service.tag);

	return run('docker', ['run', '-d', '--name', name, image]).return(objectAssign(service, { name: serviceName }));
}
