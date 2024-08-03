const CHART_WIDTH = 400;
const CHART_HEIGHT = 300;

const chartColors = [
    'rgba(255, 99, 132, 0.6)',   // Red
    'rgba(54, 162, 235, 0.6)',   // Blue
    'rgba(255, 206, 86, 0.6)',   // Yellow
    'rgba(75, 192, 192, 0.6)',   // Green
    'rgba(153, 102, 255, 0.6)',  // Purple
    'rgba(255, 159, 64, 0.6)',   // Orange
    'rgba(199, 199, 199, 0.6)',  // Gray
    'rgba(83, 102, 255, 0.6)',   // Indigo
    'rgba(255, 99, 132, 0.6)',   // Pink
    'rgba(0, 210, 91, 0.6)',     // Lime
];

function sortObjectByValues(obj, descending = true) {
    return Object.fromEntries(
        Object.entries(obj)
            .sort(([,a], [,b]) => descending ? b - a : a - b)
    );
}

function loadCarsForSaleInsights() {
    return new Promise((resolve, reject) => {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        fetch('/get-data-analysis')
            .then(response => response.json())
            .then(data => {
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                if (data.success) {
                    console.log("Received analysis data:", data.analysis);
                    const analysis = data.analysis;

                    analysis.top_makes = Object.fromEntries(
                        Object.entries(analysis.top_makes).sort((a, b) => b[1] - a[1])
                    );
                    analysis.avg_price_by_make = Object.fromEntries(
                        Object.entries(analysis.avg_price_by_make).sort((a, b) => b[1] - a[1])
                    );
                    analysis.avg_kilometers_by_make = Object.fromEntries(
                        Object.entries(analysis.avg_kilometers_by_make).sort((a, b) => b[1] - a[1])
                    );
                    analysis.year_distribution = Object.fromEntries(
                        Object.entries(analysis.year_distribution).sort((a, b) => a[0] - b[0])
                    );
                    analysis.regional_specs_distribution = Object.fromEntries(
                        Object.entries(analysis.regional_specs_distribution).sort((a, b) => b[1] - a[1])
                    );
                    analysis.seller_type_distribution = Object.fromEntries(
                        Object.entries(analysis.seller_type_distribution).sort((a, b) => b[1] - a[1])
                    );
                    analysis.body_type_distribution = Object.fromEntries(
                        Object.entries(analysis.body_type_distribution).sort((a, b) => b[1] - a[1])
                    );
                    analysis.fuel_type_distribution = Object.fromEntries(
                        Object.entries(analysis.fuel_type_distribution).sort((a, b) => b[1] - a[1])
                    );
                    analysis.transmission_type_distribution = Object.fromEntries(
                        Object.entries(analysis.transmission_type_distribution).sort((a, b) => b[1] - a[1])
                    );
                    analysis.age_distribution = Object.fromEntries(
                        Object.entries(analysis.age_distribution).sort((a, b) => a[0] - b[0])
                    );
                    analysis.price_by_age = Object.fromEntries(
                        Object.entries(analysis.price_by_age).sort((a, b) => a[0] - b[0])
                    );
                    analysis.kilometers_by_age = Object.fromEntries(
                        Object.entries(analysis.kilometers_by_age).sort((a, b) => a[0] - b[0])
                    );

                    createTopMakesChart(analysis.top_makes);
                    createMakeModelChart(analysis.make_model_distribution);
                    createAvgPriceByMakeChart(analysis.avg_price_by_make);
                    createAvgKilometersByMakeChart(analysis.avg_kilometers_by_make);
                    createPriceDistributionChart(analysis.price_distribution);
                    createPriceRangeDistributionChart(analysis.price_range_distribution);
                    createYearDistributionChart(analysis.year_distribution);
                    createRegionalSpecsChart(analysis.regional_specs_distribution);
                    createSellerTypeChart(analysis.seller_type_distribution);
                    createBodyTypeChart(analysis.body_type_distribution);
                    createFuelTypeChart(analysis.fuel_type_distribution);
                    createTransmissionTypeChart(analysis.transmission_type_distribution);
                    createAgeDistributionChart(analysis.age_distribution);
                    createPriceByAgeChart(analysis.price_by_age);
                    createKilometersByAgeChart(analysis.kilometers_by_age);
                    createTopMakeModelByPriceChart(analysis.top_make_model_by_avg_price);
                    createTopMakeModelByKilometersChart(analysis.top_make_model_by_avg_kilometers);
                    createKmPerYearChart(analysis.km_per_year_distribution);
                    generateOverallSummary(analysis);
                    resolve();
                } else {
                    const errorMessage = data.error || 'Failed to load data analysis.';
                    document.getElementById('errorMessage').textContent = errorMessage;
                    reject(new Error(errorMessage));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                reject(error);
            });
    });
}

function createTopMakeModelByKilometersChart(data) {
    const sortedData = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = sortedData.map(item => item[0]);
    const values = sortedData.map(item => item[1]);

    const ctx = document.getElementById('topMakeModelByKilometersChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Kilometers',
                data: values,
                backgroundColor: 'rgba(255, 159, 64, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Make-Model Combinations by Average Kilometers'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Kilometers'
                    }
                }
            }
        }
    });

    const topMakeModel = labels[0];
    const topKilometers = Math.round(values[0]).toLocaleString();
    const analysis = `${topMakeModel} has the highest average mileage at ${topKilometers} kilometers, followed by ${labels[1]} and ${labels[2]}. This chart shows which make-model combinations tend to have the highest mileage in the market.`;
    document.getElementById('topMakeModelByKilometersAnalysis').textContent = analysis;
}

