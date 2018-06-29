const staticCacheName = 'convert-currency-v1';
const webContentCache = 'web-content-v1';
const pageSkeleton = [
  '/build/public/css/bootstrap.min.css',
  '/build/public/css/style.css',
  '/build/public/js/utils/jquery-3.2.1.min.js',
  '/build/public/js/utils/bootstrap.min.js',
  '/build/public/js/utils/ie-emulation-modes-warning.js',
  '/build/public/js/utils/ie10-viewport-bug-workaround.js',
  '/build/main.js',
  '/index.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('convert-currency-v1').then((cache) => {
      return cache.addAll(pageSkeleton)
    })
  )
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
    .then(response =>
      response ? response : fetch(event.request)))
})