/**
 * @class HandleRequest
 * @description Handle third party based api
 * @returns { null }
 */
class HandleRequest {
  constructor() {
    this.baseUrl = 'https://free.currencyconverterapi.com/api/v5';
  }

  /**
   * @method fetchCurrencies
   * @description fetch currency from newtork
   * @memberof HandleRequest
   * @param { null }
   * @returns { promise } response - network response
   */
  fetchCurrencies() {
    return fetch(`${this.baseUrl}/currencies`)
      .then(response => response)
      .catch(error => console.log(error))
  }

  /**
   * @method fetchHistoricalData
   * @description fetch currency history from newtork
   * @memberof HandleRequest
   * @param { string } fromCurrency - initiator
   * @param { string } toCurrency - receiver
   * @param { string } startDate
   * @param { string } endDate
   * @returns { promise } response - network response
   */
  fetchHistoricalData(fromCurrency, toCurrency, startDate, endDate) {
    const query = `${fromCurrency}_${toCurrency},${toCurrency}_${fromCurrency}`;
    const url = `${this.baseUrl}/convert?q=${query}&compact=ultra&date=${startDate}&endDate=${endDate}`
    return fetch(url)
      .then((response) => {
        if (!response) return;
        return response
      })
      .catch(error => console.log(error))
  }
}

export default HandleRequest;