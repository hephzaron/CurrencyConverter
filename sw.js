const cacheBasename = 'convert-currency';
const cacheVersion = 'v1';
const appCahe = `${cacheBasename}-${cacheVersion}`

const repo = '/CurrencyConverter';

const pageSkeleton = [
  `${repo}/build/public/css/bootstrap.min.css`,
  `${repo}/build/public/css/style.css`,
  `${repo}/build/public/js/utils/jquery-3.2.1.min.js`,
  `${repo}/build/public/js/utils/bootstrap.min.js`,
  `${repo}/build/public/js/utils/ie-emulation-modes-warning.js`,
  `${repo}/build/public/js/utils/ie10-viewport-bug-workaround.js`,
  `${repo}/build/main.js`,
  `${repo}/index.html`
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('convert-currency-v1').then(function(cache) {
      return cache.addAll(pageSkeleton)
    })
  )
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      const whiteList = cacheNames.filter(
        function(cacheName) {
          return cacheName.indexOf(cacheBasename)
        }
      )
      whiteList.push(appCahe);
      return Promise.all(
        cacheNames.map(function(key, i) {
          if (whiteList.indexOf(key) === -1) {
            return caches.delete(cacheNames[i])
          }
        })
      )
    })
  )
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
    .then(function(response) {
      return response || fetch(event.request)
    })
  )
})