import idb from 'idb';
import HandleRequest from './vendor';

const handleRequest = new HandleRequest();
const dbVersion = 3;

export const saveCountries = () => {
  const dbPromise = idb.open('currency-converter-db', 1, (upgradeDb) => {
    console.log(1);
    if (!upgradeDb.objectStoreNames.contains('countries')) {
      return upgradeDb.createObjectStore('countries');
    }
  });

  return dbPromise.then((db) => {
    const fetchedResponse = handleRequest.fetchCountries();
    return fetchedResponse.then((countries) => {
      if (!countries.results) {
        return Promise.reject('Countries could not be fetched from network')
      }
      const addCountry = Object.keys(countries.results).map((key) => {
        const tx = db.transaction('countries', 'readwrite');
        const countryStore = tx.objectStore('countries');
        countryStore.put(countries.results[key], key);
        return tx.complete;
      });
      return Promise.resolve(addCountry);
    });
  });
}

export const saveCurrencies = () => {
  console.log(2);
  const dbPromise = idb.open('currency-converter-db', 2, (upgradeDb) => {
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
  console.log(3)
  const { amount, fromCurrency, toCurrency } = options;
  const dbPromise = idb.open('currency-converter-db', dbVersion, (upgradeDb) => {
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

export const getCountries = () => {
  const dbPromise = idb.open('currency-converter-db', dbVersion);
  return dbPromise.then((db) => {
    const tx = db.transaction('countries');
    const countryStore = tx.objectStore('countries');
    return countryStore.getAll();
  });
}

export const getCurrencies = () => {
  const dbPromise = idb.open('currency-converter-db', dbVersion);
  return dbPromise.then((db) => {
    const tx = db.transaction('currencies');
    const currencyStore = tx.objectStore('currencies');
    return currencyStore.getAll();
  });
}

export const getCurrencyRate = (fromCurrency, toCurrency) => {
  const dbPromise = idb.open('currency-converter-db', dbVersion);
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