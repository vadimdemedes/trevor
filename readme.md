<h1 align="center">
  <br>
  <img width="310" src="media/logo.png?raw=true">
  <br>
  <br>
</h1>

[![Build Status](https://travis-ci.org/vadimdemedes/trevor.svg?branch=master)](https://travis-ci.org/vadimdemedes/trevor)

> Your own Travis CI to run tests locally.


## Purpose

I often need to run tests for multiple versions of Node.js.
But I don't want to switch versions manually using `n`/`nvm` or push the code to Travis CI just to run the tests.

That's why I created Trevor. It reads `.travis.yml` and runs tests in all versions you requested, just like Travis CI.
Now, you can test before push and keep your git history clean.

<img width="524" src="media/demo.gif?raw=true">


## Requirements

- [Docker](https://www.docker.com)
- [NPM](https://www.npmjs.com/)


## Installation

```
$ npm install --global trevor
```


## Usage

Given the following `.travis.yml` file:

```yaml
language: node_js
node_js:
  - '7'
  - '6'
  - '4'
```

Run `trevor` in project's directory:

```
$ trevor
```


## License

MIT © [Vadim Demedes](https://vadimdemedes.com)
