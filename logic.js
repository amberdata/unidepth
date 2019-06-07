(function (code) {

  // The global jQuery object is passed as a parameter
  code(window.jQuery, window, document);

}(function ($, window, document) {
  $(async function () {

    const searchParams = new URLSearchParams(window.location.search)
    const pair = searchParams.has('pair') ? searchParams.get('pair') : 'eth_dai';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    window.setAxisTitle(pair);

    const liquidity = await getUniswapLiquidity(pair, startDate, endDate);
    const payload = liquidity.data.payload;
    payload.forEach(liquidityItem => {
      $('#timebox').append(new Option(liquidityItem.timestamp, [liquidityItem.etherBalance, liquidityItem.tokenBalance]));
    })

    $('#timebox').change((element) => {
      let liquidityPair = element.target.value.split(",");
      $('#liquidityDetails').text(parseInt(liquidityPair[1] / 1e18).toLocaleString() + " / " + parseInt(liquidityPair[0] / 1e18).toLocaleString() + " = " + (liquidityPair[1] / liquidityPair[0]).toFixed(2))
      console.log(liquidityPair);
      window.doSetUni(parseInt(liquidityPair[0]) / 1e18, parseInt(liquidityPair[1]) / 1e18, 100, 1)
    })
    $('#timebox').trigger('change');
  });

  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  /*                     API data Retrieval                      */
  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  /* Base url for all requests */
  const BASE_URL = 'https://web3api.io/api/v1/'
  // const BASE_URL = 'http://localhost:3000/api/v1/'

  /* Demo key - Get your API Key at amberdata.io/pricing
  * and place yours here! */
  let config = {
    headers: {"x-api-key": "UAK000000000000000000000000demo0001"}
  }

  /**
   * The following methods construct the url and sends it off to axios via the
   * get method.
   * @param address
   */
  let getUniswapLiquidity = (pair, startDate, endDate) => axios.get(`${BASE_URL}market/orders/uniswap/${pair}/liquidity?timeFormat=iso&startDate=${startDate}&endDate=${endDate}`, config)

}));
