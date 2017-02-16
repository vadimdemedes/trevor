'use strict';

const fs = require('fs');
const yaml = require('yamljs');

module.exports = path => yaml.parse(fs.readFileSync(path, 'utf8'));
