import idb from 'idb';
import HandleRequest from './vendor';

const handleRequest = new HandleRequest();

export const saveCountries = () => {
  const dbPromise = idb.open('currency-converter-db', 1, (upgradeDb) => {
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
  const dbPromise = idb.open('currency-converter-db', 3, (upgradeDb) => {
    if (!upgradeDb.objectStoreNames.contains('currency-rates')) {
      return upgradeDb.createObjectStore('currency-rates');
    }
  });
  if (typeof options !== 'object' || !options) return;
  return dbPromise.then((db) => {
    const addCurrencyRates = Object.keys(options).map((key) => {
      const tx = db.transaction('currency-rates', 'readwrite');
      const currencyStore = tx.objectStore('currency-rates');
      currencyStore.put(options[key], key);
      return tx.complete
    });
    return Promise.resolve(addCurrencyRates);
  })
}

export const getCountries = () => {
  const dbPromise = idb.open('currency-converter-db', 1);
  return dbPromise.then((db) => {
    const tx = db.transaction('countries');
    const countryStore = tx.objectStore('countries');
    const keyStore = countryStore.getAllKeys();
    let countries = {};
    return keyStore.then((keys) => {
      return keys.map((key, index) => {
        return countryStore.get(key).then((value) => {
          let data = Object.assign(countries, {
            [key]: value
          })
          if (index === keys.length - 1) {
            return data
          }
          return;
        });
      });
    });
  })
}

export const getCurrencies = () => {
  const dbPromise = idb.open('currency-converter-db', 2);
  return dbPromise.then((db) => {
    const tx = db.transaction('currencies');
    const currencyStore = tx.objectStore('currencies');
    const keyStore = currencyStore.getAllKeys();
    let currencies = {};
    return keyStore.then((keys) => {
      return keys.map((key, index) => {
        return currencyStore.get(key).then((value) => {
          let data = Object.assign(currencies, {
            [key]: value
          })
          if (index === keys.length - 1) {
            return data
          }
          return;
        });
      });
    });
  })
}

export const getCurrencyRate = (fromCurrency, toCurrency) => {
  const dbPromise = idb.open('currency-converter-db', 3);
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
    return results;
  })
}

export default {};