const GoogleSheetsExporter = require('./googleSheets');

async function checkSheet() {
    try {
        const exporter = new GoogleSheetsExporter();
        const spreadsheetId = '1GnfrLmXcQDVMxm0MFJnBLHt2fuYuQryddfL6aIA6hno';
        
        const initialized = await exporter.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize Google Sheets API');
            return;
        }
        
        // Get spreadsheet info
        const response = await exporter.sheets.spreadsheets.get({ spreadsheetId });
        console.log('📊 Spreadsheet info:');
        console.log(`Title: ${response.data.properties.title}`);
        console.log('Sheets:');
        response.data.sheets.forEach((sheet, index) => {
            console.log(`  ${index + 1}. ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkSheet();