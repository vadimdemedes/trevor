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

function pullImage (context) {
	var image = format('node:%s-onbuild', context.version);

	return run('docker', ['pull', image]).return(context);
}
