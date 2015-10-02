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

  var state = {};
  var errors = {};

  versions.forEach(function (version) {
    state[version] = STATE_DOWNLOADING;
  });

  updateState(state);

  each(versions, function (version, index, done) {
    pull(version, function (err, output) {
      if (err) {
        state[version] = STATE_ERROR;
        errors[version] = output;

        updateState(state);

        return done();
      }

      state[version] = STATE_BUILDING;
      updateState(state);

      build(pkg.name, version, function (err, output) {
        if (err) {
          state[version] = STATE_ERROR;
          errors[version] = output;

          updateState(state);

          return done();
        }

        state[version] = STATE_RUNNING;
        updateState(state);

        test(pkg.name, version, function (err, output) {
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
    });
  }, function () {
    logUpdate.done();

    Object.keys(errors).forEach(function (version) {
      console.log('\n   ' + chalk.red(figures.cross + '  node v' + version + ':'));
      console.log(errors[version]);
    });

    // remove hidden Dockerfiles
    versions.forEach(function (version) {
      // fs.unlinkSync(join(path, '.' + version + '.dockerfile'));
    });

    process.exit(errors.length);
  });
});

cli.run();


/**
 * Utilities
 */

function pull (version, callback) {
  var tag = version === 'stable' ? '' : version + '-';
  var image = format('node:%sonbuild', tag);

  var command = format('docker pull %s', image);

  run(command, callback);
}

function build (name, version, callback) {
  var tag = version === 'stable' ? '' : version + '-';
  var dockerfile = format('FROM node:%sonbuild', tag);

  fs.writeFileSync(join(path, '.' + version + '.dockerfile'), dockerfile);

  var command = format('docker build -t test-%s-%s -f .%s.dockerfile .', name, version, version);

  run(command, { cwd: path }, callback);
}

function test (name, version, callback) {
  var command = format('docker run --rm  test-%s-%s npm test', name, version);

  run(command, callback);
}

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