function createPriceRangeDistributionChart(data) {
    const ctx = document.getElementById('priceRangeDistributionChart').getContext('2d');
    const sortedData = Object.entries(data).sort((a, b) => {
        const aValue = parseInt(a[0].split('-')[0].replace('k', ''));
        const bValue = parseInt(b[0].split('-')[0].replace('k', ''));
        return aValue - bValue;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Number of Cars',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue color with opacity
                borderColor: 'rgba(54, 162, 235, 1)', // Solid blue color for border
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Cars by Price Range (0-500k AED)'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Price Range (AED)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const mostCommonRange = sortedData.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const totalCars = sortedData.reduce((sum, item) => sum + item[1], 0);
    const mostCommonPercentage = ((sortedData.find(item => item[0] === mostCommonRange)[1] / totalCars) * 100).toFixed(2);

    const analysis = `The most common price range is ${mostCommonRange} AED, accounting for ${mostCommonPercentage}% of the cars in the 0-500k AED range. This chart shows the distribution of cars across different price ranges up to 500,000 AED, providing insights into the most popular price segments in the market.`;
    document.getElementById('priceRangeDistributionAnalysis').textContent = analysis;
}

function createKmPerYearChart(data) {
    const ctx = document.getElementById('kmPerYearChart').getContext('2d');
    const sortedData = Object.entries(data).sort((a, b) => {
        const aValue = parseInt(a[0].split('-')[0].replace('k', '000'));
        const bValue = parseInt(b[0].split('-')[0].replace('k', '000'));
        return aValue - bValue;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Number of Cars',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(123, 104, 238, 0.6)', // Medium slate blue with opacity
                borderColor: 'rgba(123, 104, 238, 1)', // Solid medium slate blue
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Cars by Kilometers Driven per Year'
                },
                legend: {
                    display: false // Hide legend as it's not needed for a single dataset
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Kilometers per Year'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const mostCommonRange = sortedData.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const totalCars = sortedData.reduce((sum, item) => sum + item[1], 0);
    const mostCommonPercentage = ((sortedData.find(item => item[0] === mostCommonRange)[1] / totalCars) * 100).toFixed(2);

    const analysis = `The most common range for kilometers driven per year is ${mostCommonRange}, accounting for ${mostCommonPercentage}% of the cars. This chart shows the distribution of cars based on their average annual mileage, providing insights into usage patterns in the market.`;
    document.getElementById('kmPerYearAnalysis').textContent = analysis;
}

function createTopMakesChart(data) {
    const sortedData = sortObjectByValues(data);
    const ctx = document.getElementById('topMakesChart');
    if (!ctx) {
        console.error('topMakesChart canvas not found');
        return;
    }
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                label: 'Number of Listings',
                data: Object.values(sortedData),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Car Makes by Number of Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const topMake = Object.keys(sortedData)[0];
    const topMakeCount = sortedData[topMake];
    const analysis = `${topMake} leads with ${topMakeCount} listings, followed by ${Object.keys(sortedData)[1]} and ${Object.keys(sortedData)[2]}. This indicates a strong presence of these brands in the market, likely due to their popularity and availability.`;
    document.getElementById('topMakesAnalysis').textContent = analysis;
}

function createAvgPriceByMakeChart(data) {
    const sortedData = sortObjectByValues(data);
    const ctx = document.getElementById('avgPriceByMakeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                label: 'Average Price (AED)',
                data: Object.values(sortedData),
                backgroundColor: 'rgba(255, 99, 132, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Car Makes by Average Price'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const topMake = Object.keys(sortedData)[0];
    const topPrice = Math.round(sortedData[topMake]);
    const analysis = `${topMake} has the highest average price at AED ${topPrice.toLocaleString()}, followed by ${Object.keys(sortedData)[1]} and ${Object.keys(sortedData)[2]}. This reflects the luxury status and high-end market positioning of these brands.`;
    document.getElementById('avgPriceByMakeAnalysis').textContent = analysis;
}

function createAvgKilometersByMakeChart(data) {
    const sortedData = sortObjectByValues(data);
    const ctx = document.getElementById('avgKilometersByMakeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                label: 'Average Kilometers',
                data: Object.values(sortedData),
                backgroundColor: 'rgba(255, 206, 86, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Car Makes by Average Kilometers'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const topMake = Object.keys(sortedData)[0];
    const topKilometers = Math.round(sortedData[topMake]);
    const analysis = `${topMake} has the highest average mileage at ${topKilometers.toLocaleString()} kilometers. This could indicate higher durability or that these cars are often used for longer distances.`;
    document.getElementById('avgKilometersByMakeAnalysis').textContent = analysis;
}

function createTopMakeModelByPriceChart(data) {
    const sortedData = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const ctx = document.getElementById('topMakeModelByPriceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Average Price (AED)',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(255, 206, 86, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Make-Model Combinations by Average Price'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Price (AED)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {maximumFractionDigits: 0});
                        }
                    }
                }
            }
        }
    });

    const topMakeModel = sortedData[0][0];
    const topPrice = sortedData[0][1].toLocaleString('en-US', {maximumFractionDigits: 0});
    const analysis = `The ${topMakeModel} has the highest average price at AED ${topPrice} among cars for sale. This chart highlights the most expensive make-model combinations in the market, which could be due to factors such as brand prestige, performance, or rarity.`;
    document.getElementById('topMakeModelByPriceAnalysis').textContent = analysis;
}

function createPriceDistributionChart(data) {
    const ctx = document.getElementById('priceDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Minimum', '25th Percentile', 'Median', '75th Percentile', 'Maximum'],
            datasets: [{
                label: 'Price (AED)',
                data: [data.min, data.percentiles['0.25'], data.median, data.percentiles['0.75'], data.max],
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Price Distribution'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const analysis = `The median price is AED ${Math.round(data.median).toLocaleString()}, with 50% of cars priced between AED ${Math.round(data.percentiles['0.25']).toLocaleString()} and AED ${Math.round(data.percentiles['0.75']).toLocaleString()}. This wide range reflects the diversity of the used car market.`;
    document.getElementById('priceDistributionAnalysis').textContent = analysis;
}

function createYearDistributionChart(data) {
    const sortedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [parseInt(key), value])
    );
    const ctx = document.getElementById('yearDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                label: 'Number of Cars',
                data: Object.values(sortedData),
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Cars by Year'
                }
            }
        }
    });

    const mostCommonYear = Object.keys(sortedData).reduce((a, b) => sortedData[a] > sortedData[b] ? a : b);
    const analysis = `The most common model year is ${mostCommonYear}, with ${sortedData[mostCommonYear]} listings. This suggests a peak in the availability of cars from this year in the used market.`;
    document.getElementById('yearDistributionAnalysis').textContent = analysis;
}

function createRegionalSpecsChart(data) {
    const sortedData = sortObjectByValues(data);
    const total = Object.values(sortedData).reduce((a, b) => a + b, 0);
    const labels = Object.keys(sortedData).map(key => {
        const percentage = ((sortedData[key] / total) * 100).toFixed(1);
        return `${key} (${percentage}%)`;
    });

    const ctx = document.getElementById('regionalSpecsChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(sortedData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Regional Specs'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const topSpec = Object.keys(sortedData)[0];
    const topSpecPercentage = ((sortedData[topSpec] / total) * 100).toFixed(2);
    const analysis = `${topSpec} dominates the market with ${topSpecPercentage}% of listings. This suggests a strong preference for ${topSpec} vehicles, possibly due to local regulations or consumer preferences.`;
    document.getElementById('regionalSpecsAnalysis').textContent = analysis;
}

function createSellerTypeChart(data) {
    const sortedData = sortObjectByValues(data);
    const ctx = document.getElementById('sellerTypeChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                data: Object.values(sortedData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Seller Types'
                },
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}${percentage}%`;
                        }
                    }
                }
            }
        }
    });

    const topSellerType = Object.keys(sortedData)[0];
    const topSellerPercentage = (sortedData[topSellerType] / Object.values(sortedData).reduce((a, b) => a + b, 0) * 100).toFixed(1);
    const analysis = `${topSellerType} account for ${topSellerPercentage}% of listings. This indicates that ${topSellerType.toLowerCase()} are the primary sellers of the used car market in this region.`;
    document.getElementById('sellerTypeAnalysis').textContent = analysis;
}

function createBodyTypeChart(data) {
    const sortedData = sortObjectByValues(data);
    const top5Data = Object.fromEntries(
        Object.entries(sortedData).slice(0, 5).concat([['Other',
            Object.entries(sortedData).slice(5).reduce((sum, [, value]) => sum + value, 0)
        ]])
    );

    const ctx = document.getElementById('bodyTypeChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(top5Data),
            datasets: [{
                data: Object.values(top5Data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Body Types'
                },
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}${percentage}%`;
                        }
                    }
                }
            }
        }
    });

    const topBodyType = Object.keys(sortedData)[0];
    const topBodyTypePercentage = (sortedData[topBodyType] / Object.values(sortedData).reduce((a, b) => a + b, 0) * 100).toFixed(1);
    const analysis = `${topBodyType} is the most common body type, representing ${topBodyTypePercentage}% of listings. This suggests a strong preference for ${topBodyType.toLowerCase()} vehicles in this market.`;
    document.getElementById('bodyTypeAnalysis').textContent = analysis;
}

