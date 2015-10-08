#!/usr/bin/env node

'use strict';

/**
 * Dependencies
 */

var fetchStableVersion = require('stable-node-version');
var logUpdate = require('log-update');
var Promise = require('bluebird');
var figures = require('figures');
var format = require('util').format;
var table = require('text-table');
var chalk = require('chalk');
var spawn = require('child_process').spawn;
var join = require('path').join;
var yaml = require('yamljs');
var fs = require('mz/fs');


/**
 * States
 */

var STATE_DOWNLOADING = 0;
var STATE_BUILDING = 1;
var STATE_RUNNING = 2;
var STATE_SUCCESS = 3;
var STATE_ERROR = 4;


/**
 * Your own Travis CI to run tests locally
 */

var path = process.cwd();
var pkg = require(join(path, 'package.json'));

// if there's no .dockerignore
// copy .gitignore to .dockerignore
var exists = stat(join(path, '.dockerignore'));

if (!exists) {
  copy(join(path, '.gitignore'), join(path, '.dockerignore'));
}

var state = {};
var errors = {};

getVersions()
  .map(function (version) {
    var context = {
      name: pkg.name.toLowerCase(),
      version: version
    };

    state[version] = STATE_DOWNLOADING;

    updateState(state);

    return Promise.resolve(context)
      .then(pull)
      .tap(function () {
        state[version] = STATE_BUILDING;
        updateState(state);
      })
      .then(build)
      .tap(function () {
        state[version] = STATE_RUNNING;
        updateState(state);
      })
      .then(test)
      .tap(function () {
        state[version] = STATE_SUCCESS;
        updateState(state);
      })
      .catch(function (output) {
        state[version] = STATE_ERROR;
        errors[version] = output;
        updateState(state);
      })
      .then(function () {
        var tmpPath = join(path, '.' + version + '.dockerfile');

        return fs.unlink(tmpPath);
      });
  })
  .then(function () {
    logUpdate.done();

    // display output from failed node.js versions
    Object.keys(errors).forEach(function (version) {
      console.log('\n   ' + chalk.red(figures.cross + '  node v' + version + ':'));
      console.log(errors[version]);
    });

    process.exit(errors.length);
  });


/**
 * Utilities
 */


/**
 * Pull docker image for a specific node version
 */

function pull (context) {
  var image = format('node:%s-onbuild', context.version);

  return run('docker', ['pull', image]).return(context);
}


/**
 * Build docker image for a specific node version
 */

function build (context) {
  var dockerfile = format('FROM node:%s-onbuild', context.version);
  var tmpPath = join(path, '.' + context.version + '.dockerfile');

  return fs.writeFile(tmpPath, dockerfile)
    .then(function () {
      var image = format('test-%s-%s', context.name, context.version);

      return run('docker', ['build', '-t', image, '-f', tmpPath, '.']).return(context);
    });
}


/**
 * Run `npm test`
 */

function test (context) {
  var image = format('test-%s-%s', context.name, context.version);

  return run('docker', ['run', '--rm', image, 'npm', 'test']).return(context);
}


/**
 * spawn() helper, that concatenates stdout & stderr
 * and returns a Promise
 */

function run (command, args, options) {
  return new Promise(function (resolve, reject) {
    var output = '';

    var ps = spawn(command, args, options);

    ps.on('close', function (code) {
      if (code > 0) {
        return reject(output);
      }

      resolve();
    });

    ps.stdout.on('data', function (data) {
      output += data;
    });

    ps.stderr.on('data', function (data) {
      output += data;
    });
  });
}


/**
 * Display current state
 */

function updateState (state) {
  var items = Object.keys(state).map(function (version) {
    var message;
    var icon;

    switch (state[version]) {
      case STATE_DOWNLOADING:
        message = chalk.grey('downloading base image');
        icon = chalk.grey(figures.circleDotted);
        break;

      case STATE_BUILDING:
        message = chalk.grey('building environment');
        icon = chalk.grey(figures.circleDotted);
        break;

      case STATE_RUNNING:
        message = chalk.grey('running');
        icon = chalk.grey(figures.circleDotted);
        break;

      case STATE_SUCCESS:
        message = chalk.green('success');
        icon = chalk.green(figures.tick);
        break;

      case STATE_ERROR:
        message = chalk.red('error');
        icon = chalk.red(figures.cross);
        break;
    }

    return [' ', icon, version + ':', message];
  });

  var output = '\n' + table(items, { align: ['l', 'l', 'r', 'l'] });

  logUpdate(output);
}

/**
 * Get requested Node.js versions
 */

function getVersions () {
  return fs.readFile(join(path, '.travis.yml'), 'utf-8')
    .then(function (source) {
      return yaml.parse(source).node_js || ['stable'];
    })
    .map(function (version) {
      if (version === 'stable') {
        return fetchStableVersion();
      }

      return version;
    });
}

function copy (src, dest) {
  var source = fs.readFileSync(src);

  fs.writeFileSync(dest, source);
}

function stat (path) {
  try {
    return fs.statSync(path);
  } catch (_) {
    return false;
  }
}
