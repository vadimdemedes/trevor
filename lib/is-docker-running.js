'use strict';

const execa = require('execa');

module.exports = () => {
	return execa('docker', ['-v'])
		.then(() => true)
		.catch(() => false);
};
