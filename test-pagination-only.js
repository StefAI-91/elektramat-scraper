const puppeteer = require('puppeteer');

async function testPaginationOnly() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  const baseUrl = 'https://www.elektramat.nl/schakelmateriaal/gira/systeem-55/zuiver-wit-glanzend/';
  let currentUrl = baseUrl;
  let currentPageNum = 1;
  let allProductUrls = [];
  let hasMorePages = true;
  
  while (hasMorePages && currentPageNum <= 5) { // Limit to 5 pages for testing
    console.log(`\nNavigating to page ${currentPageNum}: ${currentUrl}`);
    
    await page.goto(currentUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    const pageData = await page.evaluate(() => {
      const result = {
        urls: [],
        hasNextPage: false,
        nextPageUrl: null,
        totalProducts: 0
      };
      
      // Extract product URLs
      const productContainers = document.querySelectorAll('.product-item');
      console.log(`Found ${productContainers.length} product containers`);
      
      productContainers.forEach(container => {
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
            result.urls.push(fullUrl);
          }
        }
      });
      
      result.totalProducts = result.urls.length;
      
      // Check for next page
      const nextLink = document.querySelector('.pages-items a.next, .pages a.next');
      if (nextLink && nextLink.href) {
        result.hasNextPage = true;
        result.nextPageUrl = nextLink.href;
      }
      
      return result;
    });
    
    console.log(`Found ${pageData.totalProducts} products on page ${currentPageNum}`);
    console.log(`Has next page: ${pageData.hasNextPage}`);
    console.log(`Next page URL: ${pageData.nextPageUrl}`);
    
    allProductUrls = allProductUrls.concat(pageData.urls);
    
    if (pageData.hasNextPage && pageData.nextPageUrl) {
      currentUrl = pageData.nextPageUrl;
      currentPageNum++;
    } else {
      hasMorePages = false;
    }
  }
  
  console.log(`\nTotal unique products found across ${currentPageNum} pages: ${[...new Set(allProductUrls)].length}`);
  console.log(`Total products (including duplicates): ${allProductUrls.length}`);
  
  await browser.close();
}

testPaginationOnly().catch(console.error);