function createFuelTypeChart(data) {
    const sortedData = sortObjectByValues(data);
    const total = Object.values(sortedData).reduce((a, b) => a + b, 0);
    const labels = Object.keys(sortedData).map(key => {
        const percentage = ((sortedData[key] / total) * 100).toFixed(1);
        return `${key} (${percentage}%)`;
    });

    const ctx = document.getElementById('fuelTypeChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(sortedData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Fuel Types'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const topFuelType = Object.keys(sortedData)[0];
    const topFuelPercentage = ((sortedData[topFuelType] / total) * 100).toFixed(2);
    const analysis = `${topFuelType} is the dominant fuel type, accounting for ${topFuelPercentage}% of listings. This reflects the current market preference and available infrastructure for ${topFuelType.toLowerCase()}-powered vehicles.`;
    document.getElementById('fuelTypeAnalysis').textContent = analysis;
}

function createTransmissionTypeChart(data) {
    const sortedData = sortObjectByValues(data);
    const total = Object.values(sortedData).reduce((a, b) => a + b, 0);
    const labels = Object.keys(sortedData).map(key => {
        const percentage = ((sortedData[key] / total) * 100).toFixed(1);
        return `${key} (${percentage}%)`;
    });

    const ctx = document.getElementById('transmissionTypeChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(sortedData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Transmission Types'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const topTransmission = Object.keys(sortedData)[0];
    const topTransmissionPercentage = ((sortedData[topTransmission] / total) * 100).toFixed(2);
    const analysis = `${topTransmission} transmissions dominate the market with ${topTransmissionPercentage}% of listings. This indicates a strong preference for ${topTransmission.toLowerCase()} transmission vehicles among buyers in this region.`;
    document.getElementById('transmissionTypeAnalysis').textContent = analysis;
}

function createAgeDistributionChart(data) {
    const sortedData = Object.fromEntries(
        Object.entries(data)
            .filter(([key]) => parseInt(key) >= 0)
            .map(([key, value]) => [parseInt(key), value])
            .sort((a, b) => a[0] - b[0])
    );
    const ctx = document.getElementById('ageDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                label: 'Number of Cars',
                data: Object.values(sortedData),
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Car Ages'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age (years)'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const mostCommonAge = Object.keys(sortedData).reduce((a, b) => sortedData[a] > sortedData[b] ? a : b);
    const analysis = `The most common age for used cars in this market is ${mostCommonAge} years old. This could indicate the average time people tend to keep their cars before selling or the age at which cars are most commonly imported as used vehicles.`;
    document.getElementById('ageDistributionAnalysis').textContent = analysis;
}

function createMakeModelChart(data) {
    const combinedData = [];
    Object.entries(data).forEach(([make, info]) => {
        Object.entries(info.models).forEach(([model, count]) => {
            combinedData.push({ label: `${make} ${model}`, count: count });
        });
    });

    const sortedData = combinedData.sort((a, b) => b.count - a.count).slice(0, 10);

    const ctx = document.getElementById('makeModelChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item.label),
            datasets: [{
                label: 'Number of Cars',
                data: sortedData.map(item => item.count),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Make-Model Combinations'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const topMakeModel = sortedData[0].label;
    const topCount = sortedData[0].count;
    const analysis = `${topMakeModel} is the most popular make-model combination with ${topCount} cars. This chart shows the top 10 make-model combinations by number of listings.`;
    document.getElementById('makeModelAnalysis').textContent = analysis;
}

function createPriceByAgeChart(data) {
    const sortedData = sortObjectByValues(data, false);  // Sort ascending for age
    const ctx = document.getElementById('priceByAgeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                label: 'Average Price (AED)',
                data: Object.values(sortedData),
                borderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Price by Car Age'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age (years)'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const analysis = `There's a clear trend of decreasing average price as car age increases. This reflects the depreciation of vehicles over time, with newer cars commanding significantly higher prices in the used market.`;
    document.getElementById('priceByAgeAnalysis').textContent = analysis;
}

function createKilometersByAgeChart(data) {
    const sortedData = sortObjectByValues(data, false);  // Sort ascending for age
    const ctx = document.getElementById('kilometersByAgeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(sortedData),
            datasets: [{
                label: 'Average Kilometers',
                data: Object.values(sortedData),
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Kilometers by Car Age'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age (years)'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const analysis = `As expected, there's a general trend of increasing average kilometers as car age increases. This reflects the accumulation of mileage over time. However, the rate of increase may vary, possibly due to differences in usage patterns or the types of vehicles popular at different ages.`;
    document.getElementById('kilometersByAgeAnalysis').textContent = analysis;
}

function generateConclusion(chartType, data) {
    let conclusion = '';
    switch (chartType) {
        case 'topMakes':
            const topMake = Object.keys(data)[0];
            const topMakeCount = data[topMake];
            conclusion = `The most popular car make in the market is ${topMake} with ${topMakeCount} listings. This indicates a strong preference for ${topMake} among buyers and sellers in the used car market.`;
            break;
        // ... (Add cases for other chart types)
    }
    document.getElementById(`${chartType}Conclusion`).textContent = conclusion;
}

function generateOverallSummary(analysis) {
    const summary = `
        <h4>1. Objective:</h4>
        <p>This analysis aimed to understand the used car market dynamics for vehicles from 1990 onwards, focusing on factors affecting car listings, pricing trends, and features that enhance the likelihood of a car being sold.</p>

        <h4>2. Data Collection:</h4>
        <p>The dataset comprises car listings from Dubizzle, Dubicars, Carswitch, Cars24, including details of cars manufactured from 1990 to present.</p>


    <h4>3. Data Cleaning:</h4>
    <p>The data underwent cleaning processes to handle missing values, remove duplicates, and ensure consistency in data types across all features.</p>

    <h4>4. Exploratory Data Analysis (EDA):</h4>
    <ul>
        ${analysis.top_makes ? `
            <li>The most common car makes are ${Object.keys(analysis.top_makes).slice(0, 3).join(', ')}.</li>
        ` : ''}
        ${analysis.price_distribution ? `
            <li>The average price across all listings is AED ${Math.round(analysis.price_distribution.mean).toLocaleString()}.</li>
        ` : ''}
        ${analysis.body_type_distribution ? `
            <li>The most common body type is ${Object.keys(analysis.body_type_distribution)[0]}.</li>
        ` : ''}
        ${analysis.fuel_type_distribution ? `
            <li>The predominant fuel type is ${Object.keys(analysis.fuel_type_distribution)[0]}.</li>
        ` : ''}
        ${analysis.transmission_type_distribution ? `
            <li>The majority of vehicles use ${Object.keys(analysis.transmission_type_distribution)[0]}.</li>
        ` : ''}
    </ul>

    <h4>5. Key Insights:</h4>
    <ul>
        ${analysis.price_by_age ? `
            <li>Price Trends: There's a clear trend of decreasing average price as vehicle age increases, with newer models commanding significantly higher prices.</li>
        ` : ''}
        ${analysis.seller_type_distribution ? `
            <li>Market Composition: The market is primarily driven by ${Object.keys(analysis.seller_type_distribution)[0]}.</li>
        ` : ''}
        ${analysis.regional_specs_distribution ? `
            <li>Regional Preferences: ${Object.keys(analysis.regional_specs_distribution)[0]} are the most common regional specifications.</li>
        ` : ''}
        ${analysis.age_distribution ? `
            <li>Age Distribution: The age distribution of cars shows a peak at ${Object.keys(analysis.age_distribution).reduce((a, b) => analysis.age_distribution[a] > analysis.age_distribution[b] ? a : b)} years old.</li>
        ` : ''}
        ${analysis.price_by_age ? `
            <li>Price-Age Relationship: There's an inverse relationship between a car's age and its average price, with newer cars commanding significantly higher prices.</li>
        ` : ''}
    </ul>

    <h4>6. Limitations:</h4>
    <p>This analysis is based on listed data and may not fully capture market dynamics influenced by external factors or buyer behavior not reflected in the listings.</p>

    <h4>7. Future Work:</h4>
    <p>Further analysis could include time-series forecasting of price trends, deeper investigation into factors affecting sale speed, and incorporation of additional data sources to enhance predictive modeling.</p>
    `;

    document.getElementById('overallSummary').innerHTML = summary;
}

function loadSoldOutCarsInsights() {
    return new Promise((resolve, reject) => {
        console.log("Starting to load sold out data analysis");
        fetch('/get-sold-out-data-analysis')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Received sold out analysis data:", data.analysis);
                    const analysis = data.analysis;

                    // Process and sort data
                    processSoldOutAnalysisData(analysis);

                    // Create charts
                    createSoldOutCharts(analysis);

                    // Generate overall summary
                    generateSoldOutOverallSummary(analysis);

                    resolve();
                } else {
                    reject(new Error(data.error || 'Failed to load sold out cars data analysis.'));
                }
            })
            .catch(error => {
                console.error('Error in sold out data analysis:', error);
                document.getElementById('errorMessage').textContent += ' Failed to load sold out cars data analysis.';
                reject(error);
            });
    });
}

function processSoldOutAnalysisData(analysis) {
    const sortNumeric = (obj) => Object.fromEntries(
        Object.entries(obj).sort((a, b) => b[1] - a[1])
    );

    const sortByYear = (obj) => Object.fromEntries(
        Object.entries(obj).sort((a, b) => a[0] - b[0])
    );

    analysis.top_makes = sortNumeric(analysis.top_makes);
    analysis.avg_price_by_make = sortNumeric(analysis.avg_price_by_make);
    analysis.avg_kilometers_by_make = sortNumeric(analysis.avg_kilometers_by_make);
    analysis.year_distribution = sortByYear(analysis.year_distribution);
    analysis.regional_specs_distribution = sortNumeric(analysis.regional_specs_distribution);
    analysis.seller_type_distribution = sortNumeric(analysis.seller_type_distribution);
    analysis.body_type_distribution = sortNumeric(analysis.body_type_distribution);
    analysis.fuel_type_distribution = sortNumeric(analysis.fuel_type_distribution);
    analysis.transmission_type_distribution = sortNumeric(analysis.transmission_type_distribution);
    analysis.age_distribution = sortByYear(analysis.age_distribution);
    analysis.price_by_age = sortByYear(analysis.price_by_age);
    analysis.kilometers_by_age = sortByYear(analysis.kilometers_by_age);
}

function createSoldOutCharts(analysis) {
    const chartFunctions = [
        { name: 'TopMakes', data: analysis.top_makes },
        { name: 'MakeModel', data: analysis.make_model_distribution },
        { name: 'AvgPriceByMake', data: analysis.avg_price_by_make },
        { name: 'AvgKilometersByMake', data: analysis.avg_kilometers_by_make },
        { name: 'PriceDistribution', data: analysis.price_distribution },
        { name: 'PriceRangeDistribution', data: analysis.price_range_distribution },
        { name: 'YearDistribution', data: analysis.year_distribution },
        { name: 'RegionalSpecs', data: analysis.regional_specs_distribution },
        { name: 'SellerType', data: analysis.seller_type_distribution },
        { name: 'BodyType', data: analysis.body_type_distribution },
        { name: 'FuelType', data: analysis.fuel_type_distribution },
        { name: 'TransmissionType', data: analysis.transmission_type_distribution },
        { name: 'AgeDistribution', data: analysis.age_distribution },
        { name: 'PriceByAge', data: analysis.price_by_age },
        { name: 'KilometersByAge', data: analysis.kilometers_by_age },
        { name: 'TopMakeModelByPrice', data: analysis.top_make_model_by_avg_price },
        { name: 'TopMakeModelByKilometers', data: analysis.top_make_model_by_avg_kilometers },
        { name: 'KmPerYear', data: analysis.km_per_year_distribution }
    ];

    chartFunctions.forEach(({ name, data }) => {
        if (data) {
            try {
                const functionName = `createSoldOut${name}Chart`;
                if (typeof window[functionName] === 'function') {
                    window[functionName](data);
                } else {
                    console.warn(`Chart function ${functionName} not found`);
                }
            } catch (error) {
                console.error(`Error creating ${name} chart:`, error);
            }
        } else {
            console.warn(`Data for ${name} chart is missing`);
        }
    });
}

function createSoldOutTopMakesChart(data) {
    const ctx = document.getElementById('soldOutTopMakesChart').getContext('2d');
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Number of Sold Cars',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Car Makes in Sold Out Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const topMake = sortedData[0][0];
    const topCount = sortedData[0][1];
    const totalCars = Object.values(data).reduce((a, b) => a + b, 0);
    const percentage = ((topCount / totalCars) * 100).toFixed(2);
    const conclusion = `${topMake} is the most popular make among sold cars, accounting for ${topCount} sales (${percentage}% of total). This suggests a strong market preference for ${topMake} in the used car market.`;
    document.getElementById('soldOutTopMakesAnalysis').textContent = conclusion;
}

function createSoldOutMakeModelChart(data) {
    const combinedData = [];
    Object.entries(data).forEach(([make, info]) => {
        Object.entries(info.models).forEach(([model, count]) => {
            combinedData.push({ label: `${make} ${model}`, count: count });
        });
    });

    const sortedData = combinedData.sort((a, b) => b.count - a.count).slice(0, 10);

    const ctx = document.getElementById('soldOutMakeModelChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item.label),
            datasets: [{
                label: 'Number of Sold Cars',
                data: sortedData.map(item => item.count),
                backgroundColor: 'rgba(255, 99, 132, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Make-Model Combinations in Sold Out Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const topMakeModel = sortedData[0].label;
    const topCount = sortedData[0].count;
    const totalCars = combinedData.reduce((sum, item) => sum + item.count, 0);
    const percentage = ((topCount / totalCars) * 100).toFixed(2);
    const conclusion = `The ${topMakeModel} is the most popular make-model combination, with ${topCount} sales (${percentage}% of total). This indicates a strong market demand for this specific model.`;
    document.getElementById('soldOutMakeModelAnalysis').textContent = conclusion;
}

function createSoldOutAvgPriceByMakeChart(data) {
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const ctx = document.getElementById('soldOutAvgPriceByMakeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Average Price (AED)',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(255, 206, 86, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Car Makes by Average Price in Sold Out Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Price (AED)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {maximumFractionDigits: 0});
                        }
                    }
                }
            }
        }
    });

    const topMake = sortedData[0][0];
    const topPrice = sortedData[0][1].toLocaleString('en-US', {maximumFractionDigits: 0});
    const conclusion = `${topMake} has the highest average price at AED ${topPrice} among sold cars. This suggests that ${topMake} is positioned as a premium brand in the used car market.`;
    document.getElementById('soldOutAvgPriceByMakeAnalysis').textContent = conclusion;
}

function createSoldOutAvgKilometersByMakeChart(data) {
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const ctx = document.getElementById('soldOutAvgKilometersByMakeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Average Kilometers',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Car Makes by Average Kilometers in Sold Out Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Kilometers'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {maximumFractionDigits: 0});
                        }
                    }
                }
            }
        }
    });

    const topMake = sortedData[0][0];
    const topKm = sortedData[0][1].toLocaleString('en-US', {maximumFractionDigits: 0});
    const conclusion = `${topMake} has the highest average mileage at ${topKm} kilometers among sold cars. This could indicate that ${topMake} vehicles are often used for longer distances or have longer lifespans.`;
    document.getElementById('soldOutAvgKilometersByMakeAnalysis').textContent = conclusion;
}

