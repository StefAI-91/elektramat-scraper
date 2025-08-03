# 🚀 Quick Setup - Final Steps

Great! Your credentials are working, but you need to enable the Google Sheets API:

## Step 1: Enable Google Sheets API

1. **Go to**: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=plasma-kit-447613-u8
   
   *(This direct link should take you straight to the Google Sheets API page for your project)*

2. **Click the "ENABLE" button**

3. **Wait 1-2 minutes** for the API to be activated

## Step 2: Test Your Setup

After enabling the API, run:

```bash
node troubleshoot.js
```

You should see "✅ Google Sheets API test successful!" 

## Step 3: Start Using It!

Once the test passes, you can use the scraper:

```bash
npm start
# Choose option 4 to test Google Sheets again
# Choose options 1-3 to scrape with export functionality
```

## 🎯 Direct Links for Your Project

- **Google Cloud Console**: https://console.cloud.google.com/home/dashboard?project=plasma-kit-447613-u8
- **APIs & Services**: https://console.cloud.google.com/apis/dashboard?project=plasma-kit-447613-u8
- **Google Sheets API**: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=plasma-kit-447613-u8

Your service account email is: `product-scraper@plasma-kit-447613-u8.iam.gserviceaccount.com`

---

**❓ Need Help?**
If you get stuck, just let me know what error message you see!