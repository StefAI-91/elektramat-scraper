const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testConnection() {
  console.log('🧪 Testing Google Sheets connection...\n');
  
  const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ credentials.json not found in config/ folder');
    return false;
  }
  
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath));
    
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Product Scraper Test - ${new Date().toISOString().split('T')[0]}`
        }
      }
    });
    
    console.log('✅ Google Sheets API test successful!');
    console.log(`📄 Created test spreadsheet: ${response.data.properties.title}`);
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${response.data.spreadsheetId}/edit`);
    console.log('\n🎉 Your setup is working perfectly!');
    console.log('💡 You can delete the test spreadsheet if you want.');
    
    return true;
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    
    if (error.message.includes('permission') || error.message.includes('The caller does not have permission')) {
      console.log('\n💡 You need to enable the Google Sheets API:');
      console.log('🔗 Direct link: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=' + JSON.parse(fs.readFileSync(credentialsPath)).project_id);
      console.log('👆 Click "ENABLE" button, wait 1-2 minutes, then try again');
    }
    
    return false;
  }
}

testConnection();