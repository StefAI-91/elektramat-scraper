# 🔧 Fix Google Sheets Permissions

Your authentication is working perfectly, but the service account needs proper permissions. Here's how to fix it:

## Option 1: Enable Google Drive API (Recommended)

The Google Sheets API sometimes requires Google Drive API to be enabled as well.

1. **Go to**: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=plasma-kit-447613-u8
2. **Click "ENABLE"**
3. Wait 2 minutes
4. Run `node test-connection.js` again

## Option 2: Check Service Account Permissions

1. **Go to IAM**: https://console.cloud.google.com/iam-admin/iam?project=plasma-kit-447613-u8
2. Find your service account: `product-scraper@plasma-kit-447613-u8.iam.gserviceaccount.com`
3. Click the pencil icon to edit
4. Add role: **"Editor"** or **"Owner"**
5. Save and wait 2 minutes

## Option 3: Create Test with Service Account (Alternative Test)

If you have a Google Spreadsheet already:
1. Open any Google Spreadsheet
2. Click "Share" button
3. Add this email: `product-scraper@plasma-kit-447613-u8.iam.gserviceaccount.com`
4. Give "Editor" permission
5. Save the spreadsheet ID from the URL

Then we can test appending to that specific spreadsheet instead of creating new ones.

## 🎯 Quick Test After Fix

Run this to test:
```bash
node test-connection.js
```

## 💡 Most Common Fix

Usually enabling the Google Drive API (Option 1) solves this issue immediately!

---

**Your Details:**
- Project: `plasma-kit-447613-u8`
- Service Account: `product-scraper@plasma-kit-447613-u8.iam.gserviceaccount.com`