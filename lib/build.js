'use strict';

const path = require('path');
const fs = require('fs');
const exec = require('execa');
const pify = require('pify');

const writeFile = pify(fs.writeFile);

module.exports = context => {
	const version = parseInt(context.version.split(/\./g)[0], 10);

	const dockerfile = [
		`FROM node:${context.version}`,
		'WORKDIR /usr/src/app',
		'ARG NODE_ENV',
		'ENV NODE_ENV $NODE_ENV',
		'COPY . .'
	];

	if (version <= 7) {
		dockerfile.push(
			'RUN npm install'
		);
	} else if (version <= 9) {
		dockerfile.push(
			'RUN npm i -g npm',
			'RUN npm ci'
		);
	} else {
		dockerfile.push(
			'RUN npm ci'
		);
	}

	dockerfile.push(
		'CMD ["npm", "start"]'
	);

	const tmpPath = path.join(context.cwd, `.${context.version}.dockerfile`);

	const image = `test-${context.name}-${context.version}`;
	const options = {cwd: context.cwd};

	return writeFile(tmpPath, dockerfile.join('\n'), 'utf8')
		.then(() => exec('docker', ['build', '-t', image, '-f', tmpPath, '.'], options))
		.then(() => context);
};
