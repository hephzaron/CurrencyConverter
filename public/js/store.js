import idb from 'idb';
import HandleRequest from './vendor';

const handleRequest = new HandleRequest();

export const clearDb = () => {
  const dbPromise = idb.open('currency-converter-db', 1);
  dbPromise.then((db) => {
    const tx = db.transaction('countries');
    if (!tx) { return; }
    const countryStore = tx.objectStore('countries');
    const countryStoreRequest = countryStore.clear();
    countryStoreRequest.onsuccess = () => {
      console.log('Countries cleared from db');
    }
    countryStoreRequest.onerror = (error) => {
      console.log('oncountryerror :', error)
    }
  });

  return dbPromise.then((db) => {
    const tx = db.transaction('currencies');
    if (!tx) { return; }
    const currencyStore = tx.objectStore('currencies');
    const currencyStoreRequest = currencyStore.clear();
    currencyStoreRequest.onsuccess = () => {
      console.log('Currencies cleared from db')
    }
    currencyStoreRequest.onerror = (error) => {
      console.log('oncurrencyerror :', error)
    }
    return currencyStoreRequest;
  })
};

export const saveToDatabase = () => {
  if (!window.indexedDB) {
    console.log('This browser doesn\'t support indexedDB')
    return;
  };

  const dbPromise = idb.open('currency-converter-db', 1, (upgradeDb) => {
    if (!upgradeDb.objectStoreNames.contains('countries')) {
      upgradeDb.createObjectStore('countries')
    }
    if (!upgradeDb.objectStoreNames.contains('currencies')) {
      upgradeDb.createObjectStore('currencies')
    }
  });

  dbPromise.then((db) => {
    const tx = db.transaction('countries', 'readwrite');
    const countryStore = tx.objectStore('countries');
    const countries = handleRequest.fetchCountries();
    countries.forEach((country) => {
      countryStore.put(country)
    })
    return tx.complete;
  });

  return dbPromise.then((db) => {
    const tx = db.transaction('currencies', 'readwrite');
    const currencyStore = tx.objectStore('currencies');
    const currencies = handleRequest.fetchCurrencies();
    currencies.forEach((currency) => {
      currencyStore.put(currency)
    })
    return tx.complete;
  });

};

export const getCountries = () => {
  const dbPromise = idb.open('currency-converter-db');
  return dbPromise.then((db) => {
    const tx = db.transaction('countries');
    const countryStore = tx.objectStore('countries');
    return countryStore.getAll();
  })
};

export const getCurrencies = () => {
  const dbPromise = idb.open('currency-converter-db');
  return dbPromise.then((db) => {
    const tx = db.transaction('currencies');
    const currencyStore = tx.objectStore('currencies');
    return currencyStore.getAll();
  })
};

export default {};