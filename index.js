const { scrapeProduct, scrapeMultipleProducts, scrapeCategoryPage, validateUrl } = require('./scraper');
const GoogleSheetsExporter = require('./googleSheets');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function displayResult(result) {
  console.log('\n' + '='.repeat(50));
  console.log(`URL: ${result.url}`);
  console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Timestamp: ${result.timestamp}`);
  
  if (result.success) {
    console.log('\nProduct Information:');
    console.log(`Title: ${result.data.title || 'Not found'}`);
    console.log(`Price: ${result.data.currency || ''}${result.data.price || 'Not found'}`);
    console.log(`Amount/Quantity: ${result.data.amount || 'Not found'}`);
    console.log(`Availability: ${result.data.availability || 'Not found'}`);
  } else {
    console.log(`Error: ${result.error}`);
  }
  console.log('='.repeat(50));
}

function askForUrl() {
  rl.question('\nChoose an option:\n1. Single product URL\n2. Multiple products (batch)\n3. Category page scraping\n4. Google Sheets test\n5. Exit\n\nEnter choice (1-5) or paste URL directly: ', async (input) => {
    const choice = input.trim();
    
    if (choice === '5' || choice.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }
    
    if (choice === '1') {
      askForSingleUrl();
      return;
    }
    
    if (choice === '2' || choice.toLowerCase() === 'multiple') {
      askForMultipleUrls();
      return;
    }
    
    if (choice === '3' || choice.toLowerCase() === 'category') {
      askForCategoryUrl();
      return;
    }
    
    if (choice === '4') {
      await testGoogleSheets();
      askForUrl();
      return;
    }
    
    // If input looks like a URL, treat it as single product
    if (validateUrl(choice)) {
      console.log('🔍 Scraping product information...');
      const result = await scrapeProduct(choice);
      displayResult(result);
      
      await askForExportOptions([result]);
      askForUrl();
      return;
    }
    
    console.log('❌ Invalid choice. Please select 1-5 or paste a valid URL.');
    askForUrl();
  });
}

function askForMultipleUrls() {
  console.log('\nEnter URLs separated by commas:');
  rl.question('URLs: ', async (input) => {
    const urls = input.split(',').map(url => url.trim()).filter(url => url);
    
    if (urls.length === 0) {
      console.log('❌ No valid URLs provided.');
      askForUrl();
      return;
    }
    
    console.log(`🔍 Scraping ${urls.length} products...`);
    const results = await scrapeMultipleProducts(urls);
    
    results.forEach(displayResult);
    
    console.log(`\n📊 Summary: ${results.filter(r => r.success).length}/${results.length} successful`);
    
    await askForExportOptions(results);
    askForUrl();
  });
}

function askForCategoryUrl() {
  console.log('\nEnter category page URL:');
  rl.question('Category URL: ', async (input) => {
    if (!validateUrl(input)) {
      console.log('❌ Invalid URL format. Please enter a valid URL.');
      askForCategoryUrl();
      return;
    }
    
    console.log('🔍 Scraping category page...');
    const result = await scrapeCategoryPage(input);
    
    if (result.success) {
      console.log('\n' + '='.repeat(50));
      console.log(`Category URL: ${result.url}`);
      console.log(`Products Found: ${result.productsFound}`);
      console.log(`Products Successfully Scraped: ${result.productsScraped}`);
      console.log(`Timestamp: ${result.timestamp}`);
      console.log('='.repeat(50));
      
      if (result.products && result.products.length > 0) {
        console.log('\nProduct Details:');
        result.products.forEach((product, index) => {
          console.log(`\n--- Product ${index + 1} ---`);
          displayResult(product);
        });
        
        await askForExportOptions(result.products);
      }
    } else {
      displayResult(result);
    }
    
    askForUrl();
  });
}

// New functions for Google Sheets integration
function askForSingleUrl() {
  rl.question('\nEnter product URL: ', async (input) => {
    if (!validateUrl(input)) {
      console.log('❌ Invalid URL format. Please enter a valid URL.');
      askForSingleUrl();
      return;
    }
    
    console.log('🔍 Scraping product information...');
    const result = await scrapeProduct(input);
    displayResult(result);
    
    await askForExportOptions([result]);
    askForUrl();
  });
}

async function askForExportOptions(results) {
  return new Promise((resolve) => {
    rl.question('\nExport options:\n1. No export (continue)\n2. Export to new Google Sheet\n3. Export to existing Google Sheet\n\nChoose (1-3): ', async (choice) => {
      switch (choice.trim()) {
        case '1':
          resolve();
          break;
        case '2':
          await exportToNewGoogleSheet(results);
          resolve();
          break;
        case '3':
          await exportToExistingGoogleSheet(results);
          resolve();
          break;
        default:
          console.log('❌ Invalid choice. Skipping export.');
          resolve();
      }
    });
  });
}

async function exportToNewGoogleSheet(results) {
  try {
    const exporter = new GoogleSheetsExporter();
    const initialized = await exporter.initialize();
    
    if (!initialized) {
      console.log('❌ Google Sheets not configured. Please follow setup instructions in config/README.md');
      return;
    }
    
    console.log('📤 Creating new Google Sheet...');
    const exportResult = await exporter.exportToNewSheet(results);
    
    if (exportResult.success) {
      console.log('✅ Export successful!');
    }
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  }
}

async function exportToExistingGoogleSheet(results) {
  return new Promise((resolve) => {
    rl.question('\nEnter Google Sheets URL or ID: ', async (input) => {
      try {
        const exporter = new GoogleSheetsExporter();
        const initialized = await exporter.initialize();
        
        if (!initialized) {
          console.log('❌ Google Sheets not configured. Please follow setup instructions in config/README.md');
          resolve();
          return;
        }
        
        const spreadsheetId = exporter.extractSpreadsheetId(input);
        if (!spreadsheetId) {
          console.log('❌ Invalid Google Sheets URL or ID format.');
          resolve();
          return;
        }
        
        console.log('📤 Adding to existing Google Sheet...');
        const exportResult = await exporter.exportToExistingSheet(spreadsheetId, results);
        
        if (exportResult.success) {
          console.log('✅ Export successful!');
        }
      } catch (error) {
        console.error('❌ Export failed:', error.message);
      }
      resolve();
    });
  });
}

async function testGoogleSheets() {
  console.log('\n🧪 Testing Google Sheets connection...');
  const exporter = new GoogleSheetsExporter();
  const success = await exporter.testConnection();
  
  if (!success) {
    console.log('\n💡 Setup instructions:');
    console.log('1. Follow the guide in config/README.md');
    console.log('2. Place your credentials.json file in the config/ folder');
    console.log('3. Run this test again');
  }
}

// Update existing functions to include export options
const originalAskForMultipleUrls = askForMultipleUrls;
const originalAskForCategoryUrl = askForCategoryUrl;

console.log('🕷️  Product Scraper Tool');
console.log('This tool extracts product title, price, and quantity from web pages.');
console.log('📊 Now with Google Sheets integration!');
askForUrl();