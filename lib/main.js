'use strict';

const path = require('path');
const fs = require('fs');
const loadJsonFile = require('load-json-file');
const indentString = require('indent-string');
const kebabcase = require('lodash.kebabcase');
const logUpdate = require('log-update');
const copyFile = require('cp-file');
const figures = require('figures');
const chalk = require('chalk');
const pMap = require('p-map');
const pTap = require('p-tap');
const isDockerRunning = require('./is-docker-running');
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
		return Promise.reject(new TrevorError('.travis.yml doesn\'t exist'));
	}

	if (!fs.existsSync(filePath('package.json'))) {
		return Promise.reject(new TrevorError('package.json doesn\'t exist'));
	}

	const pkg = loadJsonFile.sync(filePath('package.json'));

	let originalDockerIgnore;
	if (fs.existsSync(filePath('.dockerignore'))) {
		originalDockerIgnore = fs.readFileSync(filePath('.dockerignore'));
	} else {
		console.log(filePath('.gitignore'));
		console.log(filePath('.dockerignore'));
		copyFile.sync(filePath('.gitignore'), filePath('.dockerignore'));
	}

	fs.appendFileSync(filePath('.dockerignore'), '.*.dockerfile');

	const config = parseConfig(filePath('.travis.yml'));
	const language = config.language || 'node_js';

	if (language !== 'node_js') {
		return Promise.reject(new TrevorError(`Language ${language} isn't supported`));
	}

	const state = new Map();
	const errors = new Map();
	const updateOutput = () => logUpdate(getOutput(state));

	const dockerIgoreCleanup = () => {
		fs.unlinkSync(filePath('.dockerignore'));
		if (originalDockerIgnore) {
			fs.writeFileSync(filePath('.dockerignore', originalDockerIgnore));
		}
	};

	return isDockerRunning()
		.then(isDockerUp => {
			if (!isDockerUp) {
				dockerIgoreCleanup();
				throw new TrevorError('Docker must be running to run the tests');
			}

			return getVersions(config);
		})
		.then(versions => {
			return pMap(versions, version => {
				const context = {
					name: kebabcase(pkg.name),
					config,
					cwd,
					version
				};

				return Promise.resolve(context)
					.then(pTap(() => {
						state.set(version, STATE_DOWNLOADING);
						updateOutput();
					}))
					.then(pullImage)
					.then(pTap(() => {
						state.set(version, STATE_BUILDING);
						updateOutput();
					}))
					.then(buildImage)
					.then(pTap(() => {
						state.set(version, STATE_RUNNING);
						updateOutput();
					}))
					.then(test)
					.then(pTap(() => {
						state.set(version, STATE_CLEANING);
						updateOutput();
					}))
					.then(clean)
					.then(pTap(() => {
						state.set(version, STATE_SUCCESS);
						updateOutput();
					}))
					.catch(err => {
						state.set(version, STATE_ERROR);
						errors.set(version, err.output);
						updateOutput();

						return clean(context);
					});
			});
		})
		.then(() => {
			logUpdate.done();

			if (errors.size > 0) {
				for (const [version, output] of errors) {
					console.log(`\n ${chalk.red(figures.cross)} ${version}:`);
					console.log(indentString(output, 1));
				}
			}
			dockerIgoreCleanup();
			return state;
		});
};
