'use strict';

/**
 * Dependencies
 */

var Promise = require('bluebird');
var spawn = require('child_process').spawn;


/**
 * Expose `run`
 */

module.exports = run;


/**
 * spawn() helper, that concatenates stdout & stderr
 * and returns a Promise
 */

function run (command, args, options) {
	return new Promise(function (resolve, reject) {
		var output = '';

		var ps = spawn(command, args, options);

		ps.on('close', function (code) {
			if (code > 0) {
				return reject(output);
			}

			resolve();
		});

		ps.stdout.on('data', function (data) {
			output += data;
		});

		ps.stderr.on('data', function (data) {
			output += data;
		});
	});
}
