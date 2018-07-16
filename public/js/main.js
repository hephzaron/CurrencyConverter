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
  const fromTo = document.getElementById('fromTo');
  const toFrom = document.getElementById('toFrom');
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  const rateFrom = document.getElementById('rateFrom');
  const rateTo = document.getElementById('rateTo');
  let currencies = [];
  let fromToHtml = [];
  let toFromHtml = [];
  let fromCurrency;
  let toCurrency;

  handleRequest.fetchCurrencies()
    .then((response) => {
      if (!response) return;
      response.map(res => currencies.push(res));
    });


  window.addEventListener('load', (event) => {
    event.preventDefault();
    loadCurrency();
  })

  function loadCurrency() {
    const arr = currencies.sort((prev, next) => {
      return prev['currencyName'].localeCompare(next['currencyName']);
    })
    for (let i = 0; i < arr.length; i++) {
      fromToHtml.push(`<option value=${arr[i]['id']} >${arr[i]['currencyName']}</option>`);
      toFromHtml.push(`<option value=${arr[i]['id']}>${arr[i]['currencyName']}</option>`);
    }
    fromTo.innerHTML = fromToHtml.join('');
    toFrom.innerHTML = toFromHtml.join('');
  }

  fromTo.addEventListener('change', (event) => {
    event.preventDefault();
    changeFromCurrency(event.target.value);
  });

  function changeFromCurrency(id) {
    fromCurrency = currencies.filter(el => el.id === id);
    const fromCurrencySymbol = fromCurrency[0].currencySymbol ? fromCurrency[0].currencySymbol : fromCurrency[0].id
    const fromCurrencyId = fromCurrency[0].id;
    fromInput.setAttribute('placeholder', fromCurrencySymbol);
    rateFrom.innerText = `1 ${fromCurrencyId} = ${toCurrency[0].id}`;
    rateTo.innerText = `1 ${toCurrency[0].id}  = ${fromCurrencyId}`;
  }

  toFrom.addEventListener('change', (event) => {
    event.preventDefault();
    changeToCurrency(event.target.value);
  });

  function changeToCurrency(id) {
    toCurrency = currencies.filter(el => el.id === id);
    const toCurrencySymbol = toCurrency[0].currencySymbol ? toCurrency[0].currencySymbol : toCurrency[0].id
    const toCurrencyId = toCurrency[0].id;
    toInput.setAttribute('placeholder', toCurrencySymbol);
    rateFrom.innerText = `1 ${fromCurrency[0].id} = ${toCurrencyId}`;
    rateTo.innerText = `1 ${toCurrencyId}  = ${fromCurrency[0].id}`;
  }

})()