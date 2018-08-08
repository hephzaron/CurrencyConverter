class HandleRequest {
  constructor() {
    this.baseUrl = 'https://free.currencyconverterapi.com/api/v5';
  }

  fetchCurrencies() {
    return fetch(`${this.baseUrl}/currencies`)
      .then((response) => {
        return response.json();
      })
      .catch(error => console.log('err', error))
  }

  fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate) {
    const query = `${fromCurrency}_${toCurrency},${toCurrency}_${fromCurrency}`;
    const url = `${this.baseUrl}/convert?q=${query}&compact=ultra&date=${startDate}&endDate=${endDate}`
    return fetch(url)
      .then((response) => {
        if (!response) return;
        return response.json()
      })
      .catch(error => console.log(error))
  }

  fetchConversionRates(fromCurrency, toCurrency) {
    const query = `${fromCurrency}_${toCurrency},${toCurrency}_${fromCurrency}`;
    const url = `${this.baseUrl}/convert?q=${query}&compact=ultra`;
    return fetch(url)
      .then((response) => {
        if (!response) return;
        return response.json()
      })
      .catch(error => console.log(error));
  }
}

export default HandleRequest;