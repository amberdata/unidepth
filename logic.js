(function (code) {

  // The global jQuery object is passed as a parameter
  code(window.jQuery, window, document);

}(function ($, window, document) {
console.log("FDIFJS");
  // The $ is now locally scoped

  // Listen for the jQuery ready event on the document
  $(async function () {

    /* Loads up the UI with a default address */
    // await populateUI('0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be')
    let liquidity = await getUniswapLiquidity("eth_dai");
    console.log("FddddDIFJS" + JSON.stringify(liquidity ))
    let payload = liquidity.data.payload;
    window.doSetUni(payload[0].value/1e18, payload[0].numTokens/1e18, 100, 1)
  });


  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  /*                     API data Retrieval                      */
  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  /* Base url for all requests */
  // const BASE_URL = 'https://web3api.io/api/v1/'
  const BASE_URL = 'http://localhost:3000/api/v1/'
  const FILTERS = '?page=0&size=50'

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
  let getUniswapLiquidity = (pair) => axios.get(`${BASE_URL}market/orders/uniswap/${pair}/liquidity`, config)
  let getCurrentTokenTransfers = (address) => axios.get(`${BASE_URL}tokens/${address}/transfers${FILTERS}&includePrice=true`, config)
  let getHistoricalTokenBalances = (address, tokenAddress) => axios.get(`${BASE_URL}tokens/${tokenAddress}/holders/historical?timeFrame=30d&holderAddresses=${address}`, config)
  console.log("FDIFJS");


  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  /*                        UI Building                          */
  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  /* TODO: the image things is pretty ugly find better sol if possible */
  let getTokenTemplate = (token) =>
    `<div class="token" data-address="${token.address}" data-name="${token.name}">
                <div class="logo item">
                    <img src="https://raw.githubusercontent.com/amberdata/tokens/master/images/${token.address}.png" onerror="if (this.src !== 'error.jpg') this.src = 'https://api2.clovers.network/clovers/svg/${token.address}/128';" alt="">
                </div>
                <div class="name item">
                    ${token.name} (${token.symbol})
                </div>
                <div class="value item">
                    Amount: ${round(getAmount(token), 2)}
                </div>
            </div>`

  let updateTokensList = (tokens, holderAddress) => {
    let tokenList = $('#tokens .list')

    // Remove old list and create new
    tokenList.empty()

    let tokenHtml = `${tokens.map(token => getTokenTemplate(token)).join('')}`
    tokenList.append(tokenHtml)
    if (tokenHtml.length > 5) {
      tokenList.append(`
                <a style="color: #606060; margin:15px; 0"
                   href="https://amberdata.io/addresses/${holderAddress}/portfolio"
                   target="_blank">
                    View all token balances
                </a>`)
    }
  }

  const getPrice = (transfer) => {
    if (transfer.price && transfer.price.amount) {
      return  transfer.price.amount.total ? round(transfer.price.amount.total, 2) : '-'
    } else {
      return ' - '
    }
  }

  let getTransferTemplate = (transfer) =>
    `<div class="transfer">
            <div class="name">
                Token: ${transfer.name}
            </div>
            <div class="amount">
                Amount: ${round(getAmount(transfer), 2)}
            </div>
            <div class="price">
                Price:  $${getPrice(transfer)}
            </div>
            <div class="view">
                <a href="https://amberdata.io/transactions/${transfer.transactionHash}" target="_blank">View ></a>
            </div>
        </div>`

  let updateTransfersList = (transfers) => {
    let transferList = $('#token-transfers .list')

    let transferHtml = `${transfers.map(transfer => getTransferTemplate(transfer)).join('')}`
    transferList.append(transferHtml)

  }

  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  /*                      Charts.js methods                      */
  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  let updateChart = async (data, tokenName) => {
    window.chart.data.datasets[0].data = data
    window.chart.data.datasets[0].label = tokenName
    let imgSrc = $(`*[data-name="${tokenName}"] .logo img`).attr("src")
    let vibrant = await Vibrant.from(imgSrc).getPalette();

    let vibRgb = vibrant.Vibrant || vibrant.LightVibrant || vibrant.DarkVibrant || vibrant.Muted || vibrant.LightMuted || vibrant.DarkMuted
    let muteRgb = vibrant.Muted || vibrant.LightMuted  || vibrant.DarkMuted || vibrant.DarkVibrant || vibrant.LightVibrant || vibrant.Vibrant

    window.chart.data.datasets[0].borderColor = `rgba(${vibRgb.get()[0]}, ${vibRgb.get()[1]}, ${vibRgb.get()[2]}, 1)`
    window.chart.data.datasets[0].backgroundColor = `rgba(${muteRgb.get()[0]}, ${muteRgb.get()[1]}, ${muteRgb.get()[2]}, 0.2)`

    window.chart.update();
  }

  let instantiateChart = (data, deviceWidth) => {
    if (window.chart) {
      window.chart.destroy()
    }
    Chart.defaults.global.defaultFontColor = 'white';
    let ctx = $('#holdings-chart')
    window.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Number of Tokens',
          data: data,
          backgroundColor: 'rgba(107, 107, 107, 0.2)',
          borderColor: 'rgba(107, 107, 107, 1)',
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: deviceWidth > 1000,
        aspectRatio: (deviceWidth > 1000 ? 2 : 1),
        title: {
          display: true,
          text: ''
        },
        scales: {
          xAxes: [{
            type: 'time',
            distribution: 'series',
            ticks: {
              autoSkip: true
            },
            display: true,
            gridLines: {
              display: false,
              drawBorder: false,
              color: ['white']
            },
            scaleLabel: {
              display: true,
            }
          }],
          yAxes: [{
            display: true,
            gridLines: {
              drawBorder: false,
              display: false,
              color: ['white']
            },
            scaleLabel: {
              display: true,
              labelString: 'Number of Tokens'
            }
          }]
        },
        tooltips: {
          intersect: false,
          mode: 'index',
          backgroundColor: 'rgba(0, 0, 0, 1)'
        }
      }
    });
  }

  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
  /*                          Listeners                          */
  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  /* Text Input listener
   * Watches the input field and will initiate search after an
   * address is entered.
   */
  let textInput = document.getElementById('address-input-field');
  let timeout = null; // Init a timeout variable to be used below
;

  /**
   * Creates and attaches listener onto the token elements. Triggers
   * updates to the chart upon token selection.
   * @param histHoldings contains time series historical token hodlings
   * @param chart reference to the chart.js instance
   * @return {void | jQuery}
   */

}));
