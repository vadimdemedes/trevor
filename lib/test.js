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

	let output = '';
	const ps = exec('docker', args);
	ps.stdout.on('data', chunk => {
		output += chunk;
	});

	ps.stderr.on('data', chunk => {
		output += chunk;
	});

	return ps
		.then(() => context)
		.catch(() => {
			output = output
				.split('\n')
				.filter(line => !/^npm (info|err)/i.test(line))
				.join('\n');

			return Promise.reject({output});
		});
};