function createSoldOutPriceDistributionChart(data) {
    const ctx = document.getElementById('soldOutPriceDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Minimum', '25th Percentile', 'Median', '75th Percentile', 'Maximum'],
            datasets: [{
                label: 'Price (AED)',
                data: [data.min, data.percentiles['0.25'], data.median, data.percentiles['0.75'], data.max],
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Price Distribution in Sold Out Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Price (AED)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {maximumFractionDigits: 0});
                        }
                    }
                }
            }
        }
    });

    const median = data.median.toLocaleString('en-US', {maximumFractionDigits: 0});
    const iqr = (data.percentiles['0.75'] - data.percentiles['0.25']).toLocaleString('en-US', {maximumFractionDigits: 0});
    const conclusion = `The median price for sold cars is AED ${median}, with an interquartile range of AED ${iqr}. This indicates the central tendency and spread of prices in the used car market.`;
    document.getElementById('soldOutPriceDistributionAnalysis').textContent = conclusion;
}

function createSoldOutPriceRangeDistributionChart(data) {
    const ctx = document.getElementById('soldOutPriceRangeDistributionChart').getContext('2d');

    // Define the correct order of price ranges
    const orderedRanges = [
        '0k-50k', '50k-100k', '100k-150k', '150k-200k', '200k-250k',
        '250k-300k', '300k-350k', '350k-400k', '400k-450k', '450k-500k', '500k+'
    ];

    // Create a new ordered data object
    const orderedData = {};
    orderedRanges.forEach(range => {
        orderedData[range] = data[range] || 0;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(orderedData),
            datasets: [{
                label: 'Number of Cars',
                data: Object.values(orderedData),
                backgroundColor: 'rgba(255, 159, 64, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Cars by Price Range in Sold Out Listings'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Price Range (AED)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const mostCommonRange = Object.entries(orderedData).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const totalCars = Object.values(orderedData).reduce((a, b) => a + b, 0);
    const percentage = ((orderedData[mostCommonRange] / totalCars) * 100).toFixed(2);
    const conclusion = `The most common price range for sold cars is ${mostCommonRange}, accounting for ${percentage}% of all sales. This suggests the sweet spot for pricing in the used car market.`;
    document.getElementById('soldOutPriceRangeDistributionAnalysis').textContent = conclusion;
}

function createSoldOutYearDistributionChart(data) {
    const ctx = document.getElementById('soldOutYearDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Number of Cars',
                data: Object.values(data),
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Cars by Year in Sold Out Listings'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const mostCommonYear = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const totalCars = Object.values(data).reduce((a, b) => a + b, 0);
    const percentage = ((data[mostCommonYear] / totalCars) * 100).toFixed(2);
    const conclusion = `The most common model year for sold cars is ${mostCommonYear}, representing ${percentage}% of all sales. This indicates the age of vehicles that are most in demand in the used car market.`;
    document.getElementById('soldOutYearDistributionAnalysis').textContent = conclusion;
}

function createSoldOutRegionalSpecsChart(data) {
    const ctx = document.getElementById('soldOutRegionalSpecsChart').getContext('2d');
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Regional Specs in Sold Out Listings'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const mostCommonSpec = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const percentage = ((data[mostCommonSpec] / total) * 100).toFixed(2);
    const conclusion = `${mostCommonSpec} is the most common regional specification, accounting for ${percentage}% of sold cars. This reflects the predominant market preference or availability of certain specifications.`;
    document.getElementById('soldOutRegionalSpecsAnalysis').textContent = conclusion;
}

function createSoldOutSellerTypeChart(data) {
    const ctx = document.getElementById('soldOutSellerTypeChart').getContext('2d');
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Seller Types in Sold Out Listings'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const mostCommonType = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const percentage = ((data[mostCommonType] / total) * 100).toFixed(2);
    const conclusion = `${mostCommonType} are the most common seller type, representing ${percentage}% of sold cars. This indicates the dominant source of used cars in the market.`;
    document.getElementById('soldOutSellerTypeAnalysis').textContent = conclusion;
}

function createSoldOutBodyTypeChart(data) {
    const ctx = document.getElementById('soldOutBodyTypeChart').getContext('2d');
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Body Types in Sold Out Listings'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const mostCommonType = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const percentage = ((data[mostCommonType] / total) * 100).toFixed(2);
    const conclusion = `${mostCommonType} is the most popular body type, accounting for ${percentage}% of sold cars. This reflects consumer preferences for specific vehicle designs.`;
    document.getElementById('soldOutBodyTypeAnalysis').textContent = conclusion;
}

function createSoldOutFuelTypeChart(data) {
    const ctx = document.getElementById('soldOutFuelTypeChart').getContext('2d');
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Fuel Types in Sold Out Listings'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const mostCommonType = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const percentage = ((data[mostCommonType] / total) * 100).toFixed(2);
    const conclusion = `${mostCommonType} is the predominant fuel type, representing ${percentage}% of sold cars. This indicates the market's preference or availability of certain fuel types.`;
    document.getElementById('soldOutFuelTypeAnalysis').textContent = conclusion;
}

function createSoldOutTransmissionTypeChart(data) {
    const ctx = document.getElementById('soldOutTransmissionTypeChart').getContext('2d');
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Transmission Types in Sold Out Listings'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    const mostCommonType = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const percentage = ((data[mostCommonType] / total) * 100).toFixed(2);
    const conclusion = `${mostCommonType} transmission is the most common, accounting for ${percentage}% of sold cars. This reflects the market preference for this type of transmission.`;
    document.getElementById('soldOutTransmissionTypeAnalysis').textContent = conclusion;
}

function createSoldOutAgeDistributionChart(data) {
    const ctx = document.getElementById('soldOutAgeDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Number of Cars',
                data: Object.values(data),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Car Ages in Sold Out Listings'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age (years)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const mostCommonAge = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const totalCars = Object.values(data).reduce((a, b) => a + b, 0);
    const percentage = ((data[mostCommonAge] / totalCars) * 100).toFixed(2);
    const conclusion = `Cars aged ${mostCommonAge} years are the most common in sold listings, representing ${percentage}% of the total. This suggests the optimal age for reselling used cars in this market.`;
    document.getElementById('soldOutAgeDistributionAnalysis').textContent = conclusion;
}

function createSoldOutPriceByAgeChart(data) {
    const ctx = document.getElementById('soldOutPriceByAgeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Average Price (AED)',
                data: Object.values(data),
                borderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Price by Car Age in Sold Out Listings'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age (years)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Price (AED)'
                    }
                }
            }
        }
    });

    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const highestPriceAge = sortedData[0][0];
    const highestPrice = sortedData[0][1].toFixed(2);
    const conclusion = `Cars aged ${highestPriceAge} years have the highest average price at AED ${highestPrice}. This chart shows how car prices generally decrease with age, with some exceptions possibly due to classic or collector cars.`;
    document.getElementById('soldOutPriceByAgeAnalysis').textContent = conclusion;
}

function createSoldOutKilometersByAgeChart(data) {
    const ctx = document.getElementById('soldOutKilometersByAgeChart').getContext('2d');
    const sortedData = Object.entries(data).sort((a, b) => Number(a[0]) - Number(b[0]));

    const peakData = sortedData.reduce((peak, current) => {
        return (current[1] > peak[1]) ? current : peak;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Average Kilometers',
                data: sortedData.map(item => item[1]),
                borderColor: 'rgba(54, 162, 235, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Kilometers by Car Age in Sold Out Listings'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age (years)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Kilometers'
                    }
                }
            }
        }
    });

    const peakAge = peakData[0];
    const peakKilometers = peakData[1].toFixed(2);
    const oldestAge = sortedData[sortedData.length - 1][0];
    const oldestKilometers = sortedData[sortedData.length - 1][1].toFixed(2);

    const conclusion = `The chart shows a general upward trend in average kilometers as car age increases, which is expected due to cumulative usage over time. Peak mileage is seen in cars aged ${peakAge} years with ${peakKilometers} kilometers. Interestingly, the oldest cars (${oldestAge} years) show a slight decrease to ${oldestKilometers} kilometers, possibly due to selective preservation of lower-mileage older vehicles.`;

    document.getElementById('soldOutKilometersByAgeAnalysis').textContent = conclusion;
}

