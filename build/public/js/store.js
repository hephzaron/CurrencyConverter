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
exports.getCurrencyHistory = exports.getCurrencyRate = exports.getCurrencies = exports.saveCurrencyRates = exports.saveCurrencyHistory = exports.saveCurrencies = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _idb = require('idb');

var _idb2 = _interopRequireDefault(_idb);

var _vendor = require('./vendor');

var _vendor2 = _interopRequireDefault(_vendor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var handleRequest = new _vendor2.default();

var saveCurrencies = exports.saveCurrencies = function saveCurrencies() {
  var dbPromise = _idb2.default.open('currencies-db', 1, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('currencies')) {
      return upgradeDb.createObjectStore('currencies');
    }
  });

  return dbPromise.then(function (db) {
    var fetchedResponse = handleRequest.fetchCurrencies();
    return fetchedResponse.json().then(function (currencies) {
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

var saveCurrencyHistory = exports.saveCurrencyHistory = function saveCurrencyHistory(data) {
  var fromCurrency = data.fromCurrency,
      toCurrency = data.toCurrency,
      startDate = data.startDate,
      endDate = data.endDate;

  var dbPromise = _idb2.default.open('currency-history-db', 1, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('history')) {
      return upgradeDb.createObjectStore('history');
    }
  });
  if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object' || !data) return;
  return dbPromise.then(function (db) {
    var fetchedResponse = handleRequest.fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate);
    return fetchedResponse.then(function (data) {
      var historicalData = Object.keys(data).map(function (key) {
        var tx = db.transaction('history', 'readwrite');
        var currencyHistoryStore = tx.objectStore('history');
        currencyHistoryStore.put(data[key], key);
        return tx.complete;
      });
      return Promise.resolve(historicalData);
    });
  });
};

var saveCurrencyRates = exports.saveCurrencyRates = function saveCurrencyRates(options) {
  var amount = options.amount,
      fromCurrency = options.fromCurrency,
      toCurrency = options.toCurrency;

  var dbPromise = _idb2.default.open('currencies-rates-db', 1, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('currency-rates')) {
      return upgradeDb.createObjectStore('currency-rates');
    }
  });
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' || !options) return;
  return dbPromise.then(function (db) {
    var fetchedResponse = handleRequest.fetchConversionRates(fromCurrency, toCurrency);
    return fetchedResponse.then(function (data) {
      var addCurrencyRates = Object.keys(data).map(function (key) {
        var tx = db.transaction('currency-rates', 'readwrite');
        var currencyStore = tx.objectStore('currency-rates');
        currencyStore.put(data[key], key);
        return tx.complete;
      });
      return Promise.resolve(addCurrencyRates);
    });
  });
};

var getCurrencies = exports.getCurrencies = function getCurrencies() {
  var dbPromise = _idb2.default.open('currencies-db', 1);
  return dbPromise.then(function (db) {
    var tx = db.transaction('currencies');
    var currencyStore = tx.objectStore('currencies');
    return currencyStore.getAll();
  });
};

var getCurrencyRate = exports.getCurrencyRate = function getCurrencyRate(fromCurrency, toCurrency) {
  var dbPromise = _idb2.default.open('currencies-rates-db', 1);
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

var getCurrencyHistory = exports.getCurrencyHistory = function getCurrencyHistory(fromCurrency, toCurrency) {
  var dbPromise = _idb2.default.open('currency-history-db', 1);
  return dbPromise.then(function (db) {
    var tx = db.transaction('history');
    var currencyHistoryStore = tx.objectStore('history');
    var result = currencyHistoryStore.get(fromCurrency + '_' + toCurrency);
    return result.then(function (res) {
      if (!res) return;
      return res;
    });
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
    key: 'fetchCurrencies',
    value: function fetchCurrencies() {
      return fetch(this.baseUrl + '/currencies').then(function (response) {
        return response;
      }).catch(function (error) {
        return console.log(error);
      });
    }
  }, {
    key: 'fetchHistoricalData',
    value: function fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate) {
      var query = fromCurrency + '_' + toCurrency + ',' + toCurrency + '_' + fromCurrency;
      var url = this.baseUrl + '/convert?q=' + query + '&compact=ultra&date=' + startDate + '&endDate=' + endDate;
      return fetch(url).then(function (response) {
        if (!response) return;
        return response;
      }).catch(function (error) {
        return console.log(error);
      });
    }
  }, {
    key: 'fetchConversionRates',
    value: function fetchConversionRates(fromCurrency, toCurrency) {
      var query = fromCurrency + '_' + toCurrency + ',' + toCurrency + '_' + fromCurrency;
      var url = this.baseUrl + '/convert?q=' + query + '&compact=ultra';
      return fetch(url).then(function (response) {
        if (!response) return;
        return response.json();
      }).catch(function (error) {
        return console.log(error);
      });
    }
  }]);

  return HandleRequest;
}();

exports.default = HandleRequest;

},{}]},{},[2])

//# sourceMappingURL=store.js.map
