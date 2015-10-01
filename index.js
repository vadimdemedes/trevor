#!/usr/bin/env node

'use strict';

/**
 * Dependencies
 */

var logUpdate = require('log-update');
var Promise = require('bluebird');
var figures = require('figures');
var format = require('util').format;
var table = require('text-table');
var sushi = require('sushi');
var chalk = require('chalk');
var exec = require('child_process').exec;
var each = require('each-async');
var join = require('path').join;
var yaml = require('yamljs');
var fs = require('fs');


/**
 * States
 */

var STATE_BUILDING = 0;
var STATE_RUNNING = 1;
var STATE_SUCCESS = 2;
var STATE_ERROR = 3;


/**
 * Your own Travis CI to run tests locally
 */

var path = process.cwd();
var pkg = require(join(path, 'package.json'));

var cli = sushi();

cli.on('index', function (args) {
  var config = fs.readFileSync(join(path, '.travis.yml'), 'utf-8');

  var versions = yaml.parse(config).node_js || ['stable'];

  // if there's no .dockerignore
  // copy .gitignore to .dockerignore
  var exists = stat(join(path, '.dockerignore'));

  if (!exists) {
    copy(join(path, '.gitignore'), join(path, '.dockerignore'));
  }

  // create a hidden Dockerfile for each version
  versions.forEach(function (version) {
    var tag = version === 'stable' ? '' : version + '-';
    var dockerfile = format('FROM node:%sonbuild', tag);

    fs.writeFileSync(join(path, '.' + version + '.dockerfile'), dockerfile);
  });

  var state = {};
  var errors = {};

  versions.forEach(function (version) {
    state[version] = STATE_BUILDING;
  });

  updateState(state);

  each(versions, function (version, index, done) {
    var command = format('docker build -t test-%s-%s -f .%s.dockerfile .', pkg.name, version, version);

    run(command, { cwd: path }, function (err, output) {
      if (err) {
        state[version] = STATE_ERROR;
        errors[version] = output;

        updateState(state);

        return done();
      }

      var command = format('docker run --rm test-%s-%s %s', pkg.name, version, pkg.scripts.test);

      state[version] = STATE_RUNNING;
      updateState(state);

      run(command, function (err, output) {
        if (err) {
          state[version] = STATE_ERROR;
          errors[version] = output;

          updateState(state);

          return done();
        }

        state[version] = STATE_SUCCESS;
        updateState(state);

        done();
      });
    });
  }, function () {
    logUpdate.done();

    Object.keys(errors).forEach(function (version) {
      console.log('\n   ' + chalk.red(figures.cross + '  node v' + version + ':'));
      console.log(errors[version]);
    });

    // remove hidden Dockerfiles
    versions.forEach(function (version) {
      fs.unlinkSync(join(path, '.' + version + '.dockerfile'));
    });

    process.exit(errors.length);
  });
});

cli.run();


/**
 * Utilities
 */

function run (command, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  var output = '';

  var ps = exec(command, options, function (err) {
    callback(err, output);
  });

  ps.stdout.on('data', function (data) {
    output += data;
  });

  ps.stderr.on('data', function (data) {
    output += data;
  });
}

function updateState (state) {
  var items = Object.keys(state).map(function (version) {
    var message;
    var icon;

    switch (state[version]) {
      case STATE_BUILDING:
        message = chalk.grey('building');
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
