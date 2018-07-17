(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function(event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCurrencyRate = exports.getCurrencies = exports.getCountries = exports.saveCurrencyRates = exports.saveCurrencies = exports.saveCountries = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _idb = require('idb');

var _idb2 = _interopRequireDefault(_idb);

var _vendor = require('./vendor');

var _vendor2 = _interopRequireDefault(_vendor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var handleRequest = new _vendor2.default();

var saveCountries = exports.saveCountries = function saveCountries() {
  var dbPromise = _idb2.default.open('currency-converter-db', 2, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('countries')) {
      return upgradeDb.createObjectStore('countries');
    }
  });

  return dbPromise.then(function (db) {
    var fetchedResponse = handleRequest.fetchCountries();
    return fetchedResponse.then(function (countries) {
      if (!countries.results) {
        return Promise.reject('Countries could not be fetched from network');
      }
      var addCountry = Object.keys(countries.results).map(function (key) {
        var tx = db.transaction('countries', 'readwrite');
        var countryStore = tx.objectStore('countries');
        countryStore.put(countries.results[key], key);
        return tx.complete;
      });
      return Promise.resolve(addCountry);
    });
  });
};

var saveCurrencies = exports.saveCurrencies = function saveCurrencies() {
  var dbPromise = _idb2.default.open('currency-converter-db', 2, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('currencies')) {
      return upgradeDb.createObjectStore('currencies');
    }
  });

  return dbPromise.then(function (db) {
    var fetchedResponse = handleRequest.fetchCurrencies();
    return fetchedResponse.then(function (currencies) {
      if (!currencies.results) {
        return Promise.reject('Currencies cannot be fetched from network');
      }
      var addCurrency = Object.keys(currencies.results).map(function (key) {
        var tx = db.transaction('currencies', 'readwrite');
        var currencyStore = tx.objectStore('currencies');
        currencyStore.put(currencies.results[key], key);
        return tx.complete;
      });
      return Promise.resolve(addCurrency);
    });
  });
};

var saveCurrencyRates = exports.saveCurrencyRates = function saveCurrencyRates(options) {
  var dbPromise = _idb2.default.open('currency-converter-db', 3, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('currency-rates')) {
      return upgradeDb.createObjectStore('currency-rates');
    }
  });
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' || !options) return;
  return dbPromise.then(function (db) {
    var addCurrencyRates = Object.keys(options).map(function (key) {
      var tx = db.transaction('currency-rates', 'readwrite');
      var currencyStore = tx.objectStore('currency-rates');
      currencyStore.put(options[key], key);
      return tx.complete;
    });
    return Promise.resolve(addCurrencyRates);
  });
};

var getCountries = exports.getCountries = function getCountries() {
  var dbPromise = _idb2.default.open('currency-converter-db', 2);
  return dbPromise.then(async function (db) {
    var tx = db.transaction('countries');
    var countryStore = tx.objectStore('countries');
    return countryStore.getAll();
  });
};

var getCurrencies = exports.getCurrencies = function getCurrencies() {
  var dbPromise = _idb2.default.open('currency-converter-db', 2);
  return dbPromise.then(async function (db) {
    var tx = db.transaction('currencies');
    var currencyStore = tx.objectStore('currencies');
    return currencyStore.getAll();
  });
};

var getCurrencyRate = exports.getCurrencyRate = function getCurrencyRate(fromCurrency, toCurrency) {
  var dbPromise = _idb2.default.open('currency-converter-db');
  return dbPromise.then(function (db) {
    var results = {};
    var tx = db.transaction('currency-rates');
    var currencyRateStore = tx.objectStore('currency-rates');
    currencyRateStore.get(fromCurrency + '_' + toCurrency).onsuccess = function (e) {
      results[fromCurrency + '_' + toCurrency] = e.target.result;
    };
    currencyRateStore.get(toCurrency + '_' + fromCurrency).onsuccess = function (e) {
      results[toCurrency + '_' + fromCurrency] = e.target.result;
    };
    return results;
  });
};

exports.default = {};

},{"./vendor":3,"idb":1}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HandleRequest = function () {
  function HandleRequest() {
    _classCallCheck(this, HandleRequest);

    this.baseUrl = 'https://free.currencyconverterapi.com/api/v5';
  }

  _createClass(HandleRequest, [{
    key: 'fetchCountries',
    value: function fetchCountries() {
      return fetch(this.baseUrl + '/countries').then(function (response) {
        if (!response) return;
        return response.json();
      }).catch(function (error) {
        return console.log(error);
      });
    }
  }, {
    key: 'fetchCurrencies',
    value: function fetchCurrencies() {
      return fetch(this.baseUrl + '/currencies').then(function (response) {
        if (!response) return;
        return response.json();
      }).catch(function (error) {
        return console.log(error);
      });
    }
  }, {
    key: 'fetchHistoricalData',
    value: function fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate) {
      var query = fromCurrency + '_' + toCurrency + ',' + toCurrency + '_' + fromCurrency;
      var url = this.baseUrl + '/convert?q=' + query + '&compact=ultra&date=[' + startDate + ']&endDate=[' + endDate + ']';
      return fetch(url).then(function (response) {
        if (!response) return;
        return response.json();
      }).catch(function (error) {
        return console.log(error);
      });
    }
  }, {
    key: 'convertCurrency',
    value: function convertCurrency(amount, fromCurrency, toCurrency) {
      var query = fromCurrency + '_' + toCurrency + ',' + toCurrency + '_' + fromCurrency;
      var url = this.baseUrl + '/convert?q=' + query + '&compact=ultra';
      return fetch(url).then(function (response) {
        if (!response) return;
        var data = response.json();
        var fromValue = amount * parseFloat(data[fromCurrency + '_' + toCurrency]);
        var toValue = amount * parseFloat(data[toCurrency + '_' + fromCurrency]);
        return {
          fromValue: fromValue,
          toValue: toValue,
          data: data
        };
      }).catch(function (error) {
        return console.log(error);
      });
    }
  }]);

  return HandleRequest;
}();

