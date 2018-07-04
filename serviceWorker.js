import {
  saveCountries,
  saveCurrencies,
  saveCurrencyRates,
  getCountries,
  getCurrencies,
  getCurrencyRate
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
    .then(async() => {
      await saveCountries();
      await saveCurrencies();
    })
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
    if (url.pathname.endsWith('countries')) {
      event.respondWith(serveCountries(event.request));
      return;
    }
    if (url.pathname.endsWith('currencies')) {
      event.respondWith(serveCurrencies(event.request));
      return;
    }
    if (url.pathname.endsWith('convert')) {
      const params = url.searchParams.get('q');
      if (params[0].split('_') === params[1].split('_').reverse()) {
        event.respondWith(convertCurrency(event.request));
        return;
      }
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
          const countries = networkResponse.clone()
          Object.keys(countries.json().results).map((key) => {
            const tx = db.transaction('countries', 'readwrite');
            const countryStore = tx.objectStore('countries');
            countryStore.put(countries.json().results[key], key);
            return tx.complete;
          });
        });
        return networkResponse;
      });
    return response || networkFetch;
  });
};

function serveCurrencies(request) {
  const currencies = getCurrencies()
  return currencies.then((response) => {
    const networkFetch = fetch(request)
      .then((networkResponse) => {
        const dbPromise = idb.open('currency-converter-db', 2);
        dbPromise.then((db) => {
          const currencies = networkResponse.clone()
          Object.keys(currencies.json().results).map((key) => {
            const tx = db.transaction('currencies', 'readwrite');
            const currencyStore = tx.objectStore('currencies');
            currencyStore.put(currencies.json().results[key], key);
            return tx.complete;
          });
        });
        return networkResponse;
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
  const networkFetch = fetch(request)
    .then((networkResponse) => {
      saveCurrencyRates(networkResponse.clone().json())
      return networkResponse().json()
    });
  return (Object.keys(dbFetch) !== convKeys) ? networkFetch : dbFetch

}