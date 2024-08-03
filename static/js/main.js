document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('nav');
    const navToggle = document.createElement('button');
    navToggle.className = 'nav-toggle';
    navToggle.innerHTML = '☰';
    nav.insertBefore(navToggle, nav.firstChild);

    const navMenu = nav.querySelector('ul');

    function toggleMenu() {
        navMenu.classList.toggle('show');
        navToggle.style.display = navMenu.classList.contains('show') ? 'none' : 'block';
    }

    navToggle.addEventListener('click', toggleMenu);

    function handleResize() {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('show');
            navToggle.style.display = 'none';
        } else {
            navToggle.style.display = 'block';
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial state

    // Make tables responsive
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
});

// Utility function to format numbers with commas
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
        return 'N/A';
    }
    return parseFloat(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Utility function to format dates
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to create pagination
function createPagination(totalItems, itemsPerPage, currentPage, onPageChange) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationElement = document.createElement('div');
    paginationElement.className = 'pagination';

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '<';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => onPageChange(currentPage - 1));
    paginationElement.appendChild(prevButton);

    // Current page
    const currentPageSpan = document.createElement('span');
    currentPageSpan.className = 'current-page';
    currentPageSpan.textContent = currentPage;
    paginationElement.appendChild(currentPageSpan);

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = '>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => onPageChange(currentPage + 1));
    paginationElement.appendChild(nextButton);

    return paginationElement;
}

// Function to show loading indicator
function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

// Function to hide loading indicator
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Function to show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Function to hide error message
function hideError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Function to populate select options
function populateSelectOptions(selectElement, options) {
    selectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an option';
    selectElement.appendChild(defaultOption);

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
}

window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.createPagination = createPagination;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.hideError = hideError;
window.populateSelectOptions = populateSelectOptions;