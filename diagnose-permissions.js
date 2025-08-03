const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function diagnosePermissions() {
  console.log('🔍 Running comprehensive permission diagnostics...\n');
  
  const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath));
  
  console.log('1️⃣ Service Account Details:');
  console.log(`   Email: ${credentials.client_email}`);
  console.log(`   Project: ${credentials.project_id}`);
  
  try {
    // Create auth
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });
    
    // Get access token
    const tokens = await auth.authorize();
    console.log('\n2️⃣ Authentication Status:');
    console.log('   ✅ Access token obtained successfully');
    
    // Check what APIs are available
    console.log('\n3️⃣ Testing API Access:');
    
    // Test Drive API first (simpler permission)
    console.log('   Testing Google Drive API...');
    try {
      const drive = google.drive({ version: 'v3', auth });
      const driveResponse = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)'
      });
      console.log('   ✅ Google Drive API: Working');
    } catch (driveError) {
      console.log('   ❌ Google Drive API:', driveError.message);
      if (driveError.response?.data?.error?.message) {
        console.log('      Details:', driveError.response.data.error.message);
      }
    }
    
    // Test Sheets API
    console.log('   Testing Google Sheets API...');
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Try different operations to see what works
    console.log('\n4️⃣ Testing Different Operations:');
    
    // Test 1: Try to get spreadsheet (requires less permission)
    console.log('   Test 1: Reading a public spreadsheet...');
    try {
      // Google's public example spreadsheet
      const publicSheet = await sheets.spreadsheets.get({
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      });
      console.log('   ✅ Can read public spreadsheets');
    } catch (error) {
      console.log('   ❌ Cannot read public spreadsheets:', error.message);
    }
    
    // Test 2: Try to create a spreadsheet
    console.log('   Test 2: Creating a new spreadsheet...');
    try {
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: 'Permission Test Sheet'
          }
        }
      });
      console.log('   ✅ Can create spreadsheets!');
      console.log(`      Sheet ID: ${createResponse.data.spreadsheetId}`);
      console.log(`      URL: https://docs.google.com/spreadsheets/d/${createResponse.data.spreadsheetId}/edit`);
    } catch (error) {
      console.log('   ❌ Cannot create spreadsheets:', error.message);
      
      // Check specific error details
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        console.log(`      Error Code: ${errorData.code}`);
        console.log(`      Error Status: ${errorData.status}`);
        
        if (errorData.details) {
          console.log('      Error Details:');
          errorData.details.forEach(detail => {
            Object.entries(detail).forEach(([key, value]) => {
              console.log(`         ${key}: ${value}`);
            });
          });
        }
      }
    }
    
    // Check token info
    console.log('\n5️⃣ Token Information:');
    if (tokens.access_token) {
      // Decode JWT to see claims (without verifying - just for info)
      const tokenParts = tokens.access_token.split('.');
      if (tokenParts.length >= 2) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('   Token Claims:');
          console.log(`      Issued to: ${payload.email || 'N/A'}`);
          console.log(`      Scopes: ${payload.scope || 'N/A'}`);
          console.log(`      Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
        } catch (e) {
          console.log('   Could not decode token');
        }
      }
    }
    
  } catch (error) {
    console.log('\n❌ Fatal Error:', error.message);
  }
  
  console.log('\n📋 Troubleshooting Summary:');
  console.log('If you\'re still getting permission errors after adding roles:');
  console.log('');
  console.log('1. Double-check you\'re in the right project:');
  console.log(`   https://console.cloud.google.com/home/dashboard?project=${credentials.project_id}`);
  console.log('');
  console.log('2. Verify the service account has a role:');
  console.log(`   https://console.cloud.google.com/iam-admin/iam?project=${credentials.project_id}`);
  console.log(`   Look for: ${credentials.client_email}`);
  console.log('');
  console.log('3. Common issues:');
  console.log('   - Role not saved properly (click Save button)');
  console.log('   - Looking at wrong project in console');
  console.log('   - Need to wait 5-10 minutes for propagation');
  console.log('   - Organization policies blocking service accounts');
  console.log('');
  console.log('4. Alternative: Domain-wide delegation');
  console.log('   If your Google account is part of a Google Workspace,');
  console.log('   organization policies might be blocking service accounts.');
}

diagnosePermissions().catch(console.error);