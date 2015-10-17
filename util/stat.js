'use strict';

/**
 * Dependencies
 */

var fs = require('fs');


/**
 * Expose `stat`
 */

module.exports = stat;


/**
 * fs.stat() without throwing up
 */

function stat (path) {
	try {
		return fs.statSync(path);
	} catch (_) {
		return false;
	}
}
