'use strict';

/**
 * Dependencies
 */

var fs = require('fs');


/**
 * Expose `copy`
 */

module.exports = copy;


/**
 * Synchronously copy file
 */

function copy(src, dest) {
	try {
		var source = fs.readFileSync(src);

		fs.writeFileSync(dest, source);
	} catch (err) {

	}
}
