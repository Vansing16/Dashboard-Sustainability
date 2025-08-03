let mainChart, qualityChart;

document.addEventListener('DOMContentLoaded', () => {
  fetch('data.csv')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load data.csv');
      return response.text();
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: result => {
          if (result.errors.length) {
            console.error('Parsing errors:', result.errors);
          }

          const data = result.data;
          if (!data.length) throw new Error('CSV file is empty');

          updateKPI(data);
          populateTable(data);
          renderCharts(data);
          document.getElementById('loading').style.display = 'none';
        }
      });
    })
    .catch(err => {
      displayError(err.message);
    });
});

function updateKPI(data) {
  const avg = (key) =>
    (data.reduce((sum, row) => sum + row[key], 0) / data.length).toFixed(1);

  document.getElementById('avgTemp').textContent = `${avg('Temperature')} °C`;
  document.getElementById('avgCO2').textContent = `${avg('CO2')} ppm`;
  document.getElementById('avgWater').textContent = `${avg('Water_Quality')} %`;
  document.getElementById('avgAir').textContent = `${avg('Air_Quality')}`;
}

function populateTable(data) {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.Date}</td>
      <td>${row.Temperature}</td>
      <td>${row.CO2}</td>
      <td>${row.Water_Quality}</td>
      <td>${row.Air_Quality}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCharts(data) {
  const labels = data.map(d => d.Date);

  // Line chart: Temperature and CO2
  const temp = data.map(d => d.Temperature);
  const co2 = data.map(d => d.CO2);

  if (mainChart) mainChart.destroy();
  mainChart = new Chart(document.getElementById('mainChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temp,
          borderColor: 'rgba(239,68,68,0.8)',
          backgroundColor: 'rgba(239,68,68,0.1)',
          yAxisID: 'y',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'CO₂ (ppm)',
          data: co2,
          borderColor: 'rgba(16,185,129,0.8)',
          backgroundColor: 'rgba(16,185,129,0.1)',
          yAxisID: 'y1',
          tension: 0.3,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Temperature (°C)' },
          position: 'left',
        },
        y1: {
          title: { display: true, text: 'CO₂ (ppm)' },
          position: 'right',
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  // Bar chart: Water and Air Quality
  const water = data.map(d => d.Water_Quality);
  const air = data.map(d => d.Air_Quality);

  if (qualityChart) qualityChart.destroy();
  qualityChart = new Chart(document.getElementById('qualityChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Water Quality (%)',
          data: water,
          backgroundColor: 'rgba(59,130,246,0.7)',
        },
        {
          label: 'Air Quality Index',
          data: air,
          backgroundColor: 'rgba(139,92,246,0.7)',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function displayError(message) {
  const loading = document.getElementById('loading');
  loading.innerHTML = `
    <div style="color: red;"><strong>Error:</strong> ${message}</div>
    <p style="font-size: 0.9em; color: gray;">
      • Make sure <code>data.csv</code> exists<br>
      • Use a local server (like Live Server or Replit)<br>
      • Check browser console for details (F12)
    </p>
  `;
  loading.style.display = 'block';
}
