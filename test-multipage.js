const { scrapeCategoryPage } = require('./scraper');

async function test() {
  console.log('Testing multi-page scraping...');
  const url = 'https://www.elektramat.nl/schakelmateriaal/gira/systeem-55/zuiver-wit-glanzend/';
  
  console.log('Scraping with scrapeAllPages = true');
  const result = await scrapeCategoryPage(url, true);
  
  console.log('\nResults:');
  console.log(`Success: ${result.success}`);
  console.log(`Pages scraped: ${result.pagesScraped}`);
  console.log(`Products found: ${result.productsFound}`);
  console.log(`Products scraped: ${result.productsScraped}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
}

test().catch(console.error);