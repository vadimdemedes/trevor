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
		'ONBUILD ARG NODE_ENV',
		'ONBUILD ENV NODE_ENV $NODE_ENV',
		'ONBUILD COPY package.json .',
		'ONBUILD RUN npm install && npm cache clean --force',
		'ONBUILD COPY . .',
		'CMD ["npm", "start"]'
	].join('\n');

	const tmpPath = path.join(context.cwd, `.${context.version}.dockerfile`);

	const image = `test-${context.name}-${context.version}`;
	const options = {cwd: context.cwd};

	return writeFile(tmpPath, dockerfile, 'utf8')
		.then(() => exec('docker', ['build', '-t', image, '-f', tmpPath, '.'], options))
		.then(() => context);
};
