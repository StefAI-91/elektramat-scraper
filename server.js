const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { scrapeProduct, scrapeCategoryPage, validateUrl } = require('./scraper');
const GoogleSheetsExporter = require('./googleSheets');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/scrape', async (req, res) => {
  try {
    const { url, scrapeType = 'single', scrapeAllPages = false } = req.body;
    
    console.log('Request body:', req.body);
    console.log(`scrapeAllPages value: ${scrapeAllPages}, type: ${typeof scrapeAllPages}`);
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    if (!validateUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    console.log(`Scraping (${scrapeType}): ${url}${scrapeAllPages ? ' - All pages' : ''}`);
    
    let result;
    if (scrapeType === 'category') {
      result = await scrapeCategoryPage(url, scrapeAllPages);
    } else {
      result = await scrapeProduct(url);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/export-sheets', async (req, res) => {
  try {
    console.log('📤 Export request received:', { url: req.body.url, scrapeType: req.body.scrapeType });
    console.log('📊 Data received:', JSON.stringify(req.body.data, null, 2));
    const { data, url, scrapeType = 'single' } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Product data is required'
      });
    }
    
    try {
      const exporter = new GoogleSheetsExporter();
      await exporter.initialize();
      
      // Use existing spreadsheet ID
      const spreadsheetId = '1GnfrLmXcQDVMxm0MFJnBLHt2fuYuQryddfL6aIA6hno';
      
      // Prepare data for export - use the original result format that convertResultToRow expects
      let exportResults = [];
      if (scrapeType === 'category' && data.products && Array.isArray(data.products)) {
        exportResults = data.products.filter(product => product.success);
        console.log(`📊 Filtering successful products: ${exportResults.length} out of ${data.products.length}`);
      } else {
        // For single product, create a result object in the expected format
        exportResults = [{
          success: true,
          url: url,
          data: data,
          timestamp: new Date().toISOString()
        }];
      }
      
      console.log('📊 Export data structure:', JSON.stringify(exportResults[0], null, 2));
      console.log(`📊 Total products to export: ${exportResults.length}`);
      await exporter.appendResults(spreadsheetId, exportResults);
      
      const productCount = exportResults.length;
      res.json({
        success: true,
        message: `${productCount} product(s) saved to Google Sheets successfully`,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      });
      
    } catch (sheetsError) {
      console.error('Google Sheets export error:', sheetsError);
      console.error('Full error stack:', sheetsError.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to export to Google Sheets. Please check your credentials.'
      });
    }
    
  } catch (error) {
    console.error('Sheets export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export to Google Sheets'
    });
  }
});

app.post('/api/export-excel', async (req, res) => {
  try {
    const { data, url, scrapeType = 'single' } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Product data is required'
      });
    }
    
    const excelFilePath = path.join(__dirname, 'exports', 'product-scrapes.xlsx');
    
    // Ensure exports directory exists
    const exportsDir = path.dirname(excelFilePath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    let workbook;
    let existingData = [];
    
    // Check if Excel file exists
    if (fs.existsSync(excelFilePath)) {
      // Load existing workbook
      workbook = XLSX.readFile(excelFilePath);
      if (workbook.Sheets['Products']) {
        existingData = XLSX.utils.sheet_to_json(workbook.Sheets['Products']);
      }
    } else {
      // Create new workbook
      workbook = XLSX.utils.book_new();
    }
    
    // Prepare the row data based on scrape type
    if (scrapeType === 'category' && data.products && Array.isArray(data.products)) {
      // For category scrapes, add each product as a separate row
      data.products.forEach(product => {
        if (product.success && product.data) {
          const rowData = {
            'URL': product.url || '',
            'Title': product.data.title || '',
            'Price': product.data.price || '',
            'Currency': product.data.currency || '',
            'Amount/Quantity': product.data.amount || '',
            'SKU': product.data.sku || '',
            'Availability': product.data.availability || '',
            'Primary Category': product.data.primaryCategory || '',
            'All Categories': Array.isArray(product.data.categories) ? product.data.categories.join(', ') : (product.data.categories || ''),
            'Description': (product.data.description || '').substring(0, 500),
            'Image URL': product.data.image || '',
            'Cable Type': product.data.cable_type || 'unknown',
            'Diameter (mm²)': product.data.diameter_mm2 || 'unknown',
            'Conductor Count': product.data.conductor_count || 'unknown',
            'Length (m)': product.data.length_meters || 'unknown',
            'Quantity per Unit': product.data.quantity_per_unit || 'unknown',
            'Outer Diameter (mm)': product.data.outer_diameter_mm || 'unknown',
            'Parsing Confidence': product.data.parsing_confidence ? `${Math.round(product.data.parsing_confidence * 100)}%` : 'unknown',
            'Scrape Status': 'Success',
            'Timestamp': new Date().toISOString()
          };
          existingData.push(rowData);
        }
      });
    } else {
      // For single product scrapes
      const rowData = {
        'URL': url || '',
        'Title': data.title || '',
        'Price': data.price || '',
        'Currency': data.currency || '',
        'Amount/Quantity': data.amount || '',
        'SKU': data.sku || '',
        'Availability': data.availability || '',
        'Primary Category': data.primaryCategory || '',
        'All Categories': Array.isArray(data.categories) ? data.categories.join(', ') : (data.categories || ''),
        'Description': (data.description || '').substring(0, 500),
        'Image URL': data.image || '',
        'Cable Type': data.cable_type || 'unknown',
        'Diameter (mm²)': data.diameter_mm2 || 'unknown',
        'Conductor Count': data.conductor_count || 'unknown',
        'Length (m)': data.length_meters || 'unknown',
        'Quantity per Unit': data.quantity_per_unit || 'unknown',
        'Outer Diameter (mm)': data.outer_diameter_mm || 'unknown',
        'Parsing Confidence': data.parsing_confidence ? `${Math.round(data.parsing_confidence * 100)}%` : 'unknown',
        'Scrape Status': 'Success',
        'Timestamp': new Date().toISOString()
      };
      existingData.push(rowData);
    }
    
    // Create new worksheet with updated data
    const worksheet = XLSX.utils.json_to_sheet(existingData);
    
    // Add/update worksheet
    workbook.Sheets['Products'] = worksheet;
    if (!workbook.SheetNames.includes('Products')) {
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    }
    
    // Write file
    XLSX.writeFile(workbook, excelFilePath);
    
    const productCount = scrapeType === 'category' ? data.productsScraped || 0 : 1;
    
    res.json({
      success: true,
      message: `${productCount} product(s) saved to Excel successfully`,
      filePath: excelFilePath
    });
    
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export to Excel'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🕷️  Product Scraper Web Interface`);
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  console.log(`📝 Open your browser and navigate to the URL above`);
});