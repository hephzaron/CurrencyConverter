import idb from 'idb'

import {
  saveCountries,
  saveCurrencies,
  saveCurrencyRates,
  getCountries,
  getCurrencies,
  getCurrencyRate
} from './public/js/store';

const cacheBasename = 'convert-currency';
const cacheVersion = 'v3';
const appCahe = `${cacheBasename}-${cacheVersion}`;

const repo = '/CurrencyConverter';

const pageSkeleton = [
  `/`,
  `/build/public/js/main.js`,
  `/build/public/js/plot.js`,
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
    .then(() => saveCurrencies()
      .then(() => saveCurrencyRates({
        amount: 1,
        fromCurrency: 'AFN',
        toCurrency: 'AFN'
      }))
    )
    .catch(e => console.log(e))
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
  if (url.hostname === 'free.currencyconverterapi.com') {
    if (url.pathname.endsWith('currencies')) {
      console.log('url', url)
      event.respondWith(serveCurrencies(event.request))
      return;
    }
    if (url.pathname.endsWith('convert')) {
      const params = url.searchParams.get('q');
      if (params[0].split('_') === params[1].split('_').reverse()) {
        event.respondWith(convertCurrency(event.request))
        return;
      }
    }
  }
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  )
});

function serveCurrencies(request) {
  const currencies = getCurrencies()
  return currencies.then((dbResponse) => {
    const response = new Response(JSON.stringify(dbResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
    const networkFetch = fetch(request)
      .then(async(networkResponse) => {
        const dbPromise = idb.open('currencies-db', 1);
        await dbPromise.then(async(db) => {
          const networkRes = networkResponse.clone();
          await networkRes.json().then((res) => {
            Object.keys(res.results).map((key) => {
              const tx = db.transaction('currencies', 'readwrite');
              const currencyStore = tx.objectStore('currencies');
              currencyStore.put(res.results[key], key);
              return tx.complete;
            });
          });
        });
        return networkResponse.json().then(res => res.results)
      });
    return response || networkFetch;
  });
};

function convertCurrency(request) {
  const url = new URL(request.url);
  const params = url.searchParams.get('q');
  const convParams = params[0].split('_');
  const fromCurrency = convParams[0];
  const toCurrency = convParams[1];
  const convKeys = [`${fromCurrency}_${toCurrency}`, `${toCurrency}_${fromCurrency}`]
  const dbFetch = getCurrencyRate(fromCurrency, toCurrency);
  return dbFetch.then((dbResponse) => {
    const response = new Response(JSON.stringify(dbResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
    const networkFetch = fetch(request)
      .then(async(networkResponse) => {
        const dbPromise = idb.open('currencies-rates-db', 1);
        await dbPromise.then(async(db) => {
          const networkRes = networkResponse.clone();
          await networkRes.json().then((res) => {
            Object.keys(res).map((key) => {
              const tx = db.transaction('currency-rates', 'readwrite');
              const currencyStore = tx.objectStore('currency-rates');
              currencyStore.put(res[key], key);
              return tx.complete;
            });
          });
        });
        return networkResponse.json()
      });
    return (Object.keys(dbResponse) !== convKeys) ? networkFetch : response
  });
}