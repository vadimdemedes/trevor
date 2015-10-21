'use strict';

/**
 * Dependencies
 */

var fs = require('fs');
var yaml = require('yamljs');


/**
 * Expose `parse-config`
 */

module.exports = parseConfig;


/**
 * Parse the YAML config file
 */

function parseConfig (path) {
	return yaml.parse(fs.readFileSync(path, 'utf-8'));
}
