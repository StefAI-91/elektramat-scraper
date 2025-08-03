# Product Scraper Tool

A web scraping tool built with Puppeteer that extracts product information (title, price, quantity) from e-commerce websites.

## Features

- Extract comprehensive product information from any product URL
- Support for multiple currencies (€, $, £, ¥)
- Batch processing of multiple URLs
- Category page scraping (extract all products from category pages)
- **📊 Google Sheets Integration** - Export results directly to Google Sheets
- Interactive CLI interface with multiple export options
- Error handling and validation
- Respectful scraping with delays between requests
- Professional spreadsheet formatting with auto-sizing

## Installation

```bash
npm install
```

## Usage

### Interactive Mode

```bash
npm start
# or
npm run scrape
```

This will start an interactive CLI where you can:
- Enter single URLs to scrape
- Process multiple URLs at once  
- Scrape entire category pages
- Export results to Google Sheets
- Test Google Sheets connection
- View formatted results

### Programmatic Usage

```javascript
const { scrapeProduct, scrapeMultipleProducts } = require('./scraper');

// Scrape single product
const result = await scrapeProduct('https://example.com/product');
console.log(result);

// Scrape multiple products
const urls = ['https://site1.com/product', 'https://site2.com/product'];
const results = await scrapeMultipleProducts(urls);
console.log(results);
```

## Output Format

```javascript
{
  success: true,
  url: "https://example.com/product",
  data: {
    title: "Product Name",
    price: "29.99",
    currency: "€",
    amount: "5",
    availability: "In Stock",
    sku: "ABC123",
    description: "Product description...",
    image: "https://example.com/image.jpg",
    categories: ["Electronics", "Phones"],
    primaryCategory: "Electronics"
  },
  timestamp: "2025-01-29T..."
}
```

## Supported Selectors

The scraper uses multiple selector strategies to find product information:

- **Title**: `h1`, `[data-testid="product-title"]`, `.product-title`, etc.
- **Price**: `[data-testid="price"]`, `.price`, `.product-price`, etc.
- **Quantity**: `[data-testid="quantity"]`, `.quantity`, `input[type="number"]`, etc.

## Notes

- The tool includes a 2-second delay between requests when scraping multiple URLs
- Uses headless Chrome with realistic user agent
- Handles timeouts and network errors gracefully
- Some websites may block automated requests

## 📊 Google Sheets Integration

The scraper now supports direct export to Google Sheets! 

### Quick Setup
1. Follow instructions in `config/README.md`
2. Download Google Service Account credentials
3. Place as `config/credentials.json`
4. Use option 4 in the CLI to test connection

### Features
- ✅ Create new spreadsheets automatically
- ✅ Append to existing spreadsheets  
- ✅ Professional formatting with headers
- ✅ Auto-resized columns
- ✅ Shareable links for team collaboration

See `GOOGLE_SHEETS_QUICKSTART.md` for detailed instructions.

## Legal Notice

This tool is for educational and legitimate use cases only. Always:
- Respect website terms of service
- Check robots.txt files
- Use reasonable request rates
- Obtain permission when necessary