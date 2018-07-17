import Chart from 'chart.js';
window.addEventListener('load', (event) => {
  event.preventDefault();
  const ctx = document.getElementById('trendChart');
  const data = [20, 10];
  const trendChart = new Chart(ctx, {
    type: 'line',
    data
  });
});