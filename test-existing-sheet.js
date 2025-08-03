const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testExistingSheet() {
  console.log('🧪 Testing with existing spreadsheet...\n');
  
  console.log('📝 Instructions:');
  console.log('1. Create a new Google Spreadsheet in your Google Drive');
  console.log('2. Click the "Share" button');
  console.log('3. Add this email: product-scraper@plasma-kit-447613-u8.iam.gserviceaccount.com');
  console.log('4. Give it "Editor" permission');
  console.log('5. Copy the spreadsheet URL');
  console.log('');
  console.log('Then run: node test-existing-sheet.js YOUR_SPREADSHEET_URL');
  console.log('');
  
  const spreadsheetUrl = process.argv[2];
  if (!spreadsheetUrl) {
    console.log('❌ Please provide a spreadsheet URL as argument');
    console.log('Example: node test-existing-sheet.js https://docs.google.com/spreadsheets/d/ABC123/edit');
    return;
  }
  
  // Extract spreadsheet ID from URL
  const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    console.log('❌ Invalid spreadsheet URL format');
    return;
  }
  
  const spreadsheetId = match[1];
  console.log(`📄 Spreadsheet ID: ${spreadsheetId}\n`);
  
  try {
    const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath));
    
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test 1: Read spreadsheet metadata
    console.log('1️⃣ Testing read access...');
    try {
      const metadata = await sheets.spreadsheets.get({ spreadsheetId });
      console.log(`   ✅ Can read spreadsheet: "${metadata.data.properties.title}"`);
    } catch (error) {
      console.log(`   ❌ Cannot read spreadsheet: ${error.message}`);
      console.log('   Make sure you shared it with:', credentials.client_email);
      return;
    }
    
    // Test 2: Write data
    console.log('\n2️⃣ Testing write access...');
    try {
      const testData = [
        ['Test Time', 'Status', 'Message'],
        [new Date().toLocaleString(), 'Success', 'Google Sheets integration working!']
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1:C2',
        valueInputOption: 'RAW',
        requestBody: {
          values: testData
        }
      });
      
      console.log('   ✅ Successfully wrote test data!');
      console.log(`   Check your spreadsheet: ${spreadsheetUrl}`);
      console.log('');
      console.log('🎉 Everything is working! You can now use the scraper with Google Sheets export.');
      
    } catch (error) {
      console.log(`   ❌ Cannot write to spreadsheet: ${error.message}`);
      console.log('   Make sure the service account has "Editor" permission');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testExistingSheet();