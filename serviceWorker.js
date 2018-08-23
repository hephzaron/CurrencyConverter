import idb from 'idb';
import moment from 'moment';

import {
  saveCountries,
  saveCurrencies,
  saveCurrencyRates,
  saveCurrencyHistory,
  getCurrencyHistory,
  getCountries,
  getCurrencies,
  getCurrencyRate
} from './build/public/js/store';

const cacheBasename = 'convert-currency';
const cacheVersion = 'v1';
const appCahe = `${cacheBasename}-${cacheVersion}`;

const repo = '/CurrencyConverter';

const pageSkeleton = [
  `${repo}/`,
  `${repo}/build/public/js/main.js`,
  `${repo}/build/public/js/plot.js`,
  `${repo}/build/public/css/bootstrap.min.css`,
  `${repo}/build/public/css/style.css`,
  `${repo}/build/public/imgs/forex-online.jpg`,
  `${repo}/build/public/js/utils/jquery-3.2.1.min.js`,
  `${repo}/build/public/js/utils/bootstrap.min.js`,
  `${repo}/build/public/js/utils/ie-emulation-modes-warning.js`,
  `${repo}/build/public/js/utils/ie10-viewport-bug-workaround.js`,
  `${repo}/index.html`
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
        })
        .then(() => saveCurrencyHistory({
          fromCurrency: 'AFN',
          toCurrency: 'AFN',
          startDate: moment().subtract(6, 'days').format('YYYY-MM-DD'),
          endDate: moment().format('YYYY-MM-DD')
        }))
      )
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
      event.respondWith(serveCurrencies(event.request))
      return;
    }
    if (url.pathname.endsWith('convert') && !url.searchParams.get('date')) {
      event.respondWith(convertCurrency(event.request))
      return;
    }
    if (url.searchParams.get('date') && url.searchParams.get('endDate')) {
      event.respondWith(plotCurrencyHistory(event.request))
      return;
    }
  }
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  )
});


const serveCurrencies = (request) => {
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
      return networkResponse;
    })
    .catch(() => {
      const currencies = getCurrencies()
      return currencies
        .then((dbResponse) => {
          const response = new Response(JSON.stringify(dbResponse), {
            headers: { 'Content-Type': 'application/json' }
          });
          return response;
        });
    });
  return networkFetch;
};

const plotCurrencyHistory = (request) => {
  const url = new URL(request.url);
  const params = url.searchParams.get('q').split(',');
  const convParams = params[0].split('_');
  const startDate = url.searchParams.get('date');
  const endDate = url.searchParams.get('endDate');
  const fromCurrency = convParams[0];
  const toCurrency = convParams[1];
  const currKeys = [`${fromCurrency}_${toCurrency}`];
  const networkFetch = fetch(request)
    .then(async(networkResponse) => {
      const dbPromise = idb.open('currency-history-db', 1);
      await dbPromise.then(async(db) => {
        const networkRes = networkResponse.clone();
        await networkRes.json().then((res) => {
          Object.keys(res).map((key) => {
            const tx = db.transaction('history', 'readwrite');
            const currencyHistoryStore = tx.objectStore('history');
            currencyHistoryStore.put(res[key], key);
            return tx.complete;
          });
        });
      });
      return networkResponse
    })
    .catch(() => {
      const dbFetch = getCurrencyHistory(fromCurrency, toCurrency);
      return dbFetch
        .then((dbResponse) => {
          const response = new Response(JSON.stringify(dbResponse), {
            headers: { 'Content-Type': 'application/json' }
          });
          return response;
        });
    });
  return networkFetch;
}

const convertCurrency = (request) => {
  const url = new URL(request.url);
  const params = url.searchParams.get('q').split(',');
  const convParams = params[0].split('_');
  const fromCurrency = convParams[0];
  const toCurrency = convParams[1];
  const convKeys = [`${fromCurrency}_${toCurrency}`, `${toCurrency}_${fromCurrency}`]
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
      return networkResponse;
    })
    .catch(() => {
      const dbFetch = getCurrencyRate(fromCurrency, toCurrency);
      return dbFetch
        .then((dbResponse) => {
          const response = new Response(JSON.stringify({ dbResponse }), {
            headers: { 'Content-Type': 'application/json' }
          });
          return response;
        })
    })

  return networkFetch;
}