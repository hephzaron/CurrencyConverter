if (navigator.serviceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/build/sw.js', {
        scope: '/'
      })
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope)
      }, (error) => {
        console.log('ServiceWorker registration fail', error)
      })
  })
}