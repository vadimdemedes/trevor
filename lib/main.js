'use strict';

const path = require('path');
const fs = require('fs');
const loadJsonFile = require('load-json-file');
const logUpdate = require('log-update');
const copyFile = require('cp-file');
const pMap = require('p-map');
const pTap = require('p-tap');
const TrevorError = require('./trevor-error');
const parseConfig = require('./parse-config');
const getVersions = require('./get-versions');
const getOutput = require('./get-output');
const buildImage = require('./build');
const pullImage = require('./pull');
const clean = require('./clean');
const test = require('./test');
const {
	STATE_DOWNLOADING,
	STATE_BUILDING,
	STATE_CLEANING,
	STATE_RUNNING,
	STATE_SUCCESS,
	STATE_ERROR
} = require('./states');

module.exports = ({cwd}) => {
	const filePath = name => path.join(cwd, name);

	if (!fs.existsSync(filePath('.travis.yml'))) {
		throw new TrevorError('.travis.yml doesn\'t exist');
	}

	if (!fs.existsSync(filePath('package.json'))) {
		throw new TrevorError('package.json doesn\'t exist');
	}

	const pkg = loadJsonFile.sync(filePath('package.json'));

	// if there's no .dockerignore
	// copy .gitignore to .dockerignore
	const exists = fs.existsSync(filePath('.dockerignore'));

	if (!exists) {
		copyFile.sync(filePath('.gitignore'), filePath('.dockerignore'));
	}

	const config = parseConfig(filePath('.travis.yml'));

	if (config.language !== 'node_js') {
		throw new TrevorError(`Language ${config.language} isn't supported`);
	}

	const state = {};
	const updateOutput = () => logUpdate(getOutput(state));

	return getVersions(config)
		.then(versions => {
			return pMap(versions, version => {
				const context = {
					name: pkg.name.toLowerCase(),
					cwd,
					version
				};

				return Promise.resolve(context)
					.then(pTap(() => {
						state[version] = STATE_DOWNLOADING;
						updateOutput();
					}))
					.then(pullImage)
					.then(pTap(() => {
						state[version] = STATE_BUILDING;
						updateOutput();
					}))
					.then(buildImage)
					.then(pTap(() => {
						state[version] = STATE_RUNNING;
						updateOutput();
					}))
					.then(test)
					.then(pTap(() => {
						state[version] = STATE_CLEANING;
						updateOutput();
					}))
					.then(clean)
					.then(pTap(() => {
						state[version] = STATE_SUCCESS;
						updateOutput();
					}))
					.catch(() => {
						state[version] = STATE_ERROR;
						updateOutput();
					});
			});
		})
		.then(() => {
			logUpdate.done();

			if (!exists) {
				fs.unlinkSync(filePath('.dockerignore'));
			}

			return state;
		});
};
