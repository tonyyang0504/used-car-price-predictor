document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('prediction-form');
    const makeSelect = document.getElementById('make');
    const modelSelect = document.getElementById('model');
    const yearSelect = document.getElementById('year');
    const kilometersInput = document.getElementById('kilometers');
    const trimSelect = document.getElementById('trim');
    const regionalSpecsSelect = document.getElementById('regional-specs');
    const estimateBtn = document.getElementById('estimate-value-btn');
    const clearBtn = document.getElementById('clear-form-btn');

    // Populate Make dropdown
    populateSelectOptions(makeSelect, options['Make']);

    // Populate Regional Specs dropdown with all available options
    populateSelectOptions(regionalSpecsSelect, options['Regional Specs']);

    // Handle make selection
    makeSelect.addEventListener('change', function() {
        const selectedMake = this.value;

        // Update Model options
        const modelOptions = filtering_rules[selectedMake]?.Model || [];
        populateSelectOptions(modelSelect, modelOptions);
        modelSelect.disabled = modelOptions.length === 0;

        // Reset Trim
        resetSelect(trimSelect);

        validateForm();
    });

    // Handle model selection
    modelSelect.addEventListener('change', function() {
        const selectedMake = makeSelect.value;
        const selectedModel = this.value;

        // Update Trim options
        const trimOptions = filtering_rules[selectedMake]?.Trim[selectedModel] || [];
        populateSelectOptions(trimSelect, ['Unknown', ...trimOptions]);
        trimSelect.disabled = false;

        validateForm();
    });

    // Add event listeners for other inputs
    yearSelect.addEventListener('change', validateForm);
    kilometersInput.addEventListener('input', validateForm);
    trimSelect.addEventListener('change', validateForm);
    regionalSpecsSelect.addEventListener('change', validateForm);

    // Handle Clear button click
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        clearForm();
        clearResults();
    });

    function validateForm() {
        const isValid = makeSelect.value &&
                        modelSelect.value &&
                        yearSelect.value &&
                        kilometersInput.value &&
                        trimSelect.value &&
                        regionalSpecsSelect.value;

        estimateBtn.disabled = !isValid;
    }

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        hideError();
        showLoading();

        const formData = new FormData(form);

        fetch('/', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            if (data.success) {
                displayPrediction(data);
            } else {
                showError(data.error || 'An error occurred while processing your request.');
            }
        })
        .catch(error => {
            hideLoading();
            showError('An error occurred while processing your request: ' + error.message);
            console.error('Error:', error);
        });
    });

    // Initialize form validation
    validateForm();
});

function clearForm() {
    const form = document.getElementById('prediction-form');
    form.reset();

    // Reset select elements to their initial state
    const makeSelect = document.getElementById('make');
    const modelSelect = document.getElementById('model');
    const trimSelect = document.getElementById('trim');
    const regionalSpecsSelect = document.getElementById('regional-specs');

    // Reset Make dropdown to initial state
    populateSelectOptions(makeSelect, options['Make']);

    // Reset Model and Trim dropdowns
    resetSelect(modelSelect);
    resetSelect(trimSelect);

    // Reset Regional Specs dropdown to include all options
    populateSelectOptions(regionalSpecsSelect, options['Regional Specs']);

    // Disable the estimate button
    document.getElementById('estimate-value-btn').disabled = true;
}

function clearResults() {
    // Clear prediction
    const predictionElement = document.getElementById('prediction');
    predictionElement.style.display = 'none';
    const predictedPriceElement = document.getElementById('predicted-price');
    if (predictedPriceElement) {
        predictedPriceElement.textContent = '';
    }

    // Clear car info
    const carInfoElement = document.getElementById('carInfo');
    carInfoElement.style.display = 'none';
    const carInfoContentElement = document.getElementById('carInfoContent');
    if (carInfoContentElement) {
        carInfoContentElement.innerHTML = '';
    }

    // Clear similar cars
    const similarCarsElement = document.getElementById('similarCars');
    similarCarsElement.style.display = 'none';
    similarCarsElement.innerHTML = '';

    // Clear sold out cars
    const soldOutCarsElement = document.getElementById('soldOutCars');
    soldOutCarsElement.style.display = 'none';
    soldOutCarsElement.innerHTML = '';

    // Clear trim predictions
    const trimPredictionsElement = document.getElementById('trimPredictions');
    if (trimPredictionsElement) {
        trimPredictionsElement.style.display = 'none';
        trimPredictionsElement.innerHTML = '';
    }

    // Clear any error messages
    hideError();

    // Hide loading indicator
    hideLoading();
}

