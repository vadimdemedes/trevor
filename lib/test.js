'use strict';

const exec = require('execa');

module.exports = context => {
	const image = `test-${context.name}-${context.version}`;
	const env = {
		CONTINUOUS_INTEGRATION: true,
		TRAVIS: true,
		CI: true
	};

	const args = [
		'run',
		'--rm'
	];

	Object.keys(env).forEach(key => {
		const value = env[key];

		args.push('-e', `${key}=${value}`);
	});

	args.push(image, 'npm', 'test');

	return exec('docker', args).then(() => context);
};
