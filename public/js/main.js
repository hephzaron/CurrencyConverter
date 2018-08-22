import moment from 'moment';
import HandleRequest from './vendor';
import { showTrends } from './plot';

if (navigator.serviceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      .then((registration) => {
        if (!navigator.serviceWorker.controller) {
          return;
        }
        console.log('ServiceWorker registration successful with scope: ', registration.scope)
      }, (error) => {
        console.log('ServiceWorker registration fail', error)
      });

    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  })
}

(() => {
  const handleRequest = new HandleRequest();
  const fromTo = document.getElementById('fromTo');
  const toFrom = document.getElementById('toFrom');
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  const fromBtn = document.getElementById('fromBtn');
  const toBtn = document.getElementById('toBtn');
  const rateFrom = document.getElementById('rateFrom');
  const rateTo = document.getElementById('rateTo');
  let currencies;
  let fromToHtml = [];
  let toFromHtml = [];
  let fromCurrency = [{ id: 'AFN' }];
  let toCurrency = [{ id: 'AFN' }];
  let fromCurrencyValue;
  let toCurrencyValue;
  let apiUrl = 'https://free.currencyconverterapi.com/api/v5'
  const calcDay = (step) => {
    return moment().subtract(step, 'days').format('YYYY-MM-DD')
  }

  const validate = (input) => {
    const re = /^\d*$/g
    const isValid = re.test(input)
    return { isValid }
  }

  window.addEventListener('load', (event) => {
    event.preventDefault();
    fetch(`${apiUrl}/currencies`).then((response) => {
      response.json()
        .then((data) => {
          currencies = Object.values(data.results) || data
          loadCurrency(currencies);
          showTrends({
            ['AFN_AFN']: {
              [`${calcDay(0)}`]: 1,
              [`${calcDay(1)}`]: 1,
              [`${calcDay(2)}`]: 1,
              [`${calcDay(3)}`]: 1,
            }
          });
        });
    });
  })

  function loadCurrency(currencies) {
    const arr = currencies.sort((prev, next) => {
      return prev['currencyName'].localeCompare(next['currencyName']);
    })
    for (let i = 0; i < arr.length; i++) {
      fromToHtml.push(`<option value=${arr[i]['id']} >${arr[i]['currencyName']}</option>`);
      toFromHtml.push(`<option value=${arr[i]['id']}>${arr[i]['currencyName']}</option>`);
    }
    fromBtn.innerText = arr[0].currencySymbol;
    toBtn.innerText = arr[0].currencySymbol;
    fromTo.innerHTML = fromToHtml.join('');
    toFrom.innerHTML = toFromHtml.join('');
  }

  fromTo.addEventListener('change', (event) => {
    event.preventDefault();
    changeFromCurrency(event.target.value);
    const previous = moment().subtract(6, 'days').format('YYYY-MM-DD');
    const today = moment().format('YYYY-MM-DD');
    handleRequest
      .fetchHistoricalData(fromCurrency[0].id, toCurrency[0].id, previous, today)
      .then((response) => {
        const key = `${fromCurrency[0].id}_${toCurrency[0].id}`
        if (!response) return;
        response.json().then((data) => {
          showTrends({
            [`${key}`]: data[`${key}`]
          })
        })
      })
  });

  function changeFromCurrency(id) {
    fromCurrency = currencies.filter(el => el.id === id);
    const fromCurrencySymbol = fromCurrency[0].currencySymbol ? fromCurrency[0].currencySymbol : fromCurrency[0].id
    const fromCurrencyId = fromCurrency[0].id;
    fromBtn.innerText = fromCurrencySymbol;
    //rateFrom.innerText = `1 ${fromCurrencyId} = ${toCurrency[0].id}`;
    //rateTo.innerText = `1 ${toCurrency[0].id}  = ${fromCurrencyId}`;
  }

  toFrom.addEventListener('change', (event) => {
    event.preventDefault();
    changeToCurrency(event.target.value);
    const previous = moment().subtract(6, 'days').format('YYYY-MM-DD');
    const today = moment().format('YYYY-MM-DD');
    handleRequest
      .fetchHistoricalData(fromCurrency[0].id, toCurrency[0].id, previous, today)
      .then((response) => {
        const key = `${fromCurrency[0].id}_${toCurrency[0].id}`
        if (!response) return;
        response.json().then((data) => {
          showTrends({
            [`${key}`]: data[`${key}`]
          })
        })
      })
  });

  function changeToCurrency(id) {
    toCurrency = currencies.filter(el => el.id === id);
    const toCurrencySymbol = toCurrency[0].currencySymbol ? toCurrency[0].currencySymbol : toCurrency[0].id
    const toCurrencyId = toCurrency[0].id;
    toBtn.innerText = toCurrencySymbol;
    //rateFrom.innerText = `1 ${fromCurrency[0].id} = ${toCurrencyId}`;
    //rateTo.innerText = `1 ${toCurrencyId}  = ${fromCurrency[0].id}`;
  }

  fromInput.addEventListener('input', (event) => {
    event.preventDefault();
    const { isValid } = validate(event.target.value)
    if (!isValid) {
      alert('Please enter a valid number')
      fromInput.value = fromInput.value.slice(0, -1)
      return;
    }
    const response = handleRequest.fetchConversionRates(fromCurrency[0].id, toCurrency[0].id);
    const key = `${fromCurrency[0].id}_${toCurrency[0].id}`;
    response.then((data) => {
      toInput.value = ((event.target.value) * parseFloat(data[key])).toFixed(2)
    });
  });

  toInput.addEventListener('input', (event) => {
    event.preventDefault();
    const { isValid } = validate(event.target.value)
    if (!isValid) {
      alert('Please enter a valid number');
      toInput.value = toInput.value.slice(0, -1);
      return;
    }
    const response = handleRequest.fetchConversionRates(fromCurrency[0].id, toCurrency[0].id);
    const key = `${toCurrency[0].id}_${fromCurrency[0].id}`;
    response.then((data) => {
      fromInput.value = ((event.target.value) * parseFloat(data[key])).toFixed(2);
    });
  });

})()