function createSoldOutTopMakeModelByPriceChart(data) {
    const sortedData = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const ctx = document.getElementById('soldOutTopMakeModelByPriceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Average Price (AED)',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(255, 206, 86, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Make-Model Combinations by Average Price in Sold Out Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Price (AED)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {maximumFractionDigits: 0});
                        }
                    }
                }
            }
        }
    });

    const topMakeModel = sortedData[0][0];
    const topPrice = sortedData[0][1].toLocaleString('en-US', {maximumFractionDigits: 0});
    const conclusion = `The ${topMakeModel} has the highest average price at AED ${topPrice} among sold cars. This chart highlights the most valuable make-model combinations in the used car market, which could be due to factors such as brand prestige, performance, or rarity.`;
    document.getElementById('soldOutTopMakeModelByPriceAnalysis').textContent = conclusion;
}

function createSoldOutTopMakeModelByKilometersChart(data) {
    const sortedData = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const ctx = document.getElementById('soldOutTopMakeModelByKilometersChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Average Kilometers',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Make-Model Combinations by Average Kilometers in Sold Out Listings'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Kilometers'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {maximumFractionDigits: 0});
                        }
                    }
                }
            }
        }
    });

    const topMakeModel = sortedData[0][0];
    const topKilometers = sortedData[0][1].toLocaleString('en-US', {maximumFractionDigits: 0});
    const conclusion = `The ${topMakeModel} has the highest average mileage at ${topKilometers} kilometers among sold cars. This chart shows which make-model combinations tend to have the highest mileage, which could indicate durability or popularity for long-distance driving.`;
    document.getElementById('soldOutTopMakeModelByKilometersAnalysis').textContent = conclusion;
}