exports.default = HandleRequest;

},{}],4:[function(require,module,exports){
'use strict';

var _idb = require('idb');

var _idb2 = _interopRequireDefault(_idb);

var _store = require('./public/js/store');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cacheBasename = 'convert-currency';
var cacheVersion = 'v2';
var appCahe = cacheBasename + '-' + cacheVersion;

var repo = '/CurrencyConverter';

var pageSkeleton = ['/', '/build/public/js/main.js', '/build/public/js/plot.js', '/build/public/css/bootstrap.min.css', '/build/public/css/style.css', '/build/public/js/utils/jquery-3.2.1.min.js', '/build/public/js/utils/bootstrap.min.js', '/build/public/js/utils/ie-emulation-modes-warning.js', '/build/public/js/utils/ie10-viewport-bug-workaround.js', '/index.html'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(appCahe).then(function (cache) {
    return cache.addAll(pageSkeleton);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    var whiteList = cacheNames.filter(function (cacheName) {
      return cacheName.indexOf(cacheBasename);
    });
    whiteList.push(appCahe);
    return Promise.all(cacheNames.map(function (key, i) {
      if (whiteList.indexOf(key) === -1) {
        return caches.delete(cacheNames[i]);
      }
    }));
  }).then(async function () {
    await (0, _store.saveCountries)();
    await (0, _store.saveCurrencies)();
  }).catch(function (e) {
    return console.log(e);
  }));
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  //fix only-if-cached bug
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  };
  if (event.request.method !== 'GET') return;
  if (url.hostname === 'free.currencyconverterapi.com') {
    if (url.pathname.endsWith('countries')) {
      event.respondWith(serveCountries(event.request));
      return;
    }
    if (url.pathname.endsWith('currencies')) {
      console.log('url', url);
      event.respondWith(serveCurrencies(event.request));
      return;
    }
    if (url.pathname.endsWith('convert')) {
      var params = url.searchParams.get('q');
      if (params[0].split('_') === params[1].split('_').reverse()) {
        event.respondWith(convertCurrency(event.request));
        return;
      }
    }
  }
  event.respondWith(caches.match(event.request).then(function (response) {
    return response || fetch(event.request);
  }));
});

function serveCountries(request) {
  var countries = (0, _store.getCountries)();
  return countries.then(function (dbResponse) {
    var response = new Response(JSON.stringify(dbResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
    var networkFetch = fetch(request).then(async function (networkResponse) {
      var dbPromise = _idb2.default.open('currency-converter-db', 2);
      await dbPromise.then(async function (db) {
        var networkRes = networkResponse.clone();
        await networkRes.json().then(function (res) {
          Object.keys(res.results).map(function (key) {
            var tx = db.transaction('countries', 'readwrite');
            var countryStore = tx.objectStore('countries');
            countryStore.put(res.results[key], key);
            return tx.complete;
          });
        });
      });
      return networkResponse.json().then(function (res) {
        return res.results;
      });
    });
    return response || networkFetch;
  });
};

function serveCurrencies(request) {
  var currencies = (0, _store.getCurrencies)();
  return currencies.then(function (dbResponse) {
    var response = new Response(JSON.stringify(dbResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
    var networkFetch = fetch(request).then(async function (networkResponse) {
      var dbPromise = _idb2.default.open('currency-converter-db', 2);
      await dbPromise.then(async function (db) {
        var networkRes = networkResponse.clone();
        await networkRes.json().then(function (res) {
          Object.keys(res.results).map(function (key) {
            var tx = db.transaction('currencies', 'readwrite');
            var currencyStore = tx.objectStore('currencies');
            currencyStore.put(res.results[key], key);
            return tx.complete;
          });
        });
      });
      return networkResponse.json().then(function (res) {
        return res.results;
      });
    });
    return response || networkFetch;
  });
};

function convertCurrency(request) {
  var url = new URL(request.url);
  var params = url.searchParams.get('q');
  var convParams = params[0].split('_');
  var fromCurrency = convParams[0];
  var toCurrency = convParams[1];
  var convKeys = [fromCurrency + '_' + toCurrency, toCurrency + '_' + fromCurrency];
  var dbFetch = (0, _store.getCurrencyRate)(fromCurrency, toCurrency);
  var networkFetch = fetch(request).then(function (networkResponse) {
    (0, _store.saveCurrencyRates)(networkResponse.clone().json());
    return networkResponse.json();
  });
  return Object.keys(dbFetch) !== convKeys ? networkFetch : dbFetch;
}

},{"./public/js/store":2,"idb":1}]},{},[4])

//# sourceMappingURL=sw.js.map
