import idb from 'idb';
import HandleRequest from './vendor';

const handleRequest = new HandleRequest();

export const saveCountries = function() {
  const dbPromise = idb.open('currency-converter-db', 1, function(upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('countries')) {
      return upgradeDb.createObjectStore('countries');
    }
  });

  return dbPromise.then((db) => {
    const fetchedResponse = handleRequest.fetchCountries();
    return fetchedResponse.then((countries) => {
      console.log('countries:', countries.results);
      return Object.keys(countries.results).map((key) => {
        const tx = db.transaction('countries', 'readwrite');
        const countryStore = tx.objectStore('countries');
        countryStore.put(countries.results[key], key);
        return tx.complete;
      });
    });
  });
}

export const saveCurrencies = function() {
  const dbPromise = idb.open('currency-converter-db', 2, function(upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('currencies')) {
      return upgradeDb.createObjectStore('currencies');
    }
  });

  return dbPromise.then((db) => {
    const fetchedResponse = handleRequest.fetchCurrencies();
    return fetchedResponse.then((currencies) => {
      console.log('currencies:', currencies.results);
      return Object.keys(currencies.results).map((key) => {
        const tx = db.transaction('currencies', 'readwrite');
        const currencyStore = tx.objectStore('currencies');
        currencyStore.put(currencies.results[key], key);
        return tx.complete;
      });
    });
  });
}

export const getCountries = () => {
  const dbPromise = idb.open('currency-converter-db', 1);
  return dbPromise.then((db) => {
    const tx = db.transaction('countries');
    const countryStore = tx.objectStore('countries');
    return countryStore.getAll();
  })
};

export const getCurrencies = () => {
  const dbPromise = idb.open('currency-converter-db', 2);
  return dbPromise.then((db) => {
    const tx = db.transaction('currencies');
    const currencyStore = tx.objectStore('currencies');
    return currencyStore.getAll();
  })
};

export default {};