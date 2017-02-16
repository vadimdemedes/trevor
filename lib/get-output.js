'use strict';

const figures = require('figures');
const table = require('text-table');
const chalk = require('chalk');
const {
	STATE_DOWNLOADING,
	STATE_BUILDING,
	STATE_CLEANING,
	STATE_RUNNING,
	STATE_SUCCESS,
	STATE_ERROR
} = require('./states');

module.exports = state => {
	const items = Object.keys(state).map(version => {
		let message;
		let icon;

		const currentState = state[version];

		if (currentState === STATE_DOWNLOADING) {
			message = chalk.grey('downloading base image');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === STATE_BUILDING) {
			message = chalk.grey('building environment');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === STATE_CLEANING) {
			message = chalk.grey('cleaning up');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === STATE_RUNNING) {
			message = chalk.grey('running');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === STATE_SUCCESS) {
			message = chalk.green('success');
			icon = chalk.green(figures.tick);
		}

		if (currentState === STATE_ERROR) {
			message = chalk.red('error');
			icon = chalk.red(figures.cross);
		}

		return [' ', icon, `${version}:`, message];
	});

	return '\n' + table(items, {align: ['l', 'l', 'r', 'l']});
};
