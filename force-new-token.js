const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function forceNewToken() {
  console.log('🔄 Forcing new authentication token...\n');
  
  const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath));
  
  console.log('Service Account:', credentials.client_email);
  console.log('Project:', credentials.project_id);
  console.log('');
  
  try {
    // Create new auth instance
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });
    
    // Force new token
    console.log('Getting fresh access token...');
    const tokens = await auth.authorize();
    console.log('✅ New token obtained\n');
    
    // Now test with fresh token
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Testing spreadsheet creation with fresh token...');
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Product Scraper Test - ${new Date().toLocaleString()}`
        }
      }
    });
    
    console.log('✅ SUCCESS! Spreadsheet created!');
    console.log(`📄 Title: ${response.data.properties.title}`);
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${response.data.spreadsheetId}/edit`);
    console.log('\n🎉 Google Sheets integration is now working!');
    
  } catch (error) {
    console.log('❌ Still getting error:', error.message);
    
    if (error.response?.status === 403) {
      console.log('\n🤔 This is very unusual with Owner role...');
      console.log('\nPossible causes:');
      console.log('1. Organization policy blocking service accounts');
      console.log('2. Quota limits reached');
      console.log('3. API not fully enabled yet');
      console.log('\nLet\'s try the manual approach:');
      console.log('1. Create a spreadsheet manually');
      console.log('2. Share it with:', credentials.client_email);
      console.log('3. Test with: node test-existing-sheet.js YOUR_URL');
    }
  }
}

forceNewToken();