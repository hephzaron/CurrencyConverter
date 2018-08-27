import idb from 'idb';
import HandleRequest from './vendor';

const handleRequest = new HandleRequest();

/**
 * Save currencies to db
 * @function saveCurrencies
 * @param { null } 
 * @returns { promise } idb object
 */
export const saveCurrencies = () => {
  const dbPromise = idb.open('currencies-db', 1, (upgradeDb) => {
    if (!upgradeDb.objectStoreNames.contains('currencies')) {
      return upgradeDb.createObjectStore('currencies');
    }
  });

  return dbPromise.then((db) => {
    const fetchedResponse = handleRequest.fetchCurrencies();
    return fetchedResponse.then((currencies) => {
      if (!currencies.results) {
        return Promise.reject('Currencies cannot be fetched from network')
      }
      const addCurrency = Object.keys(currencies.results).map((key) => {
        const tx = db.transaction('currencies', 'readwrite');
        const currencyStore = tx.objectStore('currencies');
        currencyStore.put(currencies.results[key], key);
        return tx.complete;
      });
      return Promise.resolve(addCurrency);
    });
  });
}

/**
 * Save currency history to db
 * @function saveCurrencyHistory
 * @param { object } data - currency data to be saved
 * @returns { promise } idb object
 */
export const saveCurrencyHistory = (data) => {
  const { fromCurrency, toCurrency, startDate, endDate } = data;
  const dbPromise = idb.open('currency-history-db', 1, (upgradeDb) => {
    if (!upgradeDb.objectStoreNames.contains('history')) {
      return upgradeDb.createObjectStore('history');
    }
  });
  if (typeof data !== 'object' || !data) return;
  return dbPromise.then((db) => {
    const fetchedResponse = handleRequest
      .fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate);
    return fetchedResponse.then((data) => {
      const historicalData = Object.keys(data).map((key) => {
        const tx = db.transaction('history', 'readwrite');
        const currencyHistoryStore = tx.objectStore('history');
        currencyHistoryStore.put(data[key], key);
        return tx.complete
      });
      return Promise.resolve(historicalData);
    });
  })
}

/**
 * Save currency rates to db
 * @function saveCurrencyRates
 * @param { object } options - currency conversion rates to be saved 
 * @returns { promise } idb object
 */
export const saveCurrencyRates = (options) => {
  const { amount, fromCurrency, toCurrency } = options;
  const dbPromise = idb.open('currencies-rates-db', 1, (upgradeDb) => {
    if (!upgradeDb.objectStoreNames.contains('currency-rates')) {
      return upgradeDb.createObjectStore('currency-rates');
    }
  });
  if (typeof options !== 'object' || !options) return;
  return dbPromise.then((db) => {
    const fetchedResponse = handleRequest.fetchConversionRates(fromCurrency, toCurrency);
    return fetchedResponse.then((data) => {
      const addCurrencyRates = Object.keys(data).map((key) => {
        const tx = db.transaction('currency-rates', 'readwrite');
        const currencyStore = tx.objectStore('currency-rates');
        currencyStore.put(data[key], key);
        return tx.complete
      });
      return Promise.resolve(addCurrencyRates);
    });
  })
}

/**
 * Get currencies from idb object store
 * @function getCurrencies
 * @param { null } 
 * @returns { promise } currencies
 */
export const getCurrencies = () => {
  const dbPromise = idb.open('currencies-db', 1);
  return dbPromise.then((db) => {
    const tx = db.transaction('currencies');
    const currencyStore = tx.objectStore('currencies');
    return currencyStore.getAll();
  });
}

/**
 * Get currency rate from idb object store
 * @function getCurrencyRate
 * @param { string } fromCurrency - initiator
 * @param { string } toCurrency - receiver
 * @returns { promise } currencies
 */
export const getCurrencyRate = (fromCurrency, toCurrency) => {
  const dbPromise = idb.open('currencies-rates-db', 1);
  return dbPromise.then((db) => {
    const tx = db.transaction('currency-rates');
    const currencyRateStore = tx.objectStore('currency-rates');
    const rate = currencyRateStore.get(`${fromCurrency}_${toCurrency}`);
    return rate.then((res) => {
      if (!res) return;
      return res;
    });
  });
}

/**
 * Get currency history from idb object store
 * @function getCurrencyHistory
 * @param { string } fromCurrency - initiator
 * @param { string } toCurrency - receiver
 * @returns { promise } result
 */
export const getCurrencyHistory = (fromCurrency, toCurrency) => {
  const dbPromise = idb.open('currency-history-db', 1);
  return dbPromise.then((db) => {
    const tx = db.transaction('history');
    const currencyHistoryStore = tx.objectStore('history');
    const result = currencyHistoryStore.get(`${fromCurrency}_${toCurrency}`);
    return result.then((res) => {
      if (!res) return;
      return res
    })
  })
}

export default {};