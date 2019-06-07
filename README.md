# About Uniswap
Uniswap is a brand new take on a fully decentralized DEX on Ethereum, one which provides immediate, fully on-chain settlement without requiring liquidity providers to operate advanced market-making bots. Allowing anyone to provide liquidity significantly opens up the pool of liquidity beyond advanced users, increasing the total amount of liquidity on Uniswap exchange. 

Uniswap operates under the "Constant Product" model, where the exchange rate for tokens is based on an extremely simple formula that considers the current balance of ether against he tokens being exchanged. For instance, ion the ETH-DAI market, if the contract had a balance of 1,000 ether and 100,000 DAI, the "price" at that moment would be 1 ETH = 100 DAI. However, as users either buy or sell DAI, that rate changes at the moment of sale; the more you buy, the more each costs. As an example, given our above balances:
1,000 ETHER  * 100,000 DAI = 100,000,000 (constant product)

if you wanted to exchange 100 ether for DAI, you deposit the Ether, and see how much DAI you can withdraw without impacting the product:
```
1,100 * (100,000-x) = 100,000,000
1,100 * 90,909 = 100,000,000

100,000 - x = 90,909
x = 9091 DAI (how much you can draw)
Price = 1 ether = 90.91 DAI
```
Notice this exchange rate isn't 1 ether = 100 dai as mentioned above; we were operating on a significant quantity of the total liquidity and the purchase itself changed the price significantly. 1 ETH = 90.91 DAI becomes the new price available to everyone; buying and selling into this market is the only way price changes. Instead of relying on market makers to set the price and spread, you intentionally rely on arbitrage.

A market with more liquidity will change the price more slowly with the same volume (run the numbers above but instead use 10,000 Ether and 1,000,000 DAI). Users who provide liquidity must do so as a pair of tokens. For instance, the Uniswap ETH-DAI contract would require liquidity providers to supply both ETH AND DAI, keeping the ratio of those tokens the same while increasing the balance of both. If the current balance of each was 1,000 ETH : 100,000 DAI, you could provide liquidity by providing 1 ETH and 100 DAI (providing you liquidity tokens you could later reclaim from the market)

# This Project

The above formulas relating both to the current price, and how much the price changes as volume increases requires knowing only 2 values at a point in time: Ether balance and token balance of the market contract. This would normally require an archive node and multiple off-chain calls. Amberdata already collected this data in postgres making querying it extremely fast and easy. A new endpoint has been added for retrieving these values over time using the following endpoint to data-api:

## Liquidity Endpoint
```
$ curl -s 'https://web3api.io/api/v1/market/orders/uniswap/eth_dai/liquidity' -H "x-api-key: $API_KEY"  | jq . | head -n 23
{
 "status": 200,
 "title": "OK",
 "description": "Successful request",
 "payload": [
   {
     "timestamp": 1559865532000,
     "blockNumber": "7908742",
     "etherBalance": "3324430283894099142288",
     "tokenBalance": "828792193254129030902677"
   },
   {
     "timestamp": 1559865517000,
     "blockNumber": "7908740",
     "etherBalance": "3322930303743208056464",
     "tokenBalance": "829165190040182952588747"
   },
   {
     "timestamp": 1559865500000,
     "blockNumber": "7908734",
     "etherBalance": "3322120127262793325731",
     "tokenBalance": "829366794677970374451162"
   },
```

With options:
```
$ curl -s 'https://web3api.io/api/v1/market/orders/uniswap/eth_zrx/liquidity?timeFormat=iso&startDate=1559815500000&endDate=1559865532000' -H "x-api-key: $API_KEY"  | jq . | head -n 23
{
  "status": 200,
  "title": "OK",
  "description": "Successful request",
  "payload": [
    {
      "timestamp": "2019-06-06T23:01:42.000Z",
      "blockNumber": "7908472",
      "etherBalance": "347660842874075342316",
      "tokenBalance": "267458136974184976315471"
    },
    {
      "timestamp": "2019-06-06T22:32:48.000Z",
      "blockNumber": "7908344",
      "etherBalance": "337111576953296679754",
      "tokenBalance": "259342506274184979058454"
    },
    {
      "timestamp": "2019-06-06T19:38:49.000Z",
      "blockNumber": "7907611",
      "etherBalance": "347660842834227753835",
      "tokenBalance": "267458136943529922701354"
    },
```

## Standard Order Book Endpoint
We can also use a single pair of these numbers to reconstruct an order book by iterating through various volumes and reporting which prices were emitted. We also modified our standard order book snapshot endpoint to support Uniswap using this logic:
```
$ curl -s 'https://web3api.io/api/v1/market/orders/eth_zrx?exchange=uniswap' -H "x-api-key: $API_KEY"  | jq .
{
  "status": 200,
  "title": "OK",
  "description": "Successful request",
  "payload": {
    "metadata": {
      "columns": [
        "price",
        "volume",
        "numOrders"
      ],
      "requestedTimestamp": 1559942084862,
      "returnedTimestamp": 1559931517000
    },
    "data": {
      "bid": [
        [ 661.3182737611725, 49, 1 ],
        [ 662.9167671038554, 48, 1 ],
...
        [ 743.8230930428307, 3, 1 ],
        [ 745.8459262955631, 2, 1 ],
        [ 747.8797917751368, 1, 1 ],
        [ 749.7197780376213, 0.1, 1 ]
      ],
      "ask": [
        [ 754.6495528334601, 0.1, 1 ],
        [ 756.5174080836109, 1, 1 ],
        [ 758.6036772163081, 2, 1 ],
        [ 760.7014848941935, 3, 1 ],
...
        [ 863.3643269502593, 46, 1 ],
        [ 866.0825798918668, 47, 1 ],
...
```

# The Uniswap Depth UI
While the Standard order book snapshot is a convenient format for those that already integrated into the standard order book API and already have logic for interpreting an order book as a list of orders, the response is both large in total output (the above is almost 3K of JSON) and also inaccurate, since there aren't "steps" in price; the Uniswap order book price is perfectly continuous across any volume that it can fulfill. Reporting on Uniswap depth as an orderbook is similar to converting a 64-byte SVG into a 1MB bitmap; bitmaps are portable, but the source SVG will always be better, so let's treat Uniswap as an SVG!

 I also created a simple UI based on jQuery and Amcharts to retrieve Uniswap balance pairs over a range of time, and view them as if they were a standard depth chart, continuously. By default, it retrieves the lesser of 3 days worth or 500 data points. Each data point is a capable of fulling rendering the follow chart for a specific (block)time

![screenshot](https://github.com/amberdata/unidepth/raw/master/screenshot.png)

The color fade here happns at 2% of the price. Because the chart looks so perfect/continuous, it can sometimes be hard to see what the liquidity is, as the shape is almost always identical. That dark colored bar shows how much volume you can get before you cross the 2% price difference threshold.

# To run
You only need to clone this repo (amberdata/unidepth) and open up index.html inside. All assets are self-contained and there is no build process. The changes required to production APIs have been deployed.
