const puppeteer = require('puppeteer');

async function testPagination() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  const url = 'https://www.elektramat.nl/schakelmateriaal/gira/systeem-55/zuiver-wit-glanzend/';
  
  await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  // Check for pagination elements
  const paginationInfo = await page.evaluate(() => {
    const result = {
      currentUrl: window.location.href,
      paginationFound: false,
      nextPageLink: null,
      pageLinks: [],
      debugInfo: []
    };
    
    // Look for page parameter in URL
    const currentUrlObj = new URL(window.location.href);
    const currentPage = parseInt(currentUrlObj.searchParams.get('p')) || 1;
    result.debugInfo.push(`Current page from URL: ${currentPage}`);
    
    // Look for pagination links
    const paginationSelectors = [
      '.pages-items a.next',
      'a[title="Volgende"]',
      'a[title="Next"]',
      '.pagination a.next',
      '.pager .next a',
      'a[rel="next"]',
      '.toolbar-products .pages a.action.next',
      '.pages a.next',
      '.limiter-options',
      '.toolbar .pages'
    ];
    
    for (const selector of paginationSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        result.debugInfo.push(`Found ${elements.length} elements with selector: ${selector}`);
        elements.forEach(el => {
          if (el.href) {
            result.pageLinks.push(el.href);
          }
        });
      }
    }
    
    // Look for any links with page parameters
    const allLinks = document.querySelectorAll('a[href*="?p="], a[href*="&p="]');
    result.debugInfo.push(`Found ${allLinks.length} links with page parameters`);
    allLinks.forEach(link => {
      result.pageLinks.push(link.href);
    });
    
    // Check toolbar structure
    const toolbar = document.querySelector('.toolbar-products');
    if (toolbar) {
      result.debugInfo.push('Found toolbar-products');
      const toolbarHTML = toolbar.innerHTML.substring(0, 500);
      result.debugInfo.push(`Toolbar HTML preview: ${toolbarHTML}`);
    }
    
    // Look for page numbers
    const pageNumbers = document.querySelectorAll('.pages-items .item a');
    if (pageNumbers.length > 0) {
      result.debugInfo.push(`Found ${pageNumbers.length} page number links`);
      pageNumbers.forEach(link => {
        if (link.href && link.href.includes('?p=')) {
          result.pageLinks.push(link.href);
        }
      });
    }
    
    return result;
  });
  
  console.log('Pagination Debug Info:');
  console.log(JSON.stringify(paginationInfo, null, 2));
  
  await browser.close();
}

testPagination().catch(console.error);