import idb from 'idb';
import HandleRequest from './vendor';

const handleRequest = new HandleRequest();

export const clearDb = () => {
  const DBDeleteRequest = idb.delete('currency-converter-db');
  DBDeleteRequest.then(() => console.log('Database deleted successfuly'));
  DBDeleteRequest.catch(e => console.log('error deleting databse:', e.mesage))
  return DBDeleteRequest;
};

export const saveCountries = function() {
  const dbPromise = idb.open('currency-converter-db', 1, function(upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('countries')) {
      return upgradeDb.createObjectStore('countries')
    }
  });

  return dbPromise.then((db) => {
    const tx = db.transaction('countries', 'readwrite');
    const countryStore = tx.objectStore('countries');
    const countries = handleRequest.fetchCountries();
    countries.forEach((country) => {
      countryStore.put(country)
    })
    return tx.complete;
  });

}

export const saveCurrencies = function() {
  const dbPromise = idb.open('currency-converter-db', 2, function(upgradeDb) {
    console.log('opened')
    if (!upgradeDb.objectStoreNames.contains('currencies')) {
      console.log('created')
      return upgradeDb.createObjectStore('currencies');
    }
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

}

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