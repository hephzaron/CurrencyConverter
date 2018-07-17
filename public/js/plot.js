import Chart from 'chart.js';

export const showTrends = () => {
  const ctx = document.getElementById('trendChart');
  const fromTo = document.getElementById('fromTo');
  const toFrom = document.getElementById('toFrom');
  const fromLabel = fromTo.options[fromTo.selectedIndex].text;
  const toLabel = toFrom.options[toFrom.selectedIndex].text;
  const historyData = {
    USD_PHP: {
      '2018-07-12': 53.409698,
      '2018-07-13': 53.509998,
      '2018-07-14': 53.509998,
      '2018-07-15': 53.479993,
      '2018-07-16': 52.409698,
      '2018-07-17': 55.509998,
    }
  };
  const [key] = Object.keys(historyData);
  const xLabel = Object.keys(historyData[`${key}`]);
  const yData = Object.values(historyData[`${key}`]);
  const { yMax, yMin } = getLimits(yData);

  const data = {
    labels: xLabel,
    datasets: [{
      label: `${fromLabel} against ${toLabel}`,
      fill: false,
      pointBackgroundColor: 'rgba(225,99,192,0.8)',
      borderColor: 'rgba(2,2,198,0.7)',
      yAxesID: 'A',
      data: yData
    }]
  }
  const options = {
    scales: {
      xAxes: [{
        type: 'time',
        distribution: 'series',
        time: {
          unit: 'day'
        }
      }],
      yAxes: [{
        id: 'A',
        type: 'linear',
        position: 'left',
        ticks: {
          max: yMax,
          min: yMin
        },
        scaleLabel: {
          display: true,
          labelString: `${fromLabel} conversion rates`
        }
      }]
    },
    elements: {
      line: {
        tension: 0
      }
    }
  }
  const trendChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: options
  });
}


const getLimits = (arr) => {
  const maxVal = arr.reduce((prev, next) => Math.max(prev, next));
  const minVal = arr.reduce((prev, next) => Math.min(prev, next));
  const offset = (maxVal - minVal) / (arr.length);
  const yMax = maxVal + offset;
  const yMin = minVal - offset;
  return {
    yMax,
    yMin
  }
}

export default {}