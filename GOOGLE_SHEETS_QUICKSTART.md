# Google Sheets Integration - Quick Start Guide

🎉 Your product scraper now supports exporting results directly to Google Sheets!

## 🚀 Features

- ✅ Export single product results
- ✅ Export batch scraping results  
- ✅ Export category page results
- ✅ Create new spreadsheets automatically
- ✅ Append to existing spreadsheets
- ✅ Professional formatting with headers
- ✅ Auto-resize columns for readability

## 📋 What Gets Exported

| Column | Description |
|--------|-------------|
| URL | Original product URL |
| Title | Product name/title |
| Price | Extracted price |
| Currency | Currency symbol (€, $, £) |
| Amount/Quantity | Available quantity |
| SKU | Product SKU/Article number |
| Availability | Stock status |
| Primary Category | Main category |
| All Categories | Full breadcrumb path |
| Description | Product description (truncated) |
| Image URL | Product image URL |
| Scrape Status | Success/Failed |
| Timestamp | When scraped |

## 🛠️ Setup (Required for Google Sheets)

### 1. Quick Setup

1. Follow instructions in `config/README.md`
2. Download credentials JSON from Google Cloud Console
3. Place as `config/credentials.json`
4. Run option 4 in the menu to test connection

### 2. Test Without Setup

You can still use all scraping features without Google Sheets setup. The export options will simply show a setup message.

## 🎯 How to Use

### Method 1: CLI Menu
```bash
npm start
# Choose option 4 to test Google Sheets
# Choose options 1-3 for scraping with export options
```

### Method 2: Direct URL
```bash
npm start
# Paste any product URL directly - it will be scraped with export options
```

## 📊 Example Workflow

1. **Scrape a Category**:
   - Choose option 3
   - Enter category URL (e.g., https://elektramat.nl/some-category)
   - Wait for all products to be scraped
   - Choose export option 2 (new sheet) or 3 (existing sheet)

2. **Result**: 
   - Professional spreadsheet with all products
   - Formatted headers and auto-sized columns
   - Shareable link for team collaboration

## 🔗 Spreadsheet URLs

When export completes, you'll get a direct link like:
```
https://docs.google.com/spreadsheets/d/1ABC123.../edit
```

## 🛡️ Security Notes

- Credentials file is automatically ignored by git
- Service account only accesses sheets shared with it
- No personal Google account access required

## 🎨 Spreadsheet Features

- 🟢 Green header row for easy identification
- 📏 Auto-resized columns for readability
- 📅 Timestamps for tracking when data was collected
- 🔍 Filterable data for analysis
- 📱 Mobile-friendly Google Sheets interface

## 🚫 Troubleshooting

**"Credentials file not found"**
→ Follow setup in `config/README.md`

**"Failed to create spreadsheet"**  
→ Check Google Sheets API is enabled in Google Cloud Console

**"Export failed"**
→ Ensure service account has access to the spreadsheet

**"Invalid Google Sheets URL"**
→ URL should be: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`