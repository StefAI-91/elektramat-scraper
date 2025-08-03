const { scrapeCategoryPage } = require('./scraper');

async function test() {
  console.log('Testing multi-page URL collection...');
  const url = 'https://www.elektramat.nl/schakelmateriaal/gira/systeem-55/zuiver-wit-glanzend/';
  
  console.log('Collecting URLs from all pages (without scraping products)');
  const result = await scrapeCategoryPage(url, true, true); // scrapeAllPages = true, collectUrlsOnly = true
  
  console.log('\nResults:');
  console.log(`Success: ${result.success}`);
  console.log(`Pages scraped: ${result.pagesScraped}`);
  console.log(`Products found: ${result.productsFound}`);
  console.log(`URLs only mode: ${result.urlsOnly}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  
  // Show first 5 URLs
  console.log('\nFirst 5 product URLs:');
  result.productUrls.slice(0, 5).forEach((url, i) => {
    console.log(`${i + 1}. ${url}`);
  });
}

test().catch(console.error);