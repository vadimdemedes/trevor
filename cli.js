#!/usr/bin/env node
'use strict';

const figures = require('figures');
const chalk = require('chalk');
const meow = require('meow');
const main = require('./lib/main');
const {STATE_ERROR} = require('./lib/states');

meow({
	help: `
		Usage: trevor [options]

		Options:

		  -h, --help  Show this help

		Required files (in the current directory):

		  - package.json
		  - .travis.yml
	`
}, {
	alias: {h: 'help'}
});

const cwd = process.cwd();

main({cwd})
	.then(state => {
		let hasErrors = false;

		for (const currentState of state.values()) {
			if (currentState === STATE_ERROR) {
				hasErrors = true;
				break;
			}
		}

		process.exit(hasErrors ? 1 : 0);
	})
	.catch(err => {
		if (err.name === 'TrevorError') {
			console.log(`\n ${chalk.red(figures.cross)} ${err.message}\n`);
		} else {
			console.log(err.stack);
		}

		process.exit(1);
	});
