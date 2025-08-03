const { scrapeProduct } = require('./scraper');
const GoogleSheetsExporter = require('./googleSheets');

async function exportProductToSheets() {
    try {
        console.log('🔍 Scraping product information...');
        
        // Scrape the product
        const url = 'https://www.elektramat.nl/gira-e2-afdekraam-1-5-voudig-zwart-mat-100109/#combinations';
        const result = await scrapeProduct(url);
        
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
            return;
        }
        console.log('='.repeat(50));
        
        // Export to Google Sheets
        console.log('\n📊 Exporting to Google Sheets...');
        
        const exporter = new GoogleSheetsExporter();
        const spreadsheetId = '1GnfrLmXcQDVMxm0MFJnBLHt2fuYuQryddfL6aIA6hno';
        
        // Initialize the Google Sheets API
        const initialized = await exporter.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize Google Sheets API');
            return;
        }
        
        await exporter.exportToExistingSheet(spreadsheetId, [result], 'Blad1');
        
        console.log('✅ Product successfully exported to Google Sheets!');
        console.log(`📋 View your spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

exportProductToSheets();