import {
  saveToDatabase,
  clearDb,
  getCountries,
  getCurrencies
} from './public/js/store';
const cacheBasename = 'convert-currency';
const cacheVersion = 'v1';
const appCahe = `${cacheBasename}-${cacheVersion}`

const repo = '/CurrencyConverter';

const pageSkeleton = [
  `/`,
  `/build/public/js/main.js`,
  `/build/public/css/bootstrap.min.css`,
  `/build/public/css/style.css`,
  `/build/public/js/utils/jquery-3.2.1.min.js`,
  `/build/public/js/utils/bootstrap.min.js`,
  `/build/public/js/utils/ie-emulation-modes-warning.js`,
  `/build/public/js/utils/ie10-viewport-bug-workaround.js`,
  `/index.html`
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(appCahe).then((cache) => {
      return cache.addAll(pageSkeleton)
    }).then(() => self.skipWaiting())
  )
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
    .then((cacheNames) => {
      const whiteList = cacheNames
        .filter(cacheName => cacheName.indexOf(cacheBasename))
      whiteList.push(appCahe);
      return Promise.all(
        cacheNames.map((key, i) => {
          if (whiteList.indexOf(key) === -1) {
            return caches.delete(cacheNames[i])
          }
        })
      )
    })
    .then(() => clearDb())
    .then(() => saveToDatabase())
  )
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  //fix only-if-cached bug
  if (event.request.cache === 'only-if-cached' &&
    event.request.mode !== 'same-origin') {
    return;
  };
  if (event.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    if (url.pathname.endsWith('countries')) {
      event.respondWith(serveCountries(event.request));
      return;
    }
    if (url.pathname.endsWith('currencies')) {
      event.respondWith(serveCurrencies(event.request));
      return;
    }
  }
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  )
});

function serveCountries(request) {
  const countries = getCountries()
  return countries.then((response) => {
    const networkFetch = fetch(request)
      .then((networkResponse) => {
        const dbPromise = idb.open('currency-converter-db', 1);
        dbPromise.then((db) => {
          const tx = db.transaction('countries', 'readwrite');
          const countryStore = tx.objectStore('countries');
          const countries = networkResponse.clone()
          countries.json().forEach((country) => {
            countryStore.put(country)
          });
          return tx.complete;
        });
        return networkResponse;
      });
    return response || networkFetch;
  })
}

function serveCurrencies(request) {
  const currencies = getCurrencies()
  return currencies.then((response) => {
    const networkFetch = fetch(request)
      .then((networkResponse) => {
        const dbPromise = idb.open('currency-converter-db', 1);
        dbPromise.then((db) => {
          const tx = db.transaction('currencies', 'readwrite');
          const currencyStore = tx.objectStore('currencies');
          const currencies = networkResponse.clone()
          currencies.json().forEach((currency) => {
            currencyStore.put(currency)
          });
          return tx.complete;
        });
        return networkResponse;
      });
    return response || networkFetch;
  })
}