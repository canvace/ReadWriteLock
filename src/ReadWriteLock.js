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
						callback(release);
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
						callback(release);
					}
				});
			} else {
				table[key].readers = -1;
				callback(release);
			}
		} else {
			table[key] = {
				readers: -1,
				queue: []
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
