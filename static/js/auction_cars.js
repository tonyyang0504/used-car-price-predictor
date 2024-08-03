document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('auction-cars-filter-form');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const tableBody = document.getElementById('auction-cars-table').getElementsByTagName('tbody')[0];
    const totalRecordsElement = document.getElementById('auction-total-records');
    const paginationContainer = document.getElementById('auctionCarsPagination');

    let allCars = [];
    let filteredCars = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let filterData = {};
    let minYear, maxYear;
    let currentSortColumn = '';
    let currentSortOrder = 'asc';

    // Fetch initial data and populate filters
    fetchAuctionCars();

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

    function fetchAuctionCars() {
        showLoading();
        hideError();

        fetch('/get-auction-cars')
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    allCars = data.cars;
                    filteredCars = allCars;
                    populateFilters();
                    displayCars();
                } else {
                    showError(data.error || 'An error occurred while fetching auction cars.');
                }
            })
            .catch(error => {
                hideLoading();
                showError('An error occurred while fetching auction cars.');
                console.error('Error:', error);
            });
    }

    function populateFilters() {
        const makeFilter = document.getElementById('make-filter');
        const modelFilter = document.getElementById('model-filter');
        const regionalSpecsFilter = document.getElementById('regional-specs-filter');
        const primaryDamageFilter = document.getElementById('primary-damage-filter');
        const sourceFilter = document.getElementById('source-filter');

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
        const uniquePrimaryDamages = [...new Set(allCars.map(car => car['Primary Damage']))].sort();
        const uniqueSources = [...new Set(allCars.map(car => car.Source))].sort();

        populateSelectOptions(regionalSpecsFilter, uniqueRegionalSpecs);
        populateSelectOptions(primaryDamageFilter, uniquePrimaryDamages);
        populateSelectOptions(sourceFilter, uniqueSources);

        // Populate year range filters
        populateYearRangeFilters();

        // Set min and max values for kilometers, start price, and final price inputs
        setMinMaxValues('km', allCars.map(car => car.Kilometers));
        setMinMaxValues('start-price', allCars.map(car => car['Start Price']));
        setMinMaxValues('final-price', allCars.map(car => car['Final Price']));

        // Set min and max values for auction date inputs
        const auctionDates = allCars.map(car => new Date(car['Auction Date']));
        const minDate = new Date(Math.min.apply(null, auctionDates));
        const maxDate = new Date(Math.max.apply(null, auctionDates));
        document.getElementById('auction-date-min').value = minDate.toISOString().split('T')[0];
        document.getElementById('auction-date-max').value = maxDate.toISOString().split('T')[0];
    }

    function populateYearRangeFilters() {
        const yearMinFilter = document.getElementById('year-min');
        const yearMaxFilter = document.getElementById('year-max');

        const years = allCars.map(car => car.Year);
        minYear = Math.min(...years);
        maxYear = Math.max(...years);

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
        document.getElementById('primary-damage-filter').value = '';
        document.getElementById('source-filter').value = '';

        // Reset range inputs
        document.getElementById('km-min').value = '';
        document.getElementById('km-max').value = '';
        document.getElementById('start-price-min').value = '';
        document.getElementById('start-price-max').value = '';
        document.getElementById('final-price-min').value = '';
        document.getElementById('final-price-max').value = '';
        document.getElementById('auction-date-min').value = '';
        document.getElementById('auction-date-max').value = '';
    }

    function applyFilters() {
        const make = document.getElementById('make-filter').value;
        const model = document.getElementById('model-filter').value;
        const yearMin = document.getElementById('year-min').value;
        const yearMax = document.getElementById('year-max').value;
        const kmMin = document.getElementById('km-min').value;
        const kmMax = document.getElementById('km-max').value;
        const startPriceMin = document.getElementById('start-price-min').value;
        const startPriceMax = document.getElementById('start-price-max').value;
        const finalPriceMin = document.getElementById('final-price-min').value;
        const finalPriceMax = document.getElementById('final-price-max').value;
        const regionalSpecs = document.getElementById('regional-specs-filter').value;
        const primaryDamage = document.getElementById('primary-damage-filter').value;
        const auctionDateMin = document.getElementById('auction-date-min').value;
        const auctionDateMax = document.getElementById('auction-date-max').value;
        const source = document.getElementById('source-filter').value;

        filteredCars = allCars.filter(car => {
            return (
                (make === '' || car.Make === make) &&
                (model === '' || car.Model === model) &&
                (yearMin === '' || car.Year >= parseInt(yearMin)) &&
                (yearMax === '' || car.Year <= parseInt(yearMax)) &&
                (kmMin === '' || car.Kilometers >= parseInt(kmMin)) &&
                (kmMax === '' || car.Kilometers <= parseInt(kmMax)) &&
                (startPriceMin === '' || car['Start Price'] >= parseInt(startPriceMin)) &&
                (startPriceMax === '' || car['Start Price'] <= parseInt(startPriceMax)) &&
                (finalPriceMin === '' || car['Final Price'] >= parseInt(finalPriceMin)) &&
                (finalPriceMax === '' || car['Final Price'] <= parseInt(finalPriceMax)) &&
                (regionalSpecs === '' || car['Regional Specs'] === regionalSpecs) &&
                (primaryDamage === '' || car['Primary Damage'] === primaryDamage) &&
                (auctionDateMin === '' || new Date(car['Auction Date']) >= new Date(auctionDateMin)) &&
                (auctionDateMax === '' || new Date(car['Auction Date']) <= new Date(auctionDateMax)) &&
                (source === '' || car.Source === source)
            );
        });

        currentPage = 1;
        displayCars();
    }

    function displayCars() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const carsToDisplay = filteredCars.slice(startIndex, endIndex);

        const table = document.getElementById('auction-cars-table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // Clear existing table content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Create table header
        const headerRow = document.createElement('tr');
        const columns = ['Make', 'Model', 'Year', 'Kilometers', 'Regional Specs', 'Primary Damage', 'Start Price (AED)', 'Final Price (AED)', 'Bid Difference (AED)', 'Bid Difference (%)', 'Auction Date', 'Source'];

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
            row.insertCell(5).textContent = car['Primary Damage'];
            row.insertCell(6).textContent = formatNumber(car['Start Price']);
            row.insertCell(7).textContent = formatNumber(car['Final Price']);
            row.insertCell(8).textContent = formatNumber(car['Bid Difference']);
            row.insertCell(9).textContent = `${car['Bid Difference Percentage'].toFixed(2)}%`;
            row.insertCell(10).textContent = formatDate(car['Auction Date']);
            row.insertCell(11).textContent = car.Source;

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
                case 'Start Price (AED)':
                case 'Final Price (AED)':
                case 'Bid Difference (AED)':
                    valueA = parseFloat(a[column.replace(' (AED)', '')]) || 0;
                    valueB = parseFloat(b[column.replace(' (AED)', '')]) || 0;
                    break;
                case 'Bid Difference (%)':
                    valueA = a['Bid Difference Percentage'] || 0;
                    valueB = b['Bid Difference Percentage'] || 0;
                    break;
                case 'Auction Date':
                    valueA = a['Auction Date'] && a['Auction Date'].toLowerCase() !== 'unknown' ? new Date(a['Auction Date']) : new Date(0);
                    valueB = b['Auction Date'] && b['Auction Date'].toLowerCase() !== 'unknown' ? new Date(b['Auction Date']) : new Date(0);
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
});