function createSoldOutKmPerYearChart(data) {
    const ctx = document.getElementById('soldOutKmPerYearChart').getContext('2d');

    // Define the correct order of kilometer ranges
    const orderedRanges = [
        '0-5k', '5k-10k', '10k-15k', '15k-20k', '20k-25k',
        '25k-30k', '30k-35k', '35k-40k', '40k-45k', '45k-50k', '50k+'
    ];

    // Create a new ordered data object
    const orderedData = {};
    orderedRanges.forEach(range => {
        orderedData[range] = data[range] || 0;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(orderedData),
            datasets: [{
                label: 'Number of Cars',
                data: Object.values(orderedData),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Kilometers Driven per Year in Sold Out Listings'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Kilometers per Year'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Cars'
                    }
                }
            }
        }
    });

    const mostCommonRange = Object.entries(orderedData).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const totalCars = Object.values(orderedData).reduce((a, b) => a + b, 0);
    const percentage = ((orderedData[mostCommonRange] / totalCars) * 100).toFixed(2);
    const conclusion = `The most common range for kilometers driven per year is ${mostCommonRange}, accounting for ${percentage}% of sold cars. This information provides insight into typical usage patterns of cars in the market and could be valuable for buyers and sellers in assessing vehicle wear and tear.`;
    document.getElementById('soldOutKmPerYearAnalysis').textContent = conclusion;
}

