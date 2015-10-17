'use strict';

/**
 * Dependencies
 */

var logUpdate = require('log-update');
var figures = require('figures');
var table = require('text-table');
var chalk = require('chalk');

var states = require('./states');


/**
 * Expose `update-state`
 */

module.exports = updateState;


/**
 * Display current state
 */

function updateState (state) {
	var items = Object.keys(state).map(function (version) {
		var message;
		var icon;

		var currentState = state[version];

		if (currentState === states.downloading) {
			message = chalk.grey('downloading base image');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === states.building) {
			message = chalk.grey('building environment');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === states.cleaning) {
			message = chalk.grey('cleaning up');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === states.running) {
			message = chalk.grey('running');
			icon = chalk.grey(figures.circleDotted);
		}

		if (currentState === states.success) {
			message = chalk.green('success');
			icon = chalk.green(figures.tick);
		}

		if (currentState === states.error) {
			message = chalk.red('error');
			icon = chalk.red(figures.cross);
		}

		return [' ', icon, version + ':', message];
	});

	var output = '\n' + table(items, { align: ['l', 'l', 'r', 'l'] });

	logUpdate(output);
}
