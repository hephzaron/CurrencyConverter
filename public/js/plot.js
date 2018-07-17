import Chart from 'chart.js';

export const showTrends = () => {
  const ctx = document.getElementById('trendChart');
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thurs'],
    datasets: [{
      label: 'from',
      fill: false,
      pointBackgroundColor: 'rgba(225,99,192,0.8)',
      borderColor: 'rgba(2,2,198,0.7)',
      yAxesID: 'from',
      data: [7, 18, 11, 10]
    }, {
      label: 'to',
      fill: false,
      pointBackgroundColor: 'rgba(99,45,225,0.8)',
      borderColor: 'rgba(198,2,2,0.7)',
      yAxesID: 'to',
      data: [9, 4, 13, 6],
      type: 'line'
    }]
  }
  const options = {
    scales: {
      yAxes: [{
        id: 'from',
        type: 'linear',
        position: 'left',
        ticks: {
          max: 18,
          min: 0
        }
      }, {
        id: 'to',
        type: 'linear',
        position: 'right',
        ticks: {
          max: 18,
          min: 0
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

export default {}