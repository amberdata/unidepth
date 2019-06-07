const initCharts = () => {
  am4core.ready(function () {

    // Themes begin
    // am4core.useTheme(am4themes_animated);
    // Themes end

    // Create chart instance
    var chart = am4core.create("chart--depth", am4charts.XYChart);

    function getInputPrice(input_amount, input_reserve, output_reserve) {
      let input_amount_with_fee = input_amount * 997;
      let numerator = input_amount_with_fee * output_reserve;
      let denominator = (input_reserve * 1000) + input_amount_with_fee;
      return numerator / denominator;
    }

    function getOutputPrice(output_amount, input_reserve, output_reserve) {
      let numerator = input_reserve * output_amount * 1000
      let denominator = (output_reserve - output_amount) * 997
      return numerator / (denominator + 1)
    }

    function getUniDepth(ether_supply, dai_supply, volume, step = 1) {
      const midPoint = dai_supply / ether_supply;
      let bids = []
      bids.unshift(
        {value: getInputPrice(0.1, ether_supply, dai_supply) / 0.1, bidstotalvolume: 0.1}
      )
      for (let i = 1; i < volume; i += step) {
        bids.unshift(
          {value: getInputPrice(i, ether_supply, dai_supply) / i, bidstotalvolume: i}
        )
      }
      var bidGradient = new am4core.LinearGradient();
      bids.forEach((bid) => {
        console.log(bid.value < midPoint / 1.02);
        bidGradient.addColor(am4core.color(bid.value < midPoint / 1.02 ? "#009900" : "#00ff00"))
      })

      const asks = []
      asks.push(
        {value: getOutputPrice(0.1, dai_supply, ether_supply) / 0.1, askstotalvolume: 0.1}
      )
      for (let i = 1; i < volume; i += step) {
        let value = getOutputPrice(i, dai_supply, ether_supply) / i;
        asks.push(
          {value, askstotalvolume: i}
        )
      }
      var askGradient = new am4core.LinearGradient();
      asks.forEach((ask) => askGradient.addColor(am4core.color(ask.value > midPoint * 1.02 ? "darkred" : "red")))
      return {
        orderBook: bids.concat(...asks),
        askGradient,
        bidGradient
      };
    }

    // Set up precision for numbers
    chart.numberFormatter.numberFormat = "#,###.##";

    // Create axes
    var xAxis = chart.xAxes.push(new am4charts.ValueAxis());
    xAxis.dataFields.category = "value";
    //xAxis.renderer.grid.template.location = 0;
    xAxis.renderer.minGridDistance = 50;
    xAxis.title.text = "Price (ETH/DAI)";
    // xAxis.interpolationDuration = 500;
    // xAxis.numberFormatter = new am4core.NumberFormatter();
    //  xAxis.numberFormatter.numberFormat = "#.##";


    var yAxis = chart.yAxes.push(new am4charts.ValueAxis());
    yAxis.title.text = "Volume";
    yAxis.interpolationDuration = 500;

    // Create series
    var series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueX = "value";
    series.dataFields.valueY = "bidstotalvolume";
    series.strokeWidth = 2;
    series.stroke = am4core.color("#0f0");
    series.fill = series.stroke;
    series.fillOpacity = 0.5;
    // series.tooltipText = "Bid: [bold]{valueX}[/]\nTotal volume: [bold]{valueY}[/]\nVolume: [bold]{bidsvolume}[/]"
    series.interpolationDuration = 500;

    var series2 = chart.series.push(new am4charts.LineSeries());
    series2.dataFields.valueX = "value";
    series2.dataFields.valueY = "askstotalvolume";
    series2.strokeWidth = 2;


    series2.stroke = am4core.color("#f00");
    series2.fill = series2.stroke;
    series2.fillOpacity = 0.5;
    // series2.tooltipText = "Ask: [bold]{valueX}[/]\nTotal volume: [bold]{valueY}[/]\nVolume: [bold]{asksvolume}[/]"
    series2.interpolationDuration = 500;

    chart.cursor = new am4charts.XYCursor();
    window.chart = chart

    window.doSetUni = function (ether_supply, dai_supply) {
      let uniDepth = getUniDepth(ether_supply, dai_supply, 100, 1);
      chart.data = uniDepth.orderBook;
      series.fill = uniDepth.bidGradient;
      series2.fill = uniDepth.askGradient;
    }
  }); // end am4core.ready()
}

initCharts()