function generateSoldOutOverallSummary(analysis) {
    const summaryElement = document.getElementById('soldOutOverallSummary');
    if (!summaryElement) {
        console.error("Sold out overall summary element not found");
        return;
    }

    const summary = `
        <h4>1. Objective:</h4>
        <p>This analysis aimed to understand the sold out car market dynamics for vehicles from 1990 onwards, focusing on factors affecting car sales, pricing trends, and features of cars that have been sold.</p>

        <h4>2. Data Collection:</h4>
        <p>The dataset comprises sold out car listings from Dubizzle, including details of cars that have been sold.</p>

        <h4>3. Data Cleaning:</h4>
        <p>The data underwent cleaning processes to handle missing values, remove duplicates, and ensure consistency in data types across all features.</p>

        <h4>4. Exploratory Data Analysis (EDA):</h4>
        <ul>
            ${analysis.top_makes ? `
                <li>The most common car makes in sold out listings are ${Object.keys(analysis.top_makes).slice(0, 3).join(', ')}.</li>
            ` : ''}
            ${analysis.price_distribution ? `
                <li>The average price across all sold out listings is AED ${Math.round(analysis.price_distribution.mean).toLocaleString()}.</li>
            ` : ''}
            ${analysis.body_type_distribution ? `
                <li>The most common body type among sold cars is ${Object.keys(analysis.body_type_distribution)[0]}.</li>
            ` : ''}
            ${analysis.fuel_type_distribution ? `
                <li>The predominant fuel type in sold cars is ${Object.keys(analysis.fuel_type_distribution)[0]}.</li>
            ` : ''}
            ${analysis.transmission_type_distribution ? `
                <li>The majority of sold vehicles use ${Object.keys(analysis.transmission_type_distribution)[0]}.</li>
            ` : ''}
        </ul>

        <h4>5. Key Insights:</h4>
        <ul>
            ${analysis.price_by_age ? `
                <li>Price Trends: There's a clear trend of decreasing average price as vehicle age increases in sold cars, with newer models commanding significantly higher prices.</li>
            ` : ''}
            ${analysis.seller_type_distribution ? `
                <li>Market Composition: The sold car market was primarily driven by ${Object.keys(analysis.seller_type_distribution)[0]}.</li>
            ` : ''}
            ${analysis.regional_specs_distribution ? `
                <li>Regional Preferences: ${Object.keys(analysis.regional_specs_distribution)[0]} were the most common regional specifications among sold cars.</li>
            ` : ''}
            ${analysis.age_distribution ? `
                <li>Age Distribution: The age distribution of sold cars shows a peak at ${Object.keys(analysis.age_distribution).reduce((a, b) => analysis.age_distribution[a] > analysis.age_distribution[b] ? a : b)} years old.</li>
            ` : ''}
        </ul>

        <h4>6. Limitations:</h4>
        <p>This analysis is based on sold out listings data and may not fully capture market dynamics influenced by external factors or buyer behavior not reflected in the listings.</p>

        <h4>7. Future Work:</h4>
        <p>Further analysis could include time-series forecasting of price trends, deeper investigation into factors affecting sale speed, and incorporation of additional data sources to enhance predictive modeling for the used car market.</p>
    `;

    summaryElement.innerHTML = summary;
}

console.log("Auction cars analysis script loaded");

function loadAllMarketInsights() {
    console.log("Loading all market insights");
    loadCarsForSaleInsights()
        .then(() => loadSoldOutCarsInsights())
        .then(() => loadAuctionCarsInsights())
        .catch(error => console.error("Error in loadAllMarketInsights:", error));
}

function loadAuctionCarsInsights() {
    return new Promise((resolve, reject) => {
        console.log("loadAuctionCarsInsights called");
        fetch('/get-auction-cars-analysis')
            .then(response => {
                console.log("Received response from server for auction cars");
                return response.json();
            })
            .then(data => {
                console.log("Parsed JSON data for auction cars:", data);
                if (data.success) {
                    console.log("Successfully received auction cars analysis data");
                    processAuctionCarsAnalysis(data.analysis);
                    resolve();
                } else {
                    console.error("Failed to load auction cars data:", data.error);
                    reject(new Error(data.error));
                }
            })
            .catch(error => {
                console.error('Error loading auction car data analysis:', error);
                reject(error);
            });
    });
}

function processAuctionCarsAnalysis(analysis) {
    console.log("Processing auction cars analysis data");
    try {
        createAuctionMakeDistributionChart(analysis.make_distribution);
        createAuctionMakeModelDistributionChart(analysis.make_model_distribution);
        createAuctionYearDistributionChart(analysis.year_distribution);
        createAuctionOdometerDistributionChart(analysis.odometer_distribution);
        createAuctionDateDistributionChart(analysis.auction_date_distribution);
        createAuctionSpecificationDistributionChart(analysis.specification_distribution);
        createAuctionPrimaryDamageDistributionChart(analysis.primary_damage_distribution);
        createAuctionParticipationDistributionChart(analysis.participation_distribution);
        createAuctionBidDifferenceDistributionChart(analysis.bid_difference_distribution);

        generateAuctionOverallSummary(analysis);
    } catch (error) {
        console.error("Error processing auction cars analysis:", error);
    }
}

function createBarChart(canvasId, title, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`${canvasId} canvas not found`);
        return;
    }
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: title,
                data: sortedData.map(item => item[1]),
                backgroundColor: chartColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createLineChart(canvasId, title, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`${canvasId} canvas not found`);
        return;
    }
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');
    const sortedData = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: title,
                data: sortedData.map(item => item[1]),
                borderColor: chartColors[1],
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            }
        }
    });
}

function createPieChart(canvasId, title, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`${canvasId} canvas not found`);
        return;
    }
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const total = sortedData.reduce((sum, [, value]) => sum + value, 0);

    const labels = sortedData.map(([key, value]) => {
        const percentage = ((value / total) * 100).toFixed(1);
        return `${key} (${percentage}%)`;
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: sortedData.map(item => item[1]),
                backgroundColor: chartColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createAuctionMakeDistributionChart(data) {
    createBarChart('auctionMakeDistributionChart', 'Top 10 Makes in Auctions', data);
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const topMake = sortedData[0];
    const analysis = `${topMake[0]} is the most common make in auctions, with ${topMake[1]} listings. This suggests a high demand or availability for ${topMake[0]} in the auction market.`;
    document.getElementById('auctionMakeDistributionAnalysis').textContent = analysis;
}

function createAuctionMakeModelDistributionChart(data) {
    createBarChart('auctionMakeModelDistributionChart', 'Top 10 Make-Model Combinations in Auctions', data);
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const topMakeModel = sortedData[0];
    const analysis = `The ${topMakeModel[0]} is the most frequent make-model combination in auctions, with ${topMakeModel[1]} listings. This indicates a particular popularity or abundance of this model in the auction market.`;
    document.getElementById('auctionMakeModelDistributionAnalysis').textContent = analysis;
}

function createAuctionYearDistributionChart(data) {
    createLineChart('auctionYearDistributionChart', 'Year Distribution of Auction Cars', data);
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const mostCommonYear = sortedData[0];
    const analysis = `The most common model year for auctioned cars is ${mostCommonYear[0]}, with ${mostCommonYear[1]} cars. This suggests a peak in availability or demand for cars from this year in the auction market.`;
    document.getElementById('auctionYearDistributionAnalysis').textContent = analysis;
}

function createAuctionOdometerDistributionChart(data) {
    const canvas = document.getElementById('auctionOdometerDistributionChart');
    if (!canvas) {
        console.error('auctionOdometerDistributionChart canvas not found');
        return;
    }
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Minimum', 'Average', 'Maximum'],
            datasets: [{
                label: 'Kilometers',
                data: [data.min, data.mean, data.max],
                backgroundColor: chartColors.slice(0, 3)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Odometer Distribution of Auction Cars'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kilometers'
                    }
                }
            }
        }
    });

    const analysis = `The average mileage of auctioned cars is ${Math.round(data.mean).toLocaleString()} km, with a minimum of ${Math.round(data.min).toLocaleString()} km and a maximum of ${Math.round(data.max).toLocaleString()} km. This wide range indicates the diversity of vehicles available in auctions.`;
    document.getElementById('auctionOdometerDistributionAnalysis').textContent = analysis;
}

