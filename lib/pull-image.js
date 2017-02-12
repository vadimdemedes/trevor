'use strict';

/**
 * Dependencies
 */

var format = require('util').format;

var run = require('../util/run');


/**
 * Expose `pull-image`
 */

module.exports = pullImage;


/**
 * Pull docker image for a specific node version
 */

function pullImage (imageName, context) {
	if (typeof imageName !== 'string') {
		context = imageName;
		imageName = 'node';
	}

	var image = format('%s:%s', imageName, context.version);

	return run('docker', ['pull', image]).return(context);
}
