'use strict';

const path = require('path');
const fs = require('fs');
const exec = require('execa');
const pify = require('pify');

const writeFile = pify(fs.writeFile);

module.exports = context => {
	const dockerfile = [
		`FROM node:${context.version}`,
		'WORKDIR /usr/src/app',
		'ARG NODE_ENV',
		'ENV NODE_ENV $NODE_ENV',
		'COPY package.json .',
		'RUN npm install',
		'COPY . .',
		'CMD ["npm", "start"]'
	].join('\n');

	const tmpPath = path.join(context.cwd, `.${context.version}.dockerfile`);

	const image = `test-${context.name}-${context.version}`;
	const options = {cwd: context.cwd};

	return writeFile(tmpPath, dockerfile, 'utf8')
		.then(() => exec('docker', ['build', '-t', image, '-f', tmpPath, '.'], options))
		.then(() => context);
};
