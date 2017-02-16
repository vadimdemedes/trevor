'use strict';

class TrevorError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TrevorError';
	}
}

module.exports = TrevorError;
