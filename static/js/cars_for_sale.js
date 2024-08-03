document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('cars-for-sale-filter-form');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const tableBody = document.getElementById('cars-for-sale-table').getElementsByTagName('tbody')[0];
    const totalRecordsElement = document.getElementById('sale-total-records');
    const paginationContainer = document.getElementById('carsPagination');

    let allCars = [];
    let filteredCars = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let filterData = {};
    let minYear, maxYear;
    let currentSortColumn = '';
    let currentSortOrder = 'asc';

    // Fetch initial data and populate filters
    fetchCarsForSale();

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

    function fetchCarsForSale() {
        showLoading();
        hideError();

        fetch('/get-cars-for-sale')
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    allCars = data.cars;
                    filteredCars = allCars;
                    populateFilters(data);
                    displayCars();
                } else {
                    showError(data.error || 'An error occurred while fetching cars for sale.');
                }
            })
            .catch(error => {
                hideLoading();
                showError('An error occurred while fetching cars for sale.');
                console.error('Error:', error);
            });
    }

    function populateFilters(data) {
        const makeFilter = document.getElementById('make-filter');
        const modelFilter = document.getElementById('model-filter');
        const regionalSpecsFilter = document.getElementById('regional-specs-filter');
        const sourceFilter = document.getElementById('source-filter');
        const sellerTypeFilter = document.getElementById('seller-type-filter');

        // Populate make filter
        const uniqueMakes = [...new Set(allCars.map(car => car.Make))].sort();
        populateSelectOptions(makeFilter, uniqueMakes);

        // Create filterData structure for make-model relationship
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

        // Sort the models alphabetically
        for (let make in filterData) {
            filterData[make].models.sort();
        }

        // Populate other filters
        const uniqueRegionalSpecs = [...new Set(allCars.map(car => car['Regional Specs']))].sort();
        const uniqueSellerTypes = [...new Set(allCars.map(car => car['Seller Type']))].sort();
        const uniqueSources = [...new Set(allCars.map(car => car.Source))].sort();

        populateSelectOptions(regionalSpecsFilter, uniqueRegionalSpecs);
        populateSelectOptions(sellerTypeFilter, uniqueSellerTypes);
        populateSelectOptions(sourceFilter, uniqueSources);

        // Add event listener for make filter
        makeFilter.addEventListener('change', updateModelFilter);

        // Populate year range filters
        populateYearRangeFilters(data.year_range);

        // Set min and max values for kilometers and price inputs
        setMinMaxValues('km', allCars.map(car => car.Kilometers));
        setMinMaxValues('price', allCars.map(car => car.Price));
    }

    function populateYearRangeFilters(yearRange) {
        const yearMinFilter = document.getElementById('year-min');
        const yearMaxFilter = document.getElementById('year-max');

        minYear = Math.min(...yearRange);
        maxYear = Math.max(...yearRange);

        yearMinFilter.innerHTML = '';
        yearMaxFilter.innerHTML = '';

        // Populate year options in descending order
        for (let year = maxYear; year >= minYear; year--) {
            yearMinFilter.appendChild(new Option(year, year));
            yearMaxFilter.appendChild(new Option(year, year));
        }

        // Set initial values
        yearMinFilter.value = minYear;
        yearMaxFilter.value = maxYear;
    }

    function resetFilters() {
        document.getElementById('model-filter').innerHTML = '<option value="">Select Model</option>';
        document.getElementById('model-filter').disabled = true;

        // Reset year range to min and max years
        const yearMinFilter = document.getElementById('year-min');
        const yearMaxFilter = document.getElementById('year-max');

        // Clear existing options
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

        // Set the first dropdown to the minimum year
        yearMinFilter.value = minYear;

        // Set the second dropdown to the maximum year
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
        resetFilter('model-filter', 'Select Model');

        if (selectedMake) {
            populateSelectOptions(modelFilter, filterData[selectedMake].models);
            modelFilter.disabled = false;
        } else {
            modelFilter.disabled = true;
        }
    }

    function resetFilter(filterId, defaultText) {
        const filter = document.getElementById(filterId);
        filter.innerHTML = `<option value="">${defaultText}</option>`;
        filter.disabled = true;
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
        const regionalSpecs = document.getElementById('regional-specs-filter').value;
        const source = document.getElementById('source-filter').value;
        const sellerType = document.getElementById('seller-type-filter').value;

        filteredCars = allCars.filter(car => {
            return (
                (make === '' || car.Make === make) &&
                (model === '' || car.Model === model) &&
                (yearMin === '' || car.Year >= parseInt(yearMin)) &&
                (yearMax === '' || car.Year <= parseInt(yearMax)) &&
                (kmMin === '' || car.Kilometers >= parseInt(kmMin)) &&
                (kmMax === '' || car.Kilometers <= parseInt(kmMax)) &&
                (priceMin === '' || car.Price >= parseInt(priceMin)) &&
                (priceMax === '' || car.Price <= parseInt(priceMax)) &&
                (regionalSpecs === '' || car['Regional Specs'] === regionalSpecs) &&
                (source === '' || car.Source === source) &&
                (sellerType === '' || car['Seller Type'] === sellerType)
            );
        });

        currentPage = 1;
        displayCars();
    }

    function displayCars() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const carsToDisplay = filteredCars.slice(startIndex, endIndex);

        const table = document.getElementById('cars-for-sale-table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        const headerRow = document.createElement('tr');
        const columns = ['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Price (AED)', 'Seller Type', 'Posted Date', 'Source', 'Link'];

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

        carsToDisplay.forEach(car => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = car.Make;
            row.insertCell(1).textContent = car.Model;
            row.insertCell(2).textContent = car.Year;
            row.insertCell(3).textContent = formatNumber(car.Kilometers);
            row.insertCell(4).textContent = car['Regional Specs'];
            row.insertCell(5).textContent = formatCurrency(car.Price);
            row.insertCell(6).textContent = car['Seller Type'];
            row.insertCell(7).textContent = formatDate(car['Posted Datetime']);
            row.insertCell(8).textContent = car.Source;

            const linkCell = row.insertCell(9);
            const link = document.createElement('a');
            link.href = car.permalink;
            link.textContent = 'View';
            link.target = '_blank';
            linkCell.appendChild(link);

            Array.from(row.cells).forEach(cell => {
                cell.style.textAlign = 'center';
            });
        });

        totalRecordsElement.textContent = `Total Records: ${filteredCars.length}`;

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
        prevButton.classList.add('pagination-nav');
        paginationElement.appendChild(prevButton);

        const pageButton = createPaginationButton(currentPage.toString(), true, () => {});
        pageButton.classList.add('pagination-number', 'active');
        paginationElement.appendChild(pageButton);

        const nextButton = createPaginationButton('>', currentPage < totalPages, () => onPageChange(currentPage + 1));
        nextButton.classList.add('pagination-nav');
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

        currentPage = 1;
        displayCars();
    }

    function formatCurrency(value) {
        if (value == null || isNaN(value)) return 'N/A';
        // Format the number without currency symbol and decimal places
        return new Intl.NumberFormat('en-AE', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
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
});