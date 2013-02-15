/**
 * TODO
 *
 * @class ReadWriteLock
 * @constructor
 */
module.exports = function ReadWriteLock() {
	'use strict';

	var table = {};

	/**
	 * TODO
	 *
	 * @method readLock
	 * @param key {String} TODO
	 * @param callback {Function} TODO
	 * @param callback.release {Function} TODO
	 * @param [options] {Object} TODO
	 * @param [options.scope] {Object} TODO
	 * @param [options.timeout] {Number} TODO
	 * @param [options.timeoutCallback] {Function} TODO
	 */
	function readLock(key, callback, options) {
		if (typeof options !== 'object') {
			options = {};
		}
		var release = (function () {
			var released = false;
			return function () {
				if (!released) {
					released = true;
					table[key].readers--;
					if (table[key].queue.length) {
						table[key].queue[0]();
					} else {
						delete table[key];
					}
				}
			};
		}());
		if (key in table) {
			if ((table[key].readers < 0) || table[key].queue.length) {
				table[key].queue.push(function () {
					if (table[key].readers >= 0) {
						table[key].queue.shift();
						table[key].readers++;
						if (options.scope) {
							callback.call(options.scope, release);
						} else {
							callback(release);
						}
						if (table[key].queue.length) {
							table[key].queue[0]();
						}
					}
				});
			} else {
				table[key].readers++;
			}
		} else {
			table[key] = {
				readers: 1,
				queue: []
			};
			if (options.scope) {
				callback.call(options.scope, release);
			} else {
				callback(release);
			}
		}
	}

	/**
	 * TODO
	 *
	 * @method writeLock
	 * @param key {String} TODO
	 * @param callback {Function} TODO
	 * @param callback.release {Function} TODO
	 * @param [options] {Object} TODO
	 * @param [options.scope] {Object} TODO
	 * @param [options.timeout] {Number} TODO
	 * @param [options.timeoutCallback] {Function} TODO
	 */
	function writeLock(key, callback, options) {
		if (typeof options !== 'object') {
			options = {};
		}
		var release = (function () {
			var released = false;
			return function () {
				if (!released) {
					released = true;
					table[key].readers = 0;
					if (table[key].queue.length) {
						table[key].queue[0]();
					} else {
						delete table[key];
					}
				}
			};
		}());
		if (key in table) {
			if (table[key].readers || table[key].queue.length) {
				table[key].queue.push(function () {
					if (!table[key].readers) {
						table[key].queue.shift();
						table[key].readers = -1;
						if (options.scope) {
							callback.call(options.scope, release);
						} else {
							callback(release);
						}
					}
				});
			} else {
				table[key].readers = -1;
				if (options.scope) {
					callback.call(options.scope, release);
				} else {
					callback(release);
				}
			}
		} else {
			table[key] = {
				readers: -1,
				queue: []
			};
			if (options.scope) {
				callback.call(options.scope, release);
			} else {
				callback(release);
			}
		}
	}

	this.readLock = readLock;
	this.writeLock = writeLock;

	/**
	 * TODO
	 *
	 * @method readSection
	 * @param key {String} TODO
	 * @param callback {Function} TODO
	 * @param [options] {Object} TODO
	 * @param [options.scope] {Object} TODO
	 * @param [options.timeout] {Number} TODO
	 * @param [options.timeoutCallback] {Function} TODO
	 */
	this.readSection = function (key, callback, options) {
		readLock(key, function (release) {
			callback.call(this);
			release();
		}, options);
	};

	/**
	 * TODO
	 *
	 * @method writeSection
	 * @param key {String} TODO
	 * @param callback {Function} TODO
	 * @param [options] {Object} TODO
	 * @param [options.scope] {Object} TODO
	 * @param [options.timeout] {Number} TODO
	 * @param [options.timeoutCallback] {Function} TODO
	 */
	this.writeSection = function (key, callback, options) {
		writeLock(key, function (release) {
			callback.call(this);
			release();
		}, options);
	};
};