function resetSelect(selectElement) {
    selectElement.innerHTML = '<option value="">Select an option</option>';
    selectElement.disabled = true;
}

function populateSelectOptions(selectElement, options) {
    selectElement.innerHTML = '<option value="">Select an option</option>';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
    selectElement.disabled = false;
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Hide the loading indicator if it's still visible
    hideLoading();

    // Scroll to the error message
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

function showLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';

    // Hide any previous error messages
    hideError();
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'none';
}

function displayPrediction(data) {
    const predictionElement = document.getElementById('prediction');
    const predictedPriceElement = document.getElementById('predicted-price');
    const carInfoElement = document.getElementById('carInfo');
    const similarCarsElement = document.getElementById('similarCars');
    const soldOutCarsElement = document.getElementById('soldOutCars');

    // Display predicted price
    predictionElement.innerHTML = '<h3>Predicted Price</h3>';
    predictedPriceElement.textContent = data.prediction;
    predictionElement.appendChild(predictedPriceElement);
    predictionElement.style.display = 'block';

    // Display car info
    carInfoElement.innerHTML = '<h3>Car Information</h3>';
    const carInfoContent = document.createElement('div');
    for (const [key, value] of Object.entries(data.car_info)) {
        const p = document.createElement('p');
        p.textContent = `${key}: ${value}`;
        carInfoContent.appendChild(p);
    }
    carInfoElement.appendChild(carInfoContent);
    carInfoElement.style.display = 'block';

    // Display similar cars for sale
    displaySimilarCars(data.similar_cars, similarCarsElement, 'Similar Cars for Sale', true);

    // Display similar sold out cars
    displaySimilarCars(data.sold_out_cars, soldOutCarsElement, 'Similar Cars Sold Out', false);

    // Display trim predictions if available
    if (data.trim_predictions) {
        displayTrimPredictions(data.trim_predictions);
    }

    // Apply table styling and center alignment
    applyTableStyling();
    applyCenterAlignment();
}

function displaySimilarCars(cars, element, title, includeLink) {
    element.innerHTML = '';
    if (cars && cars.length > 0) {
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'car-section';

        const headerContainer = document.createElement('div');
        headerContainer.className = 'section-header';

        const heading = document.createElement('h3');
        heading.textContent = title;
        headerContainer.appendChild(heading);

        // Add Total Records display
        const totalRecords = document.createElement('span');
        totalRecords.textContent = `Total Records: ${cars.length}`;
        totalRecords.className = 'total-records';
        headerContainer.appendChild(totalRecords);

        sectionContainer.appendChild(headerContainer);

        // Table view
        const tableContainer = document.createElement('div');
        tableContainer.className = 'car-table-container table-responsive';

        const table = createCarTable(cars, includeLink);
        tableContainer.appendChild(table);
        sectionContainer.appendChild(tableContainer);

        element.appendChild(sectionContainer);

        // Add pagination
        addPagination(element, cars, getTableHeaders(includeLink), includeLink);

        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

function createCarTable(cars, includeLink) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = getTableHeaders(includeLink);

    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.addEventListener('click', () => sortCars(cars, headers.indexOf(text), table.closest('.car-section'), includeLink));
        headerRow.appendChild(th);
    });
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    cars.slice(0, 10).forEach(car => {
        const row = tbody.insertRow();
        headers.forEach(header => {
            const cell = row.insertCell();
            if (header === 'Link' && includeLink) {
                if (car.permalink) {
                    const link = document.createElement('a');
                    link.href = car.permalink;
                    link.textContent = 'View';
                    link.target = '_blank';
                    cell.appendChild(link);
                }
            } else {
                cell.textContent = formatCarData(car, header);
            }
        });
    });
    table.appendChild(tbody);

    return table;
}

function formatCarData(car, header) {
    switch (header) {
        case 'Price (AED)':
            return car['Price'] ? formatNumber(car['Price']) : 'N/A';
        case 'Kilometers':
            return car['Kilometers'] !== null && car['Kilometers'] !== undefined ?
                formatNumber(car['Kilometers']) : 'N/A';
        case 'Posted Date':
            return formatPostedDate(car['Posted Date']);
        default:
            return car[header.replace(' (AED)', '')] || 'N/A';
    }
}

function getTableHeaders(includeLink) {
    const headers = ['Make', 'Model', 'Trim', 'Year', 'Kilometers', 'Regional Specs', 'Price (AED)', 'Seller Type', 'Posted Date', 'Source'];
    if (includeLink) headers.push('Link');
    return headers;
}

