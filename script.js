// Global variables to store our data and charts
let environmentalData = [];
let mainChart;
let qualityChart;

/**
 * Fetches data from the specified CSV file, parses it, and then initializes the dashboard.
 * This is an asynchronous function that handles the entire data loading process.
 */
async function loadCSVData() {
    try {
        // Fetch the CSV file from the server
        const response = await fetch('data.csv');
        
        // Check if the request was successful (status code 200-299)
        if (!response.ok) {
            throw new Error(`Failed to load CSV file: ${response.status} ${response.statusText}`);
        }
        
        // Get the CSV text content from the response
        const csvText = await response.text();
        console.log('CSV file loaded successfully');
        
        // Parse the CSV data using the dedicated parsing function
        return await parseCSVData(csvText);
        
    } catch (error) {
        console.error('Error loading CSV data:', error);
        // Provide a more helpful error message if the file can't be fetched
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Could not load data.csv file. Make sure the file exists and you are running from a web server.');
        }
        throw error;
    }
}

/**
 * Parses the provided CSV text using PapaParse library.
 * @param {string} csvText - The raw string content of the CSV file.
 * @returns {Promise<Array<Object>>} A promise that resolves with the parsed data array.
 */
function parseCSVData(csvText) {
    return new Promise((resolve, reject) => {
        
        Papa.parse(csvText, {
            header: true,             // Treat the first row as headers
            dynamicTyping: true,      // Automatically convert data types (e.g., string to number)
            skipEmptyLines: true,     // Ignore empty rows in the file
            complete: function(results) {
                // Check for and log any parsing errors
                if (results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    console.warn('Some parsing errors occurred, but continuing with available data');
                }
                
                // Ensure that data was actually parsed
                if (!results.data || results.data.length === 0) {
                    reject(new Error('No data found in CSV file'));
                    return;
                }
                
                // Validate that all required columns are present in the data
                const requiredColumns = ['Date', 'Temperature', 'CO2', 'Water_Quality', 'Air_Quality'];
                const firstRow = results.data[0];
                const missingColumns = requiredColumns.filter(col => !(col in firstRow));
                
                if (missingColumns.length > 0) {
                    reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
                    return;
                }
                
                console.log('CSV parsed successfully:', results.data.length, 'rows loaded');
                resolve(results.data);
            },
            error: function(error) {
                console.error('Papa Parse error:', error);
                reject(new Error(`CSV parsing failed: ${error.message}`));
            }
        });
    });
}

/**
 * Calculates summary statistics from the data and updates the KPI cards in the HTML.
 * @param {Array<Object>} data - The array of environmental data.
 */
function updateStatistics(data) {
    // Calculate the average for each metric, ensuring the result is properly formatted
    const avgTemp = (data.reduce((sum, row) => sum + row.Temperature, 0) / data.length).toFixed(1);
    const avgCO2 = Math.round(data.reduce((sum, row) => sum + row.CO2, 0) / data.length);
    const avgWater = Math.round(data.reduce((sum, row) => sum + row.Water_Quality, 0) / data.length);
    const avgAir = Math.round(data.reduce((sum, row) => sum + row.Air_Quality, 0) / data.length);

    // Update the text content of the corresponding HTML elements
    document.getElementById('avgTemp').textContent = `${avgTemp} °C`;
    document.getElementById('avgCO2').textContent = `${avgCO2} ppm`;
    document.getElementById('avgWater').textContent = `${avgWater} %`;
    document.getElementById('avgAir').textContent = avgAir;

    console.log('Statistics updated:', { avgTemp, avgCO2, avgWater, avgAir });
}

/**
 * Populates the data table with the provided environmental data.
 * @param {Array<Object>} data - The array of environmental data.
 */
function populateDataTable(data) {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; // Clear any existing rows or loading text

    data.forEach(row => {
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
            <td>${row.Date || 'N/A'}</td>
            <td>${row.Temperature || 'N/A'}</td>
            <td>${row.CO2 || 'N/A'}</td>
            <td>${row.Water_Quality || 'N/A'}</td>
            <td>${row.Air_Quality || 'N/A'}</td>
        `;
        tableBody.appendChild(tableRow);
    });

}


/**
 * Creates or updates the charts using Chart.js.
 * @param {Array<Object>} data - The array of environmental data.
 */
function createCharts(data) {
    const labels = data.map(d => d.Date);
    const tempData = data.map(d => d.Temperature);
    const co2Data = data.map(d => d.CO2);
    const waterData = data.map(d => d.Water_Quality);
    const airData = data.map(d => d.Air_Quality);

    // Main Chart: Temperature and CO2
    const mainChartCtx = document.getElementById('mainChart').getContext('2d');
    if (mainChart) mainChart.destroy(); // Destroy existing chart if it exists
    mainChart = new Chart(mainChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    yAxisID: 'y',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'CO₂ (ppm)',
                    data: co2Data,
                    borderColor: 'rgba(16, 185, 129, 0.8)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    yAxisID: 'y1',
                    fill: true,
                    tension: 0.4,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Temperature (°C)' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'CO₂ (ppm)' }, grid: { drawOnChartArea: false } }
            },
            plugins: { tooltip: { mode: 'index', intersect: false } }
        }
    });

    // Quality Chart: Water and Air
    const qualityChartCtx = document.getElementById('qualityChart').getContext('2d');
    if (qualityChart) qualityChart.destroy(); // Destroy existing chart if it exists
    qualityChart = new Chart(qualityChartCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Water Quality (%)',
                    data: waterData,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Air Quality Index',
                    data: airData,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { tooltip: { mode: 'index', intersect: false } }
        }
    });
    console.log('Charts created successfully.');
}


/**
 * Displays an error message on the dashboard.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';
    loadingElement.innerHTML = `
        <div style="color: #ef4444; margin-bottom: 1rem;">
            <strong>Error:</strong> ${message}
        </div>
        <div style="font-size: 0.9em; color: #6b7280;">
            <strong>Troubleshooting tips:</strong><br>
            • Make sure 'data.csv' is in the same folder as index.html.<br>
            • Run the project from a web server (not by opening the HTML file directly).<br>
            • Check the browser console (F12) for more details.
        </div>
    `;
    console.error('Dashboard error:', message);
}

/**
 * Hides the loading message element.
 */
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

/**
 * The main function to initialize the dashboard.
 * It orchestrates the data loading, processing, and visualization.
 */
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');
        
        // Load and parse CSV data
        environmentalData = await loadCSVData();
        
        // Validate that data was loaded
        if (!environmentalData || environmentalData.length === 0) {
            throw new Error('No data available to display.');
        }
        
        // Update the summary statistics cards
        updateStatistics(environmentalData);
        
        // Populate the data table with the loaded data
        populateDataTable(environmentalData);
        
        // Create the data visualization charts
        createCharts(environmentalData);
        
        // Hide the "Loading..." message
        hideLoading();
        
        console.log('Dashboard initialized successfully!');
        
    } catch (error) {
        // Display any errors that occurred during initialization
        displayError(error.message || 'An unknown error occurred.');
    }
}

// Add an event listener to run the main initialization function 
// once the HTML document has been fully loaded.
document.addEventListener('DOMContentLoaded', initializeDashboard);
