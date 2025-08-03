const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying project configuration...\n');

const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath));

console.log('📋 Service Account Configuration:');
console.log(`   Project ID: ${credentials.project_id}`);
console.log(`   Service Account Email: ${credentials.client_email}`);
console.log(`   Private Key ID: ${credentials.private_key_id}`);
console.log(`   Client ID: ${credentials.client_id}`);

console.log('\n📌 Important Links for YOUR project:');
console.log(`   Project Dashboard: https://console.cloud.google.com/home/dashboard?project=${credentials.project_id}`);
console.log(`   APIs Overview: https://console.cloud.google.com/apis/dashboard?project=${credentials.project_id}`);
console.log(`   Service Account: https://console.cloud.google.com/iam-admin/serviceaccounts?project=${credentials.project_id}`);
console.log(`   IAM Permissions: https://console.cloud.google.com/iam-admin/iam?project=${credentials.project_id}`);

console.log('\n💡 Quick Checks:');
console.log('1. Are you looking at the right project? It should be:', credentials.project_id);
console.log('2. Did you add a role to THIS service account?', credentials.client_email);
console.log('3. Common roles that work: Editor, Owner, or Service Account User + Sheets Admin');

console.log('\n🔧 Alternative Solution:');
console.log('If roles aren\'t working, try this:');
console.log('1. Create a Google Spreadsheet manually');
console.log('2. Share it with:', credentials.client_email);
console.log('3. Give "Editor" permission');
console.log('4. We can test with that specific spreadsheet');