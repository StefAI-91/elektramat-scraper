const puppeteer = require('puppeteer');
const referenceData = require('./referenceData');
const { ElektramatProductParser } = require('./cableSpecParser');
const { ElektramatSwitchingParser } = require('./switchingMaterialParser');

async function scrapeProduct(url) {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    
    const productData = await page.evaluate(() => {
      const result = {
        title: '',
        brand: '',
        price: '',
        amount: '',
        currency: '',
        availability: '',
        image: '',
        description: '',
        sku: '',
        categories: [],
        color: '',
        material: '',
        specifications: {},
        imageDebug: '',
        debug: {
          foundSelectors: {},
          missingFields: [],
          pageInfo: {
            url: window.location.href,
            title: document.title,
            hasJavaScript: !!window.jQuery || !!window.React || !!window.Vue || !!window.Angular
          }
        }
      };
      
      const titleSelectors = [
        'h1',
        '[data-testid="product-title"]',
        '.product-title',
        '.product-name',
        '[class*="title"]',
        '[class*="name"]'
      ];
      
      const priceSelectors = [
        '[data-testid="price"]',
        '.price',
        '.product-price',
        '[class*="price"]',
        '[class*="cost"]',
        'span[class*="price"]',
        'div[class*="price"]'
      ];
      
      const amountSelectors = [
        '[data-testid="quantity"]',
        '.quantity',
        '.amount',
        '[class*="quantity"]',
        '[class*="amount"]',
        '[class*="stock"]',
        'input[type="number"]'
      ];
      
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          result.title = element.textContent.trim();
          result.debug.foundSelectors.title = selector;
          break;
        }
      }
      if (!result.title) result.debug.missingFields.push('title');
      
      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          const priceText = element.textContent.trim();
          const priceMatch = priceText.match(/[\d.,]+/);
          const currencyMatch = priceText.match(/[€$£¥]/);
          
          if (priceMatch) {
            result.price = priceMatch[0];
            result.debug.foundSelectors.price = selector;
          }
          if (currencyMatch) {
            result.currency = currencyMatch[0];
          }
          if (result.price) break;
        }
      }
      if (!result.price) result.debug.missingFields.push('price');
      
      for (const selector of amountSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName === 'INPUT') {
            result.amount = element.value || element.placeholder || '';
          } else {
            const amountText = element.textContent.trim();
            const amountMatch = amountText.match(/\d+/);
            if (amountMatch) {
              result.amount = amountMatch[0];
            }
          }
          if (result.amount) {
            result.debug.foundSelectors.amount = selector;
            break;
          }
        }
      }
      if (!result.amount) result.debug.missingFields.push('amount');
      
      const availabilitySelectors = [
        '[class*="stock"]',
        '[class*="availability"]',
        '[data-testid="availability"]'
      ];
      
      for (const selector of availabilitySelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          result.availability = element.textContent.trim();
          result.debug.foundSelectors.availability = selector;
          break;
        }
      }
      if (!result.availability) result.debug.missingFields.push('availability');
      
      // Simple image extraction - prioritize preload link
      const preloadImage = document.querySelector('link[rel="preload"][as="image"]');
      if (preloadImage && preloadImage.href) {
        result.image = preloadImage.href;
        result.imageDebug = `Used preload image: ${preloadImage.href}`;
      }
      
      // If no preload link found, this might help debug what's happening
      if (!result.image) {
        result.debug.missingFields.push('image');
        // Let's check what preload links exist
        const allPreloads = document.querySelectorAll('link[rel="preload"]');
        const preloadInfo = Array.from(allPreloads).map(link => `${link.getAttribute('as')}: ${link.href}`).join(', ');
        result.imageDebug = `Found preload links: ${preloadInfo}. `;
        
        // Fallback to first product image
        const fallbackSelectors = [
          '.product-image-main img',
          '.fotorama__stage img', 
          'img[src*="/media/catalog/product/cache/"]',
          '.product.media img'
        ];
        
        for (const selector of fallbackSelectors) {
          const img = document.querySelector(selector);
          if (img && img.src) {
            result.image = img.src;
            result.imageDebug += `Used fallback selector: ${selector} → ${img.src}`;
            break;
          }
        }
      }
      
      // Description extraction
      const descriptionSelectors = [
        '.product.description',
        '#description',
        '.product-info-tabs-content',
        '.product.attribute.description',
        '.product-details',
        '.tab-content #description',
        '[data-testid="product-description"]',
        '.product-description',
        '.description',
        '[class*="description"]',
        '[class*="details"]',
        '.product-summary',
        'meta[name="description"]'
      ];
      
      for (const selector of descriptionSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName === 'META') {
            result.description = element.getAttribute('content') || '';
          } else {
            result.description = element.textContent.trim();
          }
          if (result.description) {
            result.debug.foundSelectors.description = selector;
            break;
          }
        }
      }
      if (!result.description) result.debug.missingFields.push('description');
      
      // SKU extraction
      const skuSelectors = [
        '.product-info-stock-sku .value',
        '.sku .value',
        '[data-th="SKU"]',
        '.product-info-price .sku',
        '.product-sku',
        '.item-code',
        '[data-testid="sku"]',
        '.sku',
        '[class*="sku"]',
        '.model-number',
        '[class*="model"]',
        '.item-number',
        '[class*="item-number"]',
        // Dutch article number patterns
        '[class*="artikelnr"]',
        '[class*="article-number"]',
        '.product-artikelnr',
        '.artikelnummer'
      ];
      
      for (const selector of skuSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          result.sku = element.textContent.trim();
          result.debug.foundSelectors.sku = selector;
          break;
        }
      }
      
      // If no SKU found yet, look for "Artikelnr:" pattern in text
      if (!result.sku) {
        const bodyText = document.body.textContent || document.body.innerText || '';
        const artikelnrMatch = bodyText.match(/Artikelnr:\s*(\d+)/i);
        if (artikelnrMatch) {
          result.sku = artikelnrMatch[1];
          result.debug.foundSelectors.sku = 'text-pattern:Artikelnr';
        }
      }
      if (!result.sku) result.debug.missingFields.push('sku');
      
      // Enhanced breadcrumb/categories extraction
      const breadcrumbData = extractBreadcrumbs();
      result.categories = breadcrumbData.categories;
      result.breadcrumb = breadcrumbData.breadcrumb;
      result.primaryCategory = breadcrumbData.primaryCategory;
      
      function extractBreadcrumbs() {
        // Elektramat specific breadcrumb extraction
        const elektramatBreadcrumbs = document.querySelector('.breadcrumbs');
        if (elektramatBreadcrumbs) {
          const breadcrumbLinks = elektramatBreadcrumbs.querySelectorAll('a');
          const breadcrumbItems = [];
          
          breadcrumbLinks.forEach(link => {
            const text = link.textContent.trim();
            if (text && text.length > 1 && text.length < 100) {
              breadcrumbItems.push(text);
            }
          });
          
          // Filter out common unwanted elements
          const filteredBreadcrumbs = breadcrumbItems.filter(item => {
            const skipTexts = [
              'home', 'homepage', 'startpagina', 'privacy beleid', 'weigeren', 
              'accepteren', 'back', 'ga naar de inhoud', 'werken bij', 'verzending',
              'reviews', 'log in', 'winkelwagen', 'zoeken', 'account', 'contact',
              'klantenservice', 'fill 1', 'created with sketch'
            ];
            
            return !skipTexts.some(skip => 
              item.toLowerCase().includes(skip.toLowerCase())
            );
          });
          
          return {
            categories: filteredBreadcrumbs, // Array of category names
            breadcrumb: filteredBreadcrumbs.join(' > '), // Full breadcrumb path
            primaryCategory: filteredBreadcrumbs.length > 0 ? filteredBreadcrumbs[0] : ''
          };
        }
        
        // Fallback to generic breadcrumb extraction
        const genericSelectors = [
          '.breadcrumbs a',
          'nav.breadcrumbs a',
          '.breadcrumbs ol a',
          '.breadcrumb-list a',
          '.page-header .breadcrumb a'
        ];
        
        const categories = [];
        
        genericSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            const categoryText = element.textContent.trim();
            const skipTexts = [
              'privacy beleid', 'weigeren', 'accepteren', 'back', 'ga naar de inhoud',
              'werken bij', 'verzending', 'reviews', 'log in', 'winkelwagen',
              'home', 'zoeken', 'account', 'contact', 'klantenservice',
              'fill 1', 'created with sketch'
            ];
            
            const shouldSkip = skipTexts.some(skip => 
              categoryText.toLowerCase().includes(skip.toLowerCase())
            );
            
            if (categoryText && 
                categoryText.length > 2 && 
                categoryText.length < 50 && 
                !shouldSkip &&
                !categories.includes(categoryText)) {
              categories.push(categoryText);
            }
          });
        });
        
        return {
          categories: categories,
          breadcrumb: categories.join(' > '),
          primaryCategory: categories.length > 0 ? categories[0] : ''
        };
      }
      
      return result;
    });
    
    
    // Enhance product data with reference data
    const enhancedData = enhanceProductData(productData);
    
    return {
      success: true,
      url: url,
      data: enhancedData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      url: url,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Determine product category for appropriate parsing
 * @param {string} breadcrumbs - Product breadcrumb path
 * @param {string} title - Product title
 * @param {string} description - Product description
 * @returns {string} - Category: 'cable', 'switching', 'distribution', 'lighting', or 'other'
 */
function determineProductCategory(breadcrumbs, title, description) {
  const text = `${breadcrumbs} ${title} ${description}`.toLowerCase();
  
  // Check distribution first to avoid conflict with "module" in switching
  if (text.includes('groepenkast') || text.includes('verdeler') || text.includes('automaat')) {
    return 'distribution';
  } else if (text.includes('kabel') || text.includes('draad') || text.includes('cable')) {
    return 'cable';
  } else if (text.includes('schakelmateriaal') || text.includes('schakelaar') || 
             text.includes('stopcontact') || text.includes('dimmer') || 
             text.includes('frame') || text.includes('afdekframe') ||
             text.includes('drukknop') || text.includes('module')) {
    return 'switching';
  } else if (text.includes('verlichting') || text.includes('lamp') || text.includes('led') || text.includes('armatuur')) {
    return 'lighting';
  } else {
    return 'other';
  }
}

function enhanceProductData(productData) {
  // Create a copy of the data
  const enhanced = { ...productData };
  
  // Determine product category
  const category = determineProductCategory(
    enhanced.breadcrumb || '',
    enhanced.title || '',
    enhanced.description || ''
  );
  enhanced.category = category;
  
  // Initialize parsers for electrical products
  const cableParser = new ElektramatProductParser();
  const switchingParser = new ElektramatSwitchingParser();
  
  // Extract brand from title, description, or SKU
  if (!enhanced.brand) {
    const textToSearch = `${enhanced.title} ${enhanced.description} ${enhanced.sku}`.toLowerCase();
    const brandResult = referenceData.findBrand(textToSearch);
    
    if (brandResult) {
      enhanced.brand = brandResult.found;
      enhanced.brandConfidence = brandResult.confidence;
      if (!enhanced.debug.foundSelectors.brand) {
        enhanced.debug.foundSelectors.brand = 'reference-matching';
      }
    }
  }
  
  // Extract and normalize color
  if (!enhanced.color) {
    const textToSearch = `${enhanced.title} ${enhanced.description}`.toLowerCase();
    const colorResult = referenceData.findColor(textToSearch);
    
    if (colorResult) {
      enhanced.color = colorResult.found;
      enhanced.colorNormalized = colorResult.normalized;
      enhanced.colorEnglish = colorResult.english;
      if (!enhanced.debug.foundSelectors.color) {
        enhanced.debug.foundSelectors.color = 'reference-matching';
      }
    }
  }
  
  // Extract material from color data (e.g., "rvs" = stainless steel, "aluminium", etc.)
  const materials = ['rvs', 'aluminium', 'edelstaal', 'brons'];
  const materialText = `${enhanced.title} ${enhanced.description} ${enhanced.color}`.toLowerCase();
  
  for (const material of materials) {
    if (materialText.includes(material)) {
      enhanced.material = material === 'rvs' || material === 'edelstaal' ? 'Stainless Steel' : 
                         material === 'aluminium' ? 'Aluminum' : 
                         material === 'brons' ? 'Bronze' : material;
      break;
    }
  }
  
  // Apply category-specific parsing
  if (category === 'cable') {
    const cableEnhanced = cableParser.parseProduct(enhanced);
    Object.assign(enhanced, cableEnhanced);
  } else if (category === 'switching') {
    const switchingEnhanced = switchingParser.parseProduct(enhanced);
    Object.assign(enhanced, switchingEnhanced);
  }
  // For other categories (distribution, lighting, other), we just use the basic enhancement
  
  // Validate and clean data
  enhanced.dataQuality = calculateDataQuality(enhanced);
  
  return enhanced;
}

function calculateDataQuality(data) {
  const requiredFields = ['title', 'price', 'sku', 'brand'];
  const optionalFields = ['description', 'image', 'availability', 'color', 'material'];
  
  let score = 0;
  let maxScore = 0;
  const missingRequired = [];
  const missingOptional = [];
  
  // Check required fields
  requiredFields.forEach(field => {
    maxScore += 2; // Required fields worth 2 points
    if (data[field] && data[field].trim() !== '') {
      score += 2;
    } else {
      missingRequired.push(field);
    }
  });
  
  // Check optional fields  
  optionalFields.forEach(field => {
    maxScore += 1; // Optional fields worth 1 point
    if (data[field] && data[field].trim() !== '') {
      score += 1;
    } else {
      missingOptional.push(field);
    }
  });
  
  return {
    score: score,
    maxScore: maxScore,
    percentage: Math.round((score / maxScore) * 100),
    missingRequired: missingRequired,
    missingOptional: missingOptional,
    isComplete: missingRequired.length === 0
  };
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function scrapeCategoryPage(categoryUrl, scrapeAllPages = false, collectUrlsOnly = false) {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const allProductUrls = [];
    const seenProductUrls = new Set();
    let currentPageNum = 1;
    let currentUrl = categoryUrl;
    let hasMorePages = true;
    
    while (hasMorePages && (scrapeAllPages || currentPageNum === 1)) {
      console.log(`Scraping page ${currentPageNum}: ${currentUrl}`);
      
      try {
        await page.goto(currentUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000
        });
      } catch (navError) {
        console.log(`Failed to navigate to page ${currentPageNum}: ${navError.message}`);
        break;
      }
      
      // Extract product URLs and pagination info from the current page
      const pageData = await page.evaluate(() => {
        const result = {
          urls: [],
          hasNextPage: false,
          nextPageUrl: null,
          totalProducts: 0
        };
        
        // Extract product URLs
        const urls = [];
        
        // Elektramat specific: Each .product-item container has one main product link
        const elektramatContainers = document.querySelectorAll('.product-item');
      
      if (elektramatContainers.length > 0) {
        console.log(`Found ${elektramatContainers.length} Elektramat product containers`);
        
        elektramatContainers.forEach(container => {
          // Get the main product link from each container
          const mainLink = container.querySelector('a[href]');
          if (mainLink) {
            const href = mainLink.getAttribute('href');
            if (href && !href.includes('javascript:')) {
              let fullUrl;
              if (href.startsWith('http')) {
                fullUrl = href;
              } else if (href.startsWith('/')) {
                fullUrl = window.location.origin + href;
              } else {
                fullUrl = window.location.origin + '/' + href;
              }
              
              // Only include URLs that look like product pages (contain product info or specific patterns)
              if (fullUrl.includes(window.location.hostname) && 
                  (fullUrl.includes('-') || fullUrl.includes('/product') || href.length > 10)) {
                urls.push(fullUrl);
              }
            }
          }
        });
      } else {
        // Fallback to generic selectors for other sites
        const genericSelectors = [
          'a[href*="/product/"]',
          'a[href*="/item/"]',
          'a[href*="/p/"]',
          '.product-tile a',
          '.product-card a',
          '.product a',
          'article a[href*="/"]'
        ];
        
        const uniqueUrls = new Set();
        
        genericSelectors.forEach(selector => {
          const links = document.querySelectorAll(selector);
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('javascript:')) {
              // Convert relative URLs to absolute
              let fullUrl;
              if (href.startsWith('http')) {
                fullUrl = href;
              } else if (href.startsWith('/')) {
                fullUrl = window.location.origin + href;
              } else {
                fullUrl = window.location.origin + '/' + href;
              }
              
              // Filter out non-product URLs
              if (fullUrl.includes('/product') || 
                  fullUrl.includes('/item') || 
                  fullUrl.includes('/p/') ||
                  (fullUrl.includes('.html') && !fullUrl.includes('/category'))) {
                uniqueUrls.add(fullUrl);
              }
            }
          });
        });
        
        urls.push(...Array.from(uniqueUrls));
      }
      
      result.urls = urls;
      result.totalProducts = urls.length;
      
      // Check for pagination - common patterns
      // Method 1: Look for page parameter in URL
      const currentUrlObj = new URL(window.location.href);
      const currentPage = parseInt(currentUrlObj.searchParams.get('p')) || 1;
      
      // Method 2: Look for pagination links
      const paginationSelectors = [
        '.pages-items a.next', // Magento common pattern
        'a[title="Volgende"]', // Dutch "Next"
        'a[title="Next"]',
        '.pagination a.next',
        '.pager .next a',
        'a[rel="next"]',
        '.toolbar-products .pages a.action.next'
      ];
      
      let nextPageLink = null;
      for (const selector of paginationSelectors) {
        const nextLink = document.querySelector(selector);
        if (nextLink && nextLink.href) {
          nextPageLink = nextLink.href;
          break;
        }
      }
      
      // Method 3: Check if there's a link to page+1
      if (!nextPageLink) {
        const nextPageNum = currentPage + 1;
        const pageLinks = document.querySelectorAll(`a[href*="?p=${nextPageNum}"], a[href*="&p=${nextPageNum}"]`);
        if (pageLinks.length > 0) {
          nextPageLink = pageLinks[0].href;
        }
      }
      
      // Method 4: Check for "no products" message indicating we've gone too far
      const noProductsSelectors = [
        '.message.info.empty',
        '.no-products',
        '.empty-category',
        '[class*="no-results"]',
        '[class*="empty"]'
      ];
      
      let hasNoProducts = false;
      for (const selector of noProductsSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.toLowerCase().includes('geen')) { // Dutch for "no"
          hasNoProducts = true;
          break;
        }
      }
      
      result.hasNextPage = !hasNoProducts && nextPageLink !== null;
      result.nextPageUrl = nextPageLink;
      
      return result;
    });
    
      // Process the page data
      console.log(`Page ${currentPageNum} - Products found: ${pageData.totalProducts}, Has next: ${pageData.hasNextPage}, Next URL: ${pageData.nextPageUrl}`);
      
      if (pageData.totalProducts === 0) {
        console.log(`No products found on page ${currentPageNum}`);
        hasMorePages = false;
      } else {
        // Add new product URLs, avoiding duplicates
        let newProductsCount = 0;
        for (const url of pageData.urls) {
          if (!seenProductUrls.has(url)) {
            seenProductUrls.add(url);
            allProductUrls.push(url);
            newProductsCount++;
          }
        }
        
        console.log(`Found ${newProductsCount} new products on page ${currentPageNum} (${pageData.totalProducts} total on page)`);
        
        // Check if we should continue to next page
        if (scrapeAllPages && pageData.hasNextPage && pageData.nextPageUrl) {
          // If we found no new products (all were duplicates), stop
          if (newProductsCount === 0) {
            console.log('All products on this page were duplicates. Stopping pagination.');
            hasMorePages = false;
          } else {
            currentUrl = pageData.nextPageUrl;
            currentPageNum++;
            hasMorePages = true;
            console.log(`Moving to next page: ${currentUrl}`);
          }
        } else {
          console.log(`Stopping pagination. scrapeAllPages: ${scrapeAllPages}, hasNextPage: ${pageData.hasNextPage}`);
          hasMorePages = false;
        }
      }
      
      // If scrapeAllPages is false, we only scrape the first page
      if (!scrapeAllPages) {
        hasMorePages = false;
      }
    }
    
    await browser.close();
    
    if (allProductUrls.length === 0) {
      return {
        success: false,
        url: categoryUrl,
        error: 'No product URLs found on category pages',
        timestamp: new Date().toISOString()
      };
    }
    
    console.log(`Found ${allProductUrls.length} unique product URLs across ${currentPageNum} page(s)`);
    
    // If only collecting URLs, return early
    if (collectUrlsOnly) {
      return {
        success: true,
        url: categoryUrl,
        type: 'category',
        pagesScraped: currentPageNum,
        productsFound: allProductUrls.length,
        productsScraped: 0,
        productUrls: allProductUrls,
        products: [],
        urlsOnly: true,
        timestamp: new Date().toISOString()
      };
    }
    
    // Now scrape each product
    const results = [];
    
    for (let i = 0; i < allProductUrls.length; i++) {
      const productUrl = allProductUrls[i];
      console.log(`Scraping product ${i + 1}/${allProductUrls.length}: ${productUrl}`);
      
      const result = await scrapeProduct(productUrl);
      results.push(result);
      
      // Add delay between requests to be respectful
      if (i < allProductUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return {
      success: true,
      url: categoryUrl,
      type: 'category',
      pagesScraped: currentPageNum,
      productsFound: allProductUrls.length,
      productsScraped: results.filter(r => r.success).length,
      productUrls: allProductUrls,
      products: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      url: categoryUrl,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeMultipleProducts(urls) {
  const results = [];
  
  for (const url of urls) {
    if (!validateUrl(url)) {
      results.push({
        success: false,
        url: url,
        error: 'Invalid URL format',
        timestamp: new Date().toISOString()
      });
      continue;
    }
    
    console.log(`Scraping: ${url}`);
    const result = await scrapeProduct(url);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

async function scrapeCategoryWithPagination(baseUrl) {
  // This is a convenience wrapper that always scrapes all pages
  return scrapeCategoryPage(baseUrl, true);
}

module.exports = {
  scrapeProduct,
  scrapeMultipleProducts,
  scrapeCategoryPage,
  scrapeCategoryWithPagination,
  validateUrl
};