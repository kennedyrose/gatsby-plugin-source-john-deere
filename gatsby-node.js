'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var fetchSchema = function () {
	var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
		var data;
		return _regenerator2.default.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.next = 2;
						return fetch(options.taxonomyUrl, {
							method: 'GET',
							headers: options.headers
						});

					case 2:
						data = _context.sent;

						console.log('Fetched Deere taxonomy...');
						_context.next = 6;
						return data.text();

					case 6:
						data = _context.sent;
						_context.next = 9;
						return parseString(data);

					case 9:
						data = _context.sent;
						return _context.abrupt('return', data);

					case 11:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function fetchSchema(_x) {
		return _ref.apply(this, arguments);
	};
}();

var fetchData = function () {
	var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(url, options) {
		var data;
		return _regenerator2.default.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						data = void 0;
						_context2.prev = 1;
						_context2.next = 4;
						return fetch(options.prepend + url + options.append, {
							method: 'GET',
							headers: options.headers
						});

					case 4:
						data = _context2.sent;
						_context2.next = 11;
						break;

					case 7:
						_context2.prev = 7;
						_context2.t0 = _context2['catch'](1);

						console.log('Error fetching Deere data ' + url);
						//console.error(err)
						return _context2.abrupt('return');

					case 11:
						if (!data) {
							_context2.next = 22;
							break;
						}

						_context2.prev = 12;
						_context2.next = 15;
						return data.json();

					case 15:
						data = _context2.sent;
						_context2.next = 22;
						break;

					case 18:
						_context2.prev = 18;
						_context2.t1 = _context2['catch'](12);

						console.log('Error parsing Deere JSON ' + url);
						//console.error(err)
						return _context2.abrupt('return');

					case 22:
						console.log('Succeeded fetching Deere JSON');
						if (options.mutate) {
							data = options.mutate(data);
						}

						// TESTING!
						data = removeNull(data);
						delete data.Page['table'];

						//console.log(JSON.stringify(data, null, 3))
						return _context2.abrupt('return', Object.assign({
							id: url,
							parent: null,
							children: [],
							internal: {
								type: options.internalType,
								contentDigest: crypto.createHash('md5').update(JSON.stringify(data)).digest('hex'),
								mediaType: 'application/json'
							}
						}, data));

					case 27:
					case 'end':
						return _context2.stop();
				}
			}
		}, _callee2, this, [[1, 7], [12, 18]]);
	}));

	return function fetchData(_x4, _x5) {
		return _ref2.apply(this, arguments);
	};
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fetch = require('fetch-retry');
var crypto = require('crypto');
var xml2js = require('xml2js');
var sequence = require('promise-sequence');

function parseString(str) {
	return new Promise(function (resolve, reject) {
		xml2js.parseString(str, function (err, res) {
			if (err) return reject(err);
			resolve(res);
		});
	});
}

function getProduct(data) {
	var arr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

	for (var i in data) {
		if ((0, _typeof3.default)(data[i]) === 'object') {
			if (Array.isArray(data[i]) && data[i][0].sku && data[i][0].path) {
				if (data[i][0].sku[0] && data[i][0].path[0]) {
					arr.push(data[i][0].path[0]);
				}
			} else {
				getProduct(data[i], arr);
			}
		}
	}
	return arr;
}

function getUrls(data) {
	var arr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

	for (var i in data) {
		if (i === 'path' && data[i].length) {
			arr.push(data[i][0]);
		} else if ((0, _typeof3.default)(data[i]) === 'object') {
			getUrls(data[i], arr);
		}
	}
	return arr;
}

function removeNull(obj) {
	for (var i in obj) {
		if (obj[i] == null) {
			delete obj[i];
		} else if ((0, _typeof3.default)(obj[i]) === 'object') {
			obj[i] = removeNull(obj[i]);
		}
	}
	return obj;
}

exports.sourceNodes = function () {
	var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(_ref4, options) {
		var boundActionCreators = _ref4.boundActionCreators;
		var createNode, taxonomy, urls, promises, data;
		return _regenerator2.default.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:

						options = Object.assign({
							urls: [],
							prepend: 'https://www.deere.com',
							append: 'index.json',
							headers: {},
							internalType: 'ApiContent',
							productOnly: true,
							taxonomyUrl: 'https://www.deere.com/en/us-en.taxonomy'
						}, options);

						createNode = boundActionCreators.createNode;


						console.log('Fetching Deere taxonomy...');
						_context3.next = 5;
						return fetchSchema(options);

					case 5:
						taxonomy = _context3.sent;
						urls = void 0;

						if (options.productOnly) {
							urls = getProduct(taxonomy);
						} else {
							urls = getUrls(taxonomy);
						}
						console.log('Found ' + urls.length + ' Deere URLs...');
						//urls.length = 203

						/*
      urls = [
      	urls[201],
      	urls[202],
      ]
      */

						promises = urls.map(function (url) {
							return fetchData(url, options);
						});

						console.log('Fetching ' + urls.length + ' Deere URLs...');
						_context3.next = 13;
						return sequence(promises);

					case 13:
						data = _context3.sent;


						console.log('Creating Deere nodes...');
						data.forEach(function (datum, key) {
							if ((typeof datum === 'undefined' ? 'undefined' : (0, _typeof3.default)(datum)) === 'object') {
								createNode(datum);
							}
						});

						console.log('Created Deere nodes.');

						return _context3.abrupt('return');

					case 18:
					case 'end':
						return _context3.stop();
				}
			}
		}, _callee3, undefined);
	}));

	return function (_x6, _x7) {
		return _ref3.apply(this, arguments);
	};
}();
//# sourceMappingURL=gatsby-node.js.map