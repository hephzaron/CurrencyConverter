class HandleRequest {
  constructor() {
    this.baseUrl = 'https://free.currencyconverterapi.com/api/v5';
  }

  fetchCountries() {
    return fetch(`${this.baseUrl}/countries`)
      .then(response => response.json().results)
      .catch(error => console.log(error))
  }

  fetchCurrencies() {
    return fetch(`${this.baseUrl}/currencies`)
      .then(response => response.json().results)
      .catch(error => console.log(error))
  }

  fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate) {
    const query = `${fromCurrency}_${toCurrency},${toCurrency}_${fromCurrency}`;
    const url = `${this.baseUrl}/convert?q=${query}&compact=ultra&date=[${startDate}]&endDate=[${endDate}]`
    return fetch(url)
      .then(response => response.json().results)
      .catch(error => console.log(error))
  }

  convertCurrency(amount, fromCurrency, toCurrency) {
    const query = `${fromCurrency}_${toCurrency},${toCurrency}_${fromCurrency}`;
    const url = `${this.baseUrl}/convert?q=${query}&compact=ultra`;
    return fetch(url)
      .then((response) => {
        const data = response.json().results;
        const fromValue = amount * parseFloat(data[`${fromCurrency}_${toCurrency}`]);
        const toValue = amount * parseFloat(data[`${toCurrency}_${fromCurrency}`]);
        return {
          fromValue,
          toValue,
          data
        }
      })
      .catch(error => console.log(error));
  }
}

export default HandleRequest;