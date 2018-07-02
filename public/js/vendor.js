class HandleRequest {
  constructor() {
    this.baseUrl = 'https://free.currencyconverterapi.com/api/v5'
  }

  fetchCountries() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${this.baseUrl}/countries`, true);
    xhr.onload = () => {
      const data = JSON.parse(xhr.response);
      if (xhr.status >= 200 && xhr.status < 400) {
        return data.results
      }
      return {}
    }
  }

  fetchCurrencies() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${this.baseUrl}/currencies`, true);
    xhr.onload = () => {
      const data = JSON.parse(xhr.response);
      if (xhr.status >= 200 && xhr.status < 400) {
        return data.results
      }
      return {}
    }
  }

  fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate) {
    const xhr = new XMLHttpRequest();
    const query = `${fromCurrency}_${toCurrency},${toCurrency}_${fromCurrency}`;
    const url = `${this.baseUrl}/convert?q=${query}&compact=ultra&date=[${startDate}]&endDate=[${endDate}]`
    xhr.open('GET', url, true);
  }

  convertCurrency(amount, fromCurrency, toCurrency) {
    const xhr = new XMLHttpRequest();
    const query = `${fromCurrency}_${toCurrency},${toCurrency}_${fromCurrency}`;
    const url = `${this.baseUrl}/convert?q=${query}&compact=ultra`
    xhr.open('GET', url, true);
    xhr.onload = () => {
      const data = JSON.parse(xhr.response);
      if (xhr.status >= 200 && xhr.status < 400) {
        const fromValue = amount * parseFloat(data[`${fromCurrency}_${toCurrency}`]);
        const toValue = amount * parseFloat(data[`${toCurrency}_${fromCurrency}`]);
        return {
          fromValue,
          toValue,
          data
        }
      }
      return {}
    }
  }
}

export default HandleRequest;