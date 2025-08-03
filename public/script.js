document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('scrapeForm');
    const urlInput = document.getElementById('url');
    const urlLabel = document.getElementById('urlLabel');
    const scrapeBtn = document.getElementById('scrapeBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const resultsDiv = document.getElementById('results');
    const resultsTitle = document.getElementById('resultsTitle');
    const singleProductResults = document.getElementById('singleProductResults');
    const categoryResults = document.getElementById('categoryResults');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const exportBtn = document.getElementById('exportBtn');
    const exportSheetsBtn = document.getElementById('exportSheetsBtn');
    const scrapeTypeRadios = document.querySelectorAll('input[name="scrapeType"]');
    const categoryOptionsDiv = document.getElementById('categoryOptions');
    const scrapeAllPagesCheckbox = document.getElementById('scrapeAllPages');
    
    let currentResult = null;
    let currentScrapeType = 'single';

    // Handle scrape type changes
    scrapeTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentScrapeType = this.value;
            updateUIForScrapeType();
        });
    });

    function updateUIForScrapeType() {
        if (currentScrapeType === 'category') {
            urlLabel.textContent = 'Category URL:';
            urlInput.placeholder = 'https://example.com/category/products';
            btnText.textContent = 'Scrape Category';
            categoryOptionsDiv.style.display = 'block';
        } else {
            urlLabel.textContent = 'Product URL:';
            urlInput.placeholder = 'https://example.com/product';
            btnText.textContent = 'Scrape Product';
            categoryOptionsDiv.style.display = 'none';
        }
        hideResults();
        hideError();
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a URL');
            return;
        }

        if (!isValidUrl(url)) {
            showError('Please enter a valid URL');
            return;
        }

        await scrapeProduct(url);
    });

    async function scrapeProduct(url) {
        try {
            showLoading();
            hideResults();
            hideError();
            setButtonLoading(true);

            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url, 
                    scrapeType: currentScrapeType,
                    scrapeAllPages: currentScrapeType === 'category' ? scrapeAllPagesCheckbox.checked : false
                })
            });

            const result = await response.json();

            if (result.success) {
                showResults(result);
            } else {
                showError(result.error || 'Failed to scrape');
            }

        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            hideLoading();
            setButtonLoading(false);
        }
    }

    function showResults(result) {
        currentResult = result; // Store current result for export
        
        if (currentScrapeType === 'category' && result.type === 'category') {
            showCategoryResults(result);
        } else {
            showSingleProductResults(result);
        }
        
        resultsDiv.style.display = 'block';
        hideError();
    }

    function showSingleProductResults(result) {
        resultsTitle.textContent = 'Product Information';
        singleProductResults.style.display = 'block';
        categoryResults.style.display = 'none';
        
        const data = result.data;
        
        document.getElementById('productTitle').textContent = data.title || 'Not found';
        document.getElementById('productPrice').textContent = formatPrice(data.price, data.currency);
        document.getElementById('productAmount').textContent = data.amount || 'Not found';
        document.getElementById('productAvailability').textContent = data.availability || 'Not found';
        document.getElementById('productImage').innerHTML = formatImage(data.image);
        document.getElementById('productDescription').textContent = formatDescription(data.description);
        document.getElementById('productSku').textContent = data.sku || 'Not found';
        document.getElementById('productBreadcrumb').textContent = data.breadcrumb || 'Not found';
        document.getElementById('productPrimaryCategory').textContent = data.primaryCategory || 'Not found';
        
        // Cable specifications
        document.getElementById('cableType').textContent = data.cable_type || 'unknown';
        document.getElementById('cableDiameter').textContent = data.diameter_mm2 || 'unknown';
        document.getElementById('cableConductors').textContent = data.conductor_count || 'unknown';
        document.getElementById('cableLength').textContent = data.length_meters || 'unknown';
        document.getElementById('cableQuantity').textContent = data.quantity_per_unit || 'unknown';
        document.getElementById('cableOuterDiameter').textContent = data.outer_diameter_mm || 'unknown';
        document.getElementById('parsingConfidence').textContent = data.parsing_confidence ? `${Math.round(data.parsing_confidence * 100)}%` : 'unknown';
        
        document.getElementById('productUrl').textContent = result.url;
        document.getElementById('scrapeTime').textContent = formatTimestamp(result.timestamp);
        
        // Show debug information if available
        if (data.debug) {
            showDebugInfo(data.debug);
        }
    }

    function showCategoryResults(result) {
        resultsTitle.textContent = 'Category Scraping Results';
        singleProductResults.style.display = 'none';
        categoryResults.style.display = 'block';
        
        document.getElementById('categoryUrl').textContent = result.url;
        document.getElementById('pagesScraped').textContent = result.pagesScraped || 1;
        document.getElementById('productsFound').textContent = result.productsFound || 0;
        document.getElementById('productsScraped').textContent = result.productsScraped || 0;
        document.getElementById('categoryScrapeTime').textContent = formatTimestamp(result.timestamp);
        
        // Show products list
        const productsContainer = document.getElementById('productsContainer');
        productsContainer.innerHTML = '';
        
        if (result.products && result.products.length > 0) {
            result.products.forEach((product, index) => {
                const productCard = createProductCard(product, index + 1);
                productsContainer.appendChild(productCard);
            });
        } else {
            productsContainer.innerHTML = '<p>No products were successfully scraped.</p>';
        }
    }

    function createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        if (!product.success) {
            card.classList.add('failed');
            card.innerHTML = `
                <h4>Product ${index} (Failed)</h4>
                <div class="error-message">${product.error || 'Unknown error'}</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">URL: ${product.url}</div>
            `;
            return card;
        }

        const data = product.data;
        card.innerHTML = `
            <div style="display: flex; gap: 15px;">
                <div style="flex-shrink: 0;">
                    ${data.image ? `
                        <img src="${data.image}" alt="Product Image" 
                             style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;" 
                             onerror="this.style.display='none';" />
                    ` : `
                        <div style="width: 80px; height: 80px; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.8rem;">
                            No Image
                        </div>
                    `}
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 8px 0;">${data.title || `Product ${index}`}</h4>
                    ${data.breadcrumb ? `
                        <div style="margin-bottom: 10px; padding: 4px 8px; background-color: #f8f9fa; border-radius: 4px; font-size: 0.85rem; color: #6c757d; border-left: 3px solid #3B82F6;">
                            📁 ${data.breadcrumb}
                        </div>
                    ` : ''}
                    <div class="product-info">
                        <div class="info-item">
                            <strong>Price:</strong>
                            <span>${formatPrice(data.price, data.currency)}</span>
                        </div>
                        <div class="info-item">
                            <strong>SKU:</strong>
                            <span>${data.sku || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Stock:</strong>
                            <span>${data.availability || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Quantity:</strong>
                            <span>${data.amount || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Category:</strong>
                            <span>${data.primaryCategory || 'N/A'}</span>
                        </div>
                        ${data.cable_type && data.cable_type !== 'unknown' ? `
                        <div class="info-item" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                            <strong style="color: #2563eb;">⚡ Cable Type:</strong>
                            <span>${data.cable_type}</span>
                        </div>
                        ` : ''}
                        ${data.diameter_mm2 && data.diameter_mm2 !== 'unknown' ? `
                        <div class="info-item">
                            <strong>Diameter:</strong>
                            <span>${data.diameter_mm2}mm²</span>
                        </div>
                        ` : ''}
                        ${data.conductor_count && data.conductor_count !== 'unknown' ? `
                        <div class="info-item">
                            <strong>Conductors:</strong>
                            <span>${data.conductor_count}</span>
                        </div>
                        ` : ''}
                        ${data.length_meters && data.length_meters !== 'unknown' ? `
                        <div class="info-item">
                            <strong>Length:</strong>
                            <span>${data.length_meters}m</span>
                        </div>
                        ` : ''}
                    </div>
                    <div style="margin-top: 10px;">
                        <strong>URL:</strong>
                        <a href="${product.url}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 0.9rem;">
                            ${product.url.length > 60 ? product.url.substring(0, 60) + '...' : product.url}
                        </a>
                    </div>
                    ${data.description ? `<div style="margin-top: 8px; font-size: 0.9rem; color: #666;">
                        ${formatDescription(data.description)}
                    </div>` : ''}
                </div>
            </div>
        `;
        
        return card;
    }

    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        errorDiv.style.display = 'block';
        hideResults();
    }

    function showLoading() {
        loadingDiv.style.display = 'block';
    }

    function hideLoading() {
        loadingDiv.style.display = 'none';
    }

    function hideResults() {
        resultsDiv.style.display = 'none';
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    function setButtonLoading(loading) {
        if (loading) {
            scrapeBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            scrapeBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    function formatPrice(price, currency) {
        if (!price) return 'Not found';
        
        const currencySymbol = currency || '';
        return `${currencySymbol}${price}`;
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    function formatImage(imageUrl) {
        if (!imageUrl) return '<span style="color: #888;">Not found</span>';
        
        return `
            <div style="margin-top: 10px;">
                <img src="${imageUrl}" alt="Product Image" style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div style="display: none; color: #888; font-style: italic;">Image failed to load</div>
                <div style="margin-top: 5px;">
                    <a href="${imageUrl}" target="_blank" style="color: #007bff; text-decoration: none;">🔗 View Full Size</a>
                </div>
            </div>
        `;
    }

    function formatDescription(description) {
        if (!description) return 'Not found';
        
        // Truncate long descriptions
        if (description.length > 200) {
            return description.substring(0, 200) + '...';
        }
        return description;
    }

    function formatCategories(categories) {
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return 'Not found';
        }
        
        return categories.join(' > ');
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function showDebugInfo(debug) {
        // Create or update debug section
        let debugSection = document.getElementById('debugSection');
        if (!debugSection) {
            debugSection = document.createElement('div');
            debugSection.id = 'debugSection';
            debugSection.style.marginTop = '20px';
            debugSection.style.padding = '15px';
            debugSection.style.backgroundColor = '#f8f9fa';
            debugSection.style.border = '1px solid #dee2e6';
            debugSection.style.borderRadius = '5px';
            debugSection.style.fontSize = '0.9rem';
            
            const debugTitle = document.createElement('h4');
            debugTitle.textContent = '🔍 Scraping Debug Information';
            debugTitle.style.marginTop = '0';
            debugTitle.style.color = '#495057';
            debugSection.appendChild(debugTitle);
            
            singleProductResults.appendChild(debugSection);
        }
        
        let debugContent = '';
        
        // Missing fields
        if (debug.missingFields && debug.missingFields.length > 0) {
            debugContent += '<div style="margin-bottom: 10px;"><strong style="color: #dc3545;">❌ Missing Fields:</strong><br>';
            debugContent += debug.missingFields.map(field => `• ${field}`).join('<br>');
            debugContent += '</div>';
        }
        
        // Found selectors
        if (debug.foundSelectors && Object.keys(debug.foundSelectors).length > 0) {
            debugContent += '<div style="margin-bottom: 10px;"><strong style="color: #28a745;">✅ Found Using Selectors:</strong><br>';
            Object.entries(debug.foundSelectors).forEach(([field, selector]) => {
                debugContent += `• <strong>${field}:</strong> <code style="background: #e9ecef; padding: 2px 4px; border-radius: 3px;">${selector}</code><br>`;
            });
            debugContent += '</div>';
        }
        
        // Page info
        if (debug.pageInfo) {
            debugContent += '<div><strong>🌐 Page Information:</strong><br>';
            debugContent += `• URL: ${debug.pageInfo.url}<br>`;
            debugContent += `• Title: ${debug.pageInfo.title}<br>`;
            debugContent += `• JavaScript Framework: ${debug.pageInfo.hasJavaScript ? '✅ Detected' : '❌ None detected'}<br>`;
            debugContent += '</div>';
        }
        
        debugSection.innerHTML = debugSection.innerHTML.split('🔍')[0] + '🔍 Scraping Debug Information</h4>' + debugContent;
    }

    // Export to Excel functionality
    exportBtn.addEventListener('click', async function() {
        if (!currentResult) {
            alert('No data to export. Please scrape first.');
            return;
        }
        
        try {
            exportBtn.disabled = true;
            exportBtn.textContent = '💾 Saving...';
            
            const response = await fetch('/api/export-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: currentResult.type === 'category' ? currentResult : currentResult.data,
                    url: currentResult.url,
                    scrapeType: currentScrapeType
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.style.marginTop = '10px';
                successDiv.style.padding = '10px';
                successDiv.style.background = '#d4edda';
                successDiv.style.color = '#155724';
                successDiv.style.border = '1px solid #c3e6cb';
                successDiv.style.borderRadius = '5px';
                successDiv.innerHTML = `✅ ${result.message}`;
                resultsDiv.appendChild(successDiv);
                
                // Remove success message after 3 seconds
                setTimeout(() => {
                    if (successDiv.parentNode) {
                        successDiv.parentNode.removeChild(successDiv);
                    }
                }, 3000);
            } else {
                alert('Export failed: ' + result.error);
            }
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = '📁 Save to Excel';
        }
    });

    // Export to Google Sheets functionality
    exportSheetsBtn.addEventListener('click', async function() {
        console.log('🔵 Google Sheets button clicked');
        console.log('📊 Current result:', currentResult);
        console.log('📝 Scrape type:', currentScrapeType);
        
        if (!currentResult) {
            alert('No data to export. Please scrape first.');
            return;
        }
        
        try {
            exportSheetsBtn.disabled = true;
            exportSheetsBtn.textContent = '☁️ Saving...';
            
            const exportData = {
                data: currentResult.type === 'category' ? currentResult : currentResult.data,
                url: currentResult.url,
                scrapeType: currentScrapeType
            };
            
            console.log('📤 Sending export data:', exportData);
            
            const response = await fetch('/api/export-sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(exportData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message with link to spreadsheet
                const successDiv = document.createElement('div');
                successDiv.style.marginTop = '10px';
                successDiv.style.padding = '10px';
                successDiv.style.background = '#e3f2fd';
                successDiv.style.color = '#1565c0';
                successDiv.style.border = '1px solid #bbdefb';
                successDiv.style.borderRadius = '5px';
                successDiv.innerHTML = `✅ ${result.message} <br><a href="${result.spreadsheetUrl}" target="_blank" style="color: #1976d2; text-decoration: none;">🔗 Open Google Sheets</a>`;
                resultsDiv.appendChild(successDiv);
                
                // Remove success message after 5 seconds
                setTimeout(() => {
                    if (successDiv.parentNode) {
                        successDiv.parentNode.removeChild(successDiv);
                    }
                }, 5000);
            } else {
                alert('Google Sheets export failed: ' + result.error);
            }
            
        } catch (error) {
            console.error('Sheets export error:', error);
            alert('Google Sheets export failed. Please try again.');
        } finally {
            exportSheetsBtn.disabled = false;
            exportSheetsBtn.textContent = '📊 Save to Google Sheets';
        }
    });

    urlInput.addEventListener('paste', function() {
        setTimeout(() => {
            hideResults();
            hideError();
        }, 100);
    });

    // Initialize
    updateUIForScrapeType();
    urlInput.focus();
});