import HandleRequest from './vendor';

if (navigator.serviceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope)
      }, (error) => {
        console.log('ServiceWorker registration fail', error)
      })
  })
}

(() => {
  const handleRequest = new HandleRequest();
  console.log('mine', handleRequest.fetchCountries());
  const fromTo = document.getElementById('fromTo');
  const toFrom = document.getElementById('toFrom');
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  const rateFrom = document.getElementById('rateFrom');
  const rateTo = document.getElementById('rateTo');
  let countries = {};
  let fromCountry;
  let toCountry;

  handleRequest.fetchCountries()
    .then((response) => {
      if (!response) return;
      console.log('grrr:', response);
      Object.assign(countries, response.json());
    });

  Object.keys(countries).map((key) => {
    fromTo.innerHTML = `<option value=${key}>${countries[key].currencyName}</option>`
    toFrom.innerHTML = `<option value=${key}>${countries[key].currencyName}</option>`
  });

  fromTo.addEventListener('change', (event) => {
    fromCountry = countries[event.value];
    fromInput.setAttribute('placeholder', fromCountry.currencySymbol);
    rateFrom.innerText = `1 ${fromCountry.currencyId} = ${toCountry.currencyId}`;
    rateTo.innerText = `1 ${toCountry.currencyId} = ${fromCountry.currencyId}`;
  });

  toFrom.addEventListener('change', (event) => {
    toCountry = countries[event.value];
    toInput.setAttribute('placeholder', toCountry.currencySymbol);
    rateFrom.innerText = `1 ${fromCountry.currencyId} = ${toCountry.currencyId}`;
    rateTo.innerText = `1 ${toCountry.currencyId} = ${fromCountry.currencyId}`;
  })
})()