function createAuctionDateDistributionChart(data) {
    createLineChart('auctionDateDistributionChart', 'Auction Date Distribution', data);
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const busiestDate = sortedData[0];
    const analysis = `The busiest auction date was ${busiestDate[0]}, with ${busiestDate[1]} auctions. This information can be useful for understanding peak periods in the auction market.`;
    document.getElementById('auctionDateDistributionAnalysis').textContent = analysis;
}

function createAuctionSpecificationDistributionChart(data) {
    createPieChart('auctionSpecificationDistributionChart', 'Distribution of Car Specifications in Auctions', data);
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const topSpec = sortedData[0];
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const percentage = ((topSpec[1] / total) * 100).toFixed(2);
    const analysis = `${topSpec[0]} is the most common specification in auctions, accounting for ${percentage}% of all auctioned cars. This suggests a preference or higher availability for ${topSpec[0]} specification vehicles in the auction market.`;
    document.getElementById('auctionSpecificationDistributionAnalysis').textContent = analysis;
}

function createAuctionPrimaryDamageDistributionChart(data) {
    createPieChart('auctionPrimaryDamageDistributionChart', 'Distribution of Primary Damage in Auction Cars', data);
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const topDamage = sortedData[0];
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const percentage = ((topDamage[1] / total) * 100).toFixed(2);
    const analysis = `${topDamage[0]} is the most common primary damage type, affecting ${percentage}% of auctioned cars. This information can be valuable for buyers assessing risks and potential repair costs.`;
    document.getElementById('auctionPrimaryDamageDistributionAnalysis').textContent = analysis;
}

function createAuctionParticipationDistributionChart(data) {
    createBarChart('auctionParticipationDistributionChart', 'Distribution of Auction Participation', data);
    const sortedData = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const topParticipation = sortedData[0];
    const analysis = `The most common participation level in auctions is ${topParticipation[0]}, occurring ${topParticipation[1]} times. This gives insight into the typical level of competition in these auctions.`;
    document.getElementById('auctionParticipationDistributionAnalysis').textContent = analysis;
}

function createAuctionBidDifferenceDistributionChart(data) {
    const canvas = document.getElementById('auctionBidDifferenceDistributionChart');
    if (!canvas) {
        console.error('auctionBidDifferenceDistributionChart canvas not found');
        return;
    }
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Minimum', 'Average', 'Maximum'],
            datasets: [{
                label: 'Bid Difference (AED)',
                data: [data.min, data.mean, data.max],
                backgroundColor: chartColors.slice(0, 3)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Bid Difference Distribution in Auctions'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Bid Difference (AED)'
                    }
                }
            }
        }
    });

    const analysis = `The average bid difference in auctions is AED ${Math.round(data.mean).toLocaleString()}, with a minimum of AED ${Math.round(data.min).toLocaleString()} and a maximum of AED ${Math.round(data.max).toLocaleString()}. This shows the range of price increases during auctions, indicating the level of competition and potential for price escalation.`;
    document.getElementById('auctionBidDifferenceDistributionAnalysis').textContent = analysis;
}

function generateAuctionOverallSummary(analysis) {
    const summary = `
        <h4>1. Objective:</h4>
        <p>This analysis aimed to understand the auction car market dynamics, focusing on factors affecting car listings, pricing trends, and features of cars that are typically auctioned.</p>

        <h4>2. Data Collection:</h4>
        <p>The dataset comprises auction car listings from various sources, including details of cars that have been put up for auction.</p>

        <h4>3. Data Cleaning:</h4>
        <p>The data underwent cleaning processes to handle missing values, remove duplicates, and ensure consistency in data types across all features.</p>

        <h4>4. Exploratory Data Analysis (EDA):</h4>
        <ul>
            ${analysis.make_distribution ? `
                <li>The most common car makes in auctions are ${Object.keys(analysis.make_distribution).slice(0, 3).join(', ')}.</li>
            ` : ''}
            ${analysis.odometer_distribution ? `
                <li>The average mileage of auctioned cars is ${Math.round(analysis.odometer_distribution.mean).toLocaleString()} km.</li>
            ` : ''}
            ${analysis.primary_damage_distribution ? `
                <li>The most common primary damage type is ${Object.keys(analysis.primary_damage_distribution)[0]}.</li>
            ` : ''}
            ${analysis.specification_distribution ? `
                <li>The predominant car specification in auctions is ${Object.keys(analysis.specification_distribution)[0]}.</li>
            ` : ''}
        </ul>

        <h4>5. Key Insights:</h4>
        <ul>
            ${analysis.year_distribution ? `
                <li>Year Distribution: The most common model year for auctioned cars is ${Object.keys(analysis.year_distribution).reduce((a, b) => analysis.year_distribution[a] > analysis.year_distribution[b] ? a : b)}, indicating the age range of cars typically available in auctions.</li>
            ` : ''}
            ${analysis.bid_difference_distribution ? `
                <li>Bid Differences: The average bid difference in auctions is AED ${Math.round(analysis.bid_difference_distribution.mean).toLocaleString()}, showing the typical price increase during auctions.</li>
            ` : ''}
            ${analysis.participation_distribution ? `
                <li>Auction Participation: The most common participation level is ${Object.keys(analysis.participation_distribution).reduce((a, b) => analysis.participation_distribution[a] > analysis.participation_distribution[b] ? a : b)}, giving insight into the level of competition in these auctions.</li>
            ` : ''}
        </ul>

        <h4>6. Limitations:</h4>
        <p>This analysis is based on available auction data and may not fully capture market dynamics influenced by external factors or buyer behavior not reflected in the auction listings.</p>

        <h4>7. Future Work:</h4>
        <p>Further analysis could include predictive modeling of final auction prices, investigation into factors affecting auction success rates, and incorporation of additional data sources to enhance our understanding of the auction car market.</p>
    `;

    document.getElementById('auctionOverallSummary').innerHTML = summary;
}

function createBoxPlot(canvasId, title, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`${canvasId} canvas not found`);
        return;
    }
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');
    try {
        new Chart(ctx, {
            type: 'boxplot',
            data: {
                labels: [title],
                datasets: [{
                    label: title,
                    backgroundColor: chartColors[0],
                    borderColor: chartColors[1],
                    outlierColor: chartColors[2],
                    data: [
                        {
                            min: data.min,
                            q1: data.percentiles['0.25'],
                            median: data.median,
                            q3: data.percentiles['0.75'],
                            max: data.max,
                            outliers: []
                        }
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    }
                }
            }
        });
    } catch (error) {
        console.error(`Error creating boxplot ${canvasId}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    const insightsSection = document.getElementById('used-car-market-insights-section');
    if (insightsSection) {
        console.log("Used Car Market Insights section found, loading data");
        loadAllMarketInsights();
    } else {
        console.log("Used Car Market Insights section not found");
    }
});