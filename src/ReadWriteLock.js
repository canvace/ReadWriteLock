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
	 * @param [timeout] {Number} TODO
	 */
	function readLock(key, callback) {
		var release = (function () {
			var released = false;
			return function () {
				if (!released) {
					released = true;
					if (--table[key].readers < 1) {
						if (table[key].callbacks.length) {
							table[key].callbacks.shift()();
						} else {
							delete table[key];
						}
					}
				}
			};
		}());
		if (key in table) {
			if (table[key].readers > 0) {
				table[key].readers++;
				callback(release);
			} else {
				table[key].callbacks(function () {
					table[key].readers++;
					// TODO
				});
			}
		} else {
			table[key] = {
				readers: 1,
				callbacks: []
			};
			callback(release);
		}
	}

	/**
	 * TODO
	 *
	 * @method writeLock
	 * @param key {String} TODO
	 * @param callback {Function} TODO
	 * @param callback.release {Function} TODO
	 * @param [timeout] {Number} TODO
	 */
	function writeLock(key, callback) {
		var release = (function () {
			var released = false;
			return function () {
				if (!released) {
					released = true;
					table[key].readers = 0;
					if (table[key].callbacks.length) {
						table[key].callbacks.shift()();
					} else {
						delete table[key];
					}
				}
			};
		}());
		if (key in table) {
			table[key].callbacks.push(function () {
				// TODO
			});
		} else {
			table[key] = {
				readers: -1,
				callbacks: []
			};
			callback(release);
		}
	}

	this.readLock = readLock;
	this.writeLock = writeLock;

	/**
	 * TODO
	 *
	 * @method criticalSection
	 * @param key {String} TODO
	 * @param callback {Function} TODO
	 * @param [timeout] {Number} TODO
	 */
	this.criticalSection = function (key, callback, timeout) {
		writeLock(key, function (release) {
			callback();
			release();
		}, timeout);
	};
};
