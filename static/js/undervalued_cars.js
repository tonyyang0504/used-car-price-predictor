document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('undervalued-cars-filter-form');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const tableBody = document.getElementById('undervalued-cars-table').getElementsByTagName('tbody')[0];
    const totalRecordsElement = document.getElementById('undervalued-total-records');
    const paginationContainer = document.getElementById('undervaluedCarsPagination');

    let allCars = [];
    let filteredCars = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let filterData = {};
    let minYear, maxYear;
    let currentSortColumn = '';
    let currentSortOrder = 'asc';

    // Fetch initial data and populate filters
    fetchUndervaluedCars();

    // Handle form submission
    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        applyFilters();
    });

    // Handle clear button click
    clearFilterBtn.addEventListener('click', function() {
        filterForm.reset();
        resetFilters();
        setTimeout(() => {
            applyFilters();
        }, 0);
    });

    function fetchUndervaluedCars() {
        showLoading();
        hideError();

        fetch('/start-price-monitoring')
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    allCars = data.undervaluedCars;
                    filteredCars = allCars;
                    populateFilters(data);
                    displayCars();
                } else {
                    showError(data.error || 'An error occurred while fetching undervalued cars.');
                }
            })
            .catch(error => {
                hideLoading();
                showError('An error occurred while fetching undervalued cars.');
                console.error('Error:', error);
            });
    }

    function populateFilters(data) {
        const makeFilter = document.getElementById('make-filter');
        const modelFilter = document.getElementById('model-filter');
        const regionalSpecsFilter = document.getElementById('regional-specs-filter');
        const sourceFilter = document.getElementById('source-filter');
        const sellerTypeFilter = document.getElementById('seller-type-filter');

        // Populate make filter and create filterData structure
        const uniqueMakes = [...new Set(allCars.map(car => car.Make))].sort();
        populateSelectOptions(makeFilter, uniqueMakes);

        filterData = uniqueMakes.reduce((acc, make) => {
            acc[make] = {
                models: []
            };
            return acc;
        }, {});

        allCars.forEach(car => {
            if (!filterData[car.Make].models.includes(car.Model)) {
                filterData[car.Make].models.push(car.Model);
            }
        });

        // Sort the models alphabetically for each make
        for (let make in filterData) {
            filterData[make].models.sort();
        }

        // Add event listener for make filter
        makeFilter.addEventListener('change', updateModelFilter);

        // Populate other filters
        const uniqueRegionalSpecs = [...new Set(allCars.map(car => car['Regional Specs']))].sort();
        const uniqueSellerTypes = [...new Set(allCars.map(car => car['Seller Type']))].sort();
        const uniqueSources = [...new Set(allCars.map(car => car.Source))].sort();

        populateSelectOptions(regionalSpecsFilter, uniqueRegionalSpecs);
        populateSelectOptions(sellerTypeFilter, uniqueSellerTypes);
        populateSelectOptions(sourceFilter, uniqueSources);

        // Populate year range filters
        populateYearRangeFilters(data.year_range);

        // Set min and max values for kilometers, price, predicted price, and undervalued percentage inputs
        setMinMaxValues('km', allCars.map(car => car.Kilometers));
        setMinMaxValues('price', allCars.map(car => car.Price));
        setMinMaxValues('predicted-price', allCars.map(car => car.Predicted_Price));
        setMinMaxValues('undervalued-percentage', allCars.map(car => (1 - car['price/expected_price']) * 100));
    }

    function populateYearRangeFilters(yearRange) {
        const yearMinFilter = document.getElementById('year-min');
        const yearMaxFilter = document.getElementById('year-max');

        minYear = Math.min(...yearRange);
        maxYear = Math.max(...yearRange);

        yearMinFilter.innerHTML = '';
        yearMaxFilter.innerHTML = '';

        // Populate min year options in ascending order
        for (let year = minYear; year <= maxYear; year++) {
            yearMinFilter.appendChild(new Option(year, year));
        }

        // Populate max year options in descending order
        for (let year = maxYear; year >= minYear; year--) {
            yearMaxFilter.appendChild(new Option(year, year));
        }

        // Set initial values
        yearMinFilter.value = minYear;
        yearMaxFilter.value = maxYear;
    }

    function updateModelFilter() {
        const makeFilter = document.getElementById('make-filter');
        const modelFilter = document.getElementById('model-filter');
        const selectedMake = makeFilter.value;

        // Clear and disable model filter
        modelFilter.innerHTML = '<option value="">Select Model</option>';
        modelFilter.disabled = true;

        if (selectedMake) {
            populateSelectOptions(modelFilter, filterData[selectedMake].models);
            modelFilter.disabled = false;
        }
    }

    function setMinMaxValues(prefix, values) {
        const minElement = document.getElementById(`${prefix}-min`);
        const maxElement = document.getElementById(`${prefix}-max`);
        const validValues = values.filter(v => v !== null && !isNaN(v));
        const minValue = Math.min(...validValues);
        const maxValue = Math.max(...validValues);
        minElement.min = minElement.placeholder = minValue;
        maxElement.max = maxElement.placeholder = maxValue;
    }

    function resetFilters() {
        document.getElementById('model-filter').innerHTML = '<option value="">Select Model</option>';
        document.getElementById('model-filter').disabled = true;

        // Reset year range to min and max years
        const yearMinFilter = document.getElementById('year-min');
        const yearMaxFilter = document.getElementById('year-max');
        yearMinFilter.value = minYear;
        yearMaxFilter.value = maxYear;

        // Reset other filters to their default states
        document.getElementById('make-filter').value = '';
        document.getElementById('regional-specs-filter').value = '';
        document.getElementById('seller-type-filter').value = '';
        document.getElementById('source-filter').value = '';

        // Reset range inputs
        document.getElementById('km-min').value = '';
        document.getElementById('km-max').value = '';
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';
        document.getElementById('predicted-price-min').value = '';
        document.getElementById('predicted-price-max').value = '';
        document.getElementById('undervalued-percentage-min').value = '';
        document.getElementById('undervalued-percentage-max').value = '';
    }

    function applyFilters() {
        // ... (existing filter logic remains the same)
    }

    function displayCars() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const carsToDisplay = filteredCars.slice(startIndex, endIndex);

        const table = document.getElementById('undervalued-cars-table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // Clear existing table content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Create table header
        const headerRow = document.createElement('tr');
        const columns = ['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Price (AED)', 'Predicted (AED)', 'Price/Expected', 'Seller Type', 'Posted Date', 'Source', 'Link'];

        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => sortTable(column));
            if (column === currentSortColumn) {
                th.classList.add(currentSortOrder);
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Populate table body
        carsToDisplay.forEach(car => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = car.Make;
            row.insertCell(1).textContent = car.Model;
            row.insertCell(2).textContent = car.Year;
            row.insertCell(3).textContent = formatNumber(car.Kilometers);
            row.insertCell(4).textContent = car['Regional Specs'];
            row.insertCell(5).textContent = formatNumber(car.Price);
            row.insertCell(6).textContent = formatNumber(car.Predicted_Price);

            const priceExpectedRatio = parseFloat(car['price/expected_price']);
            row.insertCell(7).textContent = isNaN(priceExpectedRatio) ? 'N/A' : priceExpectedRatio.toFixed(2);

            row.insertCell(8).textContent = car['Seller Type'];
            row.insertCell(9).textContent = formatDate(car['Posted Datetime']);
            row.insertCell(10).textContent = car.Source;

            const linkCell = row.insertCell(11);
            const link = document.createElement('a');
            link.href = car.permalink;
            link.textContent = 'View';
            link.target = '_blank';
            linkCell.appendChild(link);

            // Center-align all cells
            Array.from(row.cells).forEach(cell => {
                cell.style.textAlign = 'center';
            });
        });

        totalRecordsElement.textContent = `Total Records: ${filteredCars.length}`;

        // Update pagination
        paginationContainer.innerHTML = '';
        if (filteredCars.length > 0) {
            paginationContainer.appendChild(createPagination(filteredCars.length, itemsPerPage, currentPage, (page) => {
                currentPage = page;
                displayCars();
            }));
        }
    }

    function formatDate(dateString) {
        if (!dateString || dateString.toLowerCase() === 'unknown') {
            return 'Unknown';
        }
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
    }

    function createPagination(totalItems, itemsPerPage, currentPage, onPageChange) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            return document.createDocumentFragment(); // Return empty fragment if there's only one page or no items
        }

        const paginationElement = document.createElement('div');
        paginationElement.className = 'pagination';

        const prevButton = createPaginationButton('<', currentPage > 1, () => onPageChange(currentPage - 1));
        paginationElement.appendChild(prevButton);

        const pageButton = createPaginationButton(currentPage.toString(), true, () => {});
        pageButton.classList.add('active');
        paginationElement.appendChild(pageButton);

        const nextButton = createPaginationButton('>', currentPage < totalPages, () => onPageChange(currentPage + 1));
        paginationElement.appendChild(nextButton);

        return paginationElement;
    }

    function createPaginationButton(text, enabled, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.disabled = !enabled;
        button.addEventListener('click', onClick);
        return button;
    }

    function sortTable(column) {
        if (currentSortColumn === column) {
            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = column;
            currentSortOrder = 'asc';
        }

        filteredCars.sort((a, b) => {
            let valueA, valueB;

            switch(column) {
                case 'Year':
                case 'Kilometers':
                    valueA = parseFloat(a[column]) || 0;
                    valueB = parseFloat(b[column]) || 0;
                    break;
                case 'Price (AED)':
                    valueA = parseFloat(a.Price) || 0;
                    valueB = parseFloat(b.Price) || 0;
                    break;
                case 'Predicted (AED)':
                    valueA = parseFloat(a.Predicted_Price) || 0;
                    valueB = parseFloat(b.Predicted_Price) || 0;
                    break;
                case 'Price/Expected':
                    valueA = parseFloat(a['price/expected_price']) || 0;
                    valueB = parseFloat(b['price/expected_price']) || 0;
                    break;
                case 'Posted Date':
                    valueA = a['Posted Datetime'] && a['Posted Datetime'].toLowerCase() !== 'unknown' ? new Date(a['Posted Datetime']) : new Date(0);
                    valueB = b['Posted Datetime'] && b['Posted Datetime'].toLowerCase() !== 'unknown' ? new Date(b['Posted Datetime']) : new Date(0);
                    break;
                default:
                    valueA = a[column];
                    valueB = b[column];
            }

            if (valueA < valueB) return currentSortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        currentPage = 1; // Reset to first page after sorting
        displayCars();
    }

    function applyFilters() {
        const make = document.getElementById('make-filter').value;
        const model = document.getElementById('model-filter').value;
        const yearMin = document.getElementById('year-min').value;
        const yearMax = document.getElementById('year-max').value;
        const kmMin = document.getElementById('km-min').value;
        const kmMax = document.getElementById('km-max').value;
        const priceMin = document.getElementById('price-min').value;
        const priceMax = document.getElementById('price-max').value;
        const predictedPriceMin = document.getElementById('predicted-price-min').value;
        const predictedPriceMax = document.getElementById('predicted-price-max').value;
        const undervaluedPercentageMin = document.getElementById('undervalued-percentage-min').value;
        const undervaluedPercentageMax = document.getElementById('undervalued-percentage-max').value;
        const regionalSpecs = document.getElementById('regional-specs-filter').value;
        const source = document.getElementById('source-filter').value;
        const sellerType = document.getElementById('seller-type-filter').value;

        filteredCars = allCars.filter(car => {
            const undervaluedPercentage = (1 - car['price/expected_price']) * 100;
            return (
                (make === '' || car.Make === make) &&
                (model === '' || car.Model === model) &&
                (yearMin === '' || car.Year >= parseInt(yearMin)) &&
                (yearMax === '' || car.Year <= parseInt(yearMax)) &&
                (kmMin === '' || car.Kilometers >= parseInt(kmMin)) &&
                (kmMax === '' || car.Kilometers <= parseInt(kmMax)) &&
                (priceMin === '' || car.Price >= parseInt(priceMin)) &&
                (priceMax === '' || car.Price <= parseInt(priceMax)) &&
                (predictedPriceMin === '' || car.Predicted_Price >= parseInt(predictedPriceMin)) &&
                (predictedPriceMax === '' || car.Predicted_Price <= parseInt(predictedPriceMax)) &&
                (undervaluedPercentageMin === '' || undervaluedPercentage >= parseFloat(undervaluedPercentageMin)) &&
                (undervaluedPercentageMax === '' || undervaluedPercentage <= parseFloat(undervaluedPercentageMax)) &&
                (regionalSpecs === '' || car['Regional Specs'] === regionalSpecs) &&
                (source === '' || car.Source === source) &&
                (sellerType === '' || car['Seller Type'] === sellerType)
            );
        });

        currentPage = 1;
        displayCars();
    }

    // Call initial display
    displayCars();
});