const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function detailedTest() {
  console.log('🔍 Running detailed Google Sheets test...\n');
  
  const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath));
  
  console.log('📋 Service Account Details:');
  console.log(`   Project ID: ${credentials.project_id}`);
  console.log(`   Client Email: ${credentials.client_email}`);
  console.log('');
  
  try {
    // Test authentication
    console.log('1️⃣ Testing authentication...');
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const authResponse = await auth.authorize();
    console.log('✅ Authentication successful');
    console.log(`   Access token obtained: ${authResponse.access_token ? 'Yes' : 'No'}`);
    
    // Test Google Sheets API
    console.log('\n2️⃣ Testing Google Sheets API...');
    const sheets = google.sheets({ version: 'v4', auth });
    
    // First, try to list spreadsheets (less permission required)
    console.log('   Attempting to create a spreadsheet...');
    
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Test Spreadsheet - ${new Date().toLocaleString()}`
        },
        sheets: [{
          properties: {
            title: 'Data'
          }
        }]
      }
    });
    
    console.log('✅ Spreadsheet created successfully!');
    console.log(`   Title: ${response.data.properties.title}`);
    console.log(`   ID: ${response.data.spreadsheetId}`);
    console.log(`   URL: https://docs.google.com/spreadsheets/d/${response.data.spreadsheetId}/edit`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.code === 403) {
      console.log('\n🔧 Permission Error - Possible solutions:');
      console.log('1. Make sure Google Sheets API is enabled (you said it is)');
      console.log('2. Check if the service account has been granted access');
      console.log('3. Try creating a new service account key');
      console.log('\n📝 Full error details:');
      console.log(JSON.stringify(error.response?.data, null, 2));
    }
    
    if (error.response?.data?.error?.details) {
      console.log('\n📋 Detailed error information:');
      error.response.data.error.details.forEach(detail => {
        console.log(`   - ${detail.reason}: ${detail.metadata?.service || detail.description}`);
      });
    }
  }
}

detailedTest().catch(console.error);