function addPagination(element, cars, headers, includeLink) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';
    paginationDiv.innerHTML = `
        <button class="prev-page" disabled>&lt;</button>
        <span class="current-page">1</span>
        <button class="next-page">&gt;</button>
    `;
    element.appendChild(paginationDiv);

    updatePagination(element, cars, headers, includeLink);
}

function updatePagination(element, cars, headers, includeLink) {
    const paginationDiv = element.querySelector('.pagination');
    const prevButton = paginationDiv.querySelector('.prev-page');
    const nextButton = paginationDiv.querySelector('.next-page');
    const currentPageSpan = paginationDiv.querySelector('.current-page');
    let currentPage = parseInt(currentPageSpan.textContent);
    const totalPages = Math.ceil(cars.length / 10);

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });

    function updateTable() {
        const start = (currentPage - 1) * 10;
        const end = start + 10;
        const tbody = element.querySelector('tbody');
        tbody.innerHTML = '';
        cars.slice(start, end).forEach(car => {
            const row = tbody.insertRow();
            headers.forEach(header => {
                const cell = row.insertCell();
                if (header === 'Link' && includeLink) {
                    if (car.permalink) {
                        const link = document.createElement('a');
                        link.href = car.permalink;
                        link.textContent = 'View';
                        link.target = '_blank';
                        cell.appendChild(link);
                    } else {
                        cell.textContent = '';
                    }
                } else {
                    cell.textContent = formatCarData(car, header);
                }
            });
        });
        currentPageSpan.textContent = currentPage;
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
    }

    updateTable();
}

function sortCars(cars, columnIndex, element, includeLink) {
    const headers = getTableHeaders(includeLink);
    const header = headers[columnIndex];
    const isNumeric = ['Year', 'Kilometers', 'Price (AED)'].includes(header);
    const isDate = header === 'Posted Date';

    cars.sort((a, b) => {
        let aValue = a[header.replace(' (AED)', '')];
        let bValue = b[header.replace(' (AED)', '')];

        if (isNumeric) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else if (isDate) {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
            if (isNaN(aValue)) aValue = new Date(0);
            if (isNaN(bValue)) bValue = new Date(0);
        }

        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
    });

    const table = element.querySelector('table');
    if (table.getAttribute('data-sort-dir') === 'asc') {
        cars.reverse();
        table.setAttribute('data-sort-dir', 'desc');
    } else {
        table.setAttribute('data-sort-dir', 'asc');
    }

    // Update the existing pagination with sorted data
    updatePagination(element, cars, headers, includeLink);
}

function displayTrimPredictions(trimPredictions) {
    const trimPredictionsElement = document.getElementById('trimPredictions');
    if (trimPredictionsElement) {
        trimPredictionsElement.innerHTML = '';
        const heading = document.createElement('h3');
        heading.textContent = 'Trim-specific Predictions';
        trimPredictionsElement.appendChild(heading);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = thead.insertRow();
        ['Trim', 'Predicted Price'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (const [trim, price] of Object.entries(trimPredictions)) {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = trim;
            row.insertCell(1).textContent = price;
        }
        table.appendChild(tbody);
        trimPredictionsElement.appendChild(table);
        trimPredictionsElement.style.display = 'block';
    }
}

function applyTableStyling() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        table.classList.add('sortable', 'center-aligned');
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
            header.addEventListener('click', () => sortTable(table, Array.from(headers).indexOf(header)));
        });
    });
}

function applyCenterAlignment() {
    const tables = document.querySelectorAll('table.center-aligned');
    tables.forEach(table => {
        const cells = table.querySelectorAll('th, td');
        cells.forEach(cell => {
            cell.style.textAlign = 'center';
        });
    });
}

function sortTable(table, columnIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isNumeric = rows.some(row => !isNaN(row.cells[columnIndex].textContent.trim()));

    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();

        if (isNumeric) {
            aValue = parseFloat(aValue.replace(/[^\d.-]/g, ''));
            bValue = parseFloat(bValue.replace(/[^\d.-]/g, ''));
        }

        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
    });

    if (table.getAttribute('data-sort-dir') === 'asc') {
        rows.reverse();
        table.setAttribute('data-sort-dir', 'desc');
    } else {
        table.setAttribute('data-sort-dir', 'asc');
    }

    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

function formatNumber(num) {
    if (num === null || num === undefined) {
        return 'N/A';
    }
    return new Intl.NumberFormat('en-US').format(num);
}

function formatDate(dateString) {
    if (!dateString || dateString.toLowerCase() === 'unknown') {
        return 'Unknown';
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
}

function formatPostedDate(dateString) {
    if (!dateString || dateString.toLowerCase() === 'unknown') {
        return 'Unknown';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Unknown';
    }
    return formatDate(dateString);
}