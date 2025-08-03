# Google Sheets API Setup Instructions

To use Google Sheets integration, you need to set up Google Cloud credentials.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the details:
   - Service account name: `product-scraper`
   - Description: `Service account for product scraper Google Sheets integration`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

## Step 3: Generate Key

1. In the Credentials page, find your new service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Select "JSON" format
6. Click "Create"
7. The JSON file will be downloaded automatically

## Step 4: Install Credentials

1. Rename the downloaded JSON file to `credentials.json`
2. Place it in this `config/` folder: `product-scraper/config/credentials.json`

## Step 5: Share Spreadsheets (if using existing sheets)

If you want to export to an existing spreadsheet:
1. Open your Google Spreadsheet
2. Click "Share" button
3. Add the service account email as an editor
4. The email will be in the format: `service-account-name@project-id.iam.gserviceaccount.com`

## Security Notes

- ⚠️ Never commit `credentials.json` to version control
- 🔒 Keep your credentials file secure
- 🗑️ Delete test spreadsheets after testing
- 📝 The service account can only access sheets that are explicitly shared with it

## Testing

Run the scraper with Google Sheets integration to test your setup:
```bash
npm start
```

Choose the "google sheets" option when prompted.