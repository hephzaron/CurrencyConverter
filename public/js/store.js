import idb from 'idb';
import HandleRequest from './vendor';

const handleRequest = new HandleRequest();

export const saveCurrencies = () => {
  console.log(1);
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

export const saveCurrencyRates = (options) => {
  console.log(2)
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

export const getCurrencies = () => {
  const dbPromise = idb.open('currencies-db', 1);
  return dbPromise.then((db) => {
    const tx = db.transaction('currencies');
    const currencyStore = tx.objectStore('currencies');
    return currencyStore.getAll();
  });
}

export const getCurrencyRate = (fromCurrency, toCurrency) => {
  const dbPromise = idb.open('currencies-rates-db', 1);
  return dbPromise.then((db) => {
    let results = {};
    const tx = db.transaction('currency-rates');
    const currencyRateStore = tx.objectStore('currency-rates');
    currencyRateStore.get(`${fromCurrency}_${toCurrency}`)
      .onsuccess = (e) => {
        results[`${fromCurrency}_${toCurrency}`] = e.target.result
      };
    currencyRateStore.get(`${toCurrency}_${fromCurrency}`)
      .onsuccess = (e) => {
        results[`${toCurrency}_${fromCurrency}`] = e.target.result
      };
    console.log('dbResult', results);
    return results;
  })
}

export default {};