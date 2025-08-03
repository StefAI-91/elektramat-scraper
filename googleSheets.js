const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsExporter {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.credentialsPath = path.join(__dirname, 'config', 'credentials.json');
  }

  // Convert column number to Excel column letters (1=A, 26=Z, 27=AA, etc.)
  numberToColumn(num) {
    let result = '';
    while (num > 0) {
      num--; // Make it 0-based
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  async initialize() {
    try {
      // Check if credentials file exists
      if (!fs.existsSync(this.credentialsPath)) {
        throw new Error(`Credentials file not found at ${this.credentialsPath}. Please follow the setup instructions.`);
      }

      // Load credentials
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath));
      
      // Create JWT auth
      this.auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      // Initialize Sheets API
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('✅ Google Sheets API initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets API:', error.message);
      return false;
    }
  }

  async createSpreadsheet(title = 'Product Scraper Results') {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets API not initialized. Call initialize() first.');
      }

      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `${title} - ${new Date().toISOString().split('T')[0]}`
          }
        }
      });

      const spreadsheetId = response.data.spreadsheetId;
      console.log(`✅ Created new spreadsheet: ${response.data.properties.title}`);
      console.log(`📄 Spreadsheet URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
      
      return spreadsheetId;
    } catch (error) {
      console.error('❌ Failed to create spreadsheet:', error.message);
      throw error;
    }
  }

  getCableHeaders() {
    return [
      'Category_Source_URL',
      'Product_URL',
      'Title',
      'Brand',
      'Price',
      'Currency',
      'Amount/Quantity',
      'SKU',
      'GTIN13',
      'Availability',
      'Delivery Time',
      'Primary Category',
      'All Categories',
      'Description',
      'Color',
      'Material',
      'Image URL',
      'Cable Type',
      'Cable Category',
      'Diameter (mm²)',
      'Conductor Count',
      'Length (m)',
      'Quantity per Unit',
      'Outer Diameter (mm)',
      'Data Speed',
      'Packaging Format',
      'Parsing Confidence',
      'Data Quality %',
      'Scrape Status',
      'Scraped Date'
    ];
  }

  getGrondkabelHeaders() {
    return [
      'Category_Source_URL',
      'Product_URL', 
      'Title',
      'Brand',
      'Price',
      'Currency',
      'Amount/Quantity',
      'SKU',
      'GTIN13',
      'Availability',
      'Delivery Time',
      'Description',
      'Material',
      'Image URL',
      'Cable Type',
      'Conductor Count',
      'Diameter (mm²)', 
      'Length (m)',
      'Outer Diameter (mm)',
      'Voltage Rating',
      'Packaging Format',
      'Parsing Confidence',
      'Scrape Status',
      'Scraped Date'
    ];
  }

  getNetwerkkabelHeaders() {
    return [
      'Category_Source_URL',
      'Product_URL',
      'Title', 
      'Brand',
      'Price',
      'Currency',
      'Amount/Quantity',
      'SKU',
      'GTIN13',
      'Availability',
      'Delivery Time',
      'Description',
      'Material',
      'Image URL',
      'Cable Type',
      'Network Category',
      'Shielding Type',
      'Length (m)',
      'Conductor Count',
      'Data Speed',
      'Bandwidth',
      'Packaging Format',
      'Parsing Confidence',
      'Scrape Status',
      'Scraped Date'
    ];
  }

  getAVKabelHeaders() {
    return [
      'Category_Source_URL',
      'Product_URL',
      'Title',
      'Brand', 
      'Price',
      'Currency',
      'Amount/Quantity',
      'SKU',
      'Availability',
      'Description',
      'Image URL',
      'Cable Type',
      'AV Standard',
      'Length (m)',
      'Connector Type',
      'Resolution Support',
      'Impedance',
      'Parsing Confidence',
      'Scrape Status',
      'Scraped Date'
    ];
  }

  getIndustrieleKabelHeaders() {
    return [
      'Category_Source_URL',
      'Product_URL',
      'Title',
      'Brand',
      'Price', 
      'Currency',
      'Amount/Quantity',
      'SKU',
      'Availability',
      'Description',
      'Image URL',
      'Cable Type',
      'Industrial Type',
      'Conductor Count',
      'Diameter (mm²)',
      'Length (m)',
      'Voltage Rating',
      'Temperature Rating',
      'Special Features',
      'Parsing Confidence',
      'Scrape Status',
      'Scraped Date'
    ];
  }

  getSwitchingHeaders() {
    return [
      'URL',
      'Title',
      'Brand',
      'Price',
      'Currency',
      'Amount/Quantity',
      'SKU',
      'Availability',
      'Primary Category',
      'All Categories',
      'Description',
      'Color',
      'Material',
      'Image URL',
      'Product Type',
      'Switch Type',
      'Socket Type',
      'Voltage (V)',
      'Current (A)',
      'Power (W)',
      'Poles',
      'Frame Slots',
      'Mounting Depth (mm)',
      'Switching Color',
      'Series',
      'LED Indication',
      'Child Protection',
      'IP Rating',
      'Smart Compatible',
      'Switching Quantity',
      'Includes Frame',
      'Parsing Confidence',
      'Data Quality %',
      'Scrape Status',
      'Timestamp'
    ];
  }

  async setupHeaders(spreadsheetId, sheetName = 'Sheet1') {
    try {
      let headers;
      
      // Determine headers based on sheet name
      if (sheetName === 'Kabels') {
        headers = this.getCableHeaders();
      } else if (sheetName === 'Schakelmateriaal') {
        headers = this.getSwitchingHeaders();
      } else {
        // Default to cable headers for backward compatibility
        headers = this.getCableHeaders();
      }

      // Add headers - dynamic range based on header count
      const endColumn = this.numberToColumn(headers.length);
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:${endColumn}1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers]
        }
      });

      // Format headers (bold, background color) - dynamic column count
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: headers.length
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.2,
                      green: 0.6,
                      blue: 0.2
                    },
                    textFormat: {
                      bold: true,
                      foregroundColor: {
                        red: 1,
                        green: 1,
                        blue: 1
                      }
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: headers.length
                }
              }
            }
          ]
        }
      });

      console.log('✅ Headers set up successfully');
    } catch (error) {
      console.error('❌ Failed to setup headers:', error.message);
      throw error;
    }
  }

  convertCableResultToRow(result, categorySourceUrl = '') {
    const data = result.data || {};
    
    // Handle categories safely
    let categoriesString = '';
    if (data.categories) {
      if (Array.isArray(data.categories)) {
        categoriesString = data.categories.join(', ');
      } else if (typeof data.categories === 'string') {
        categoriesString = data.categories;
      }
    }
    
    return [
      categorySourceUrl || '',
      result.url || '',
      data.title || '',
      data.brand || '',
      data.price || '',
      data.currency || '',
      data.amount || '',
      data.sku || '',
      data.gtin13 || '',
      data.availability || '',
      data.delivery_time || '',
      data.primaryCategory || '',
      categoriesString,
      (data.description || '').substring(0, 500), // Limit description length
      data.color || '',
      data.material || '',
      data.image || '',
      data.cable_type || 'unknown',
      data.cable_category || 'unknown',
      data.diameter_mm2 || 'unknown',
      data.conductor_count || 'unknown',
      data.length_meters || 'unknown',
      data.quantity_per_unit || 'unknown',
      data.outer_diameter_mm || 'unknown',
      data.data_speed || '',
      data.packaging_format || '',
      data.parsing_confidence ? `${Math.round(data.parsing_confidence * 100)}%` : 'unknown',
      data.dataQuality ? `${data.dataQuality.percentage}%` : '',
      result.success ? 'Success' : 'Failed',
      new Date().toISOString()
    ];
  }

  convertGrondkabelToRow(result, categorySourceUrl = '') {
    const data = result.data || {};
    
    return [
      categorySourceUrl || '',
      result.url || '',
      data.title || '',
      data.brand || '',
      data.price || '',
      data.currency || '',
      data.amount || '',
      data.sku || '',
      data.gtin13 || '',
      data.availability || '',
      data.delivery_time || '',
      (data.description || '').substring(0, 500),
      data.material || '',
      data.image || '',
      data.cable_type || 'unknown',
      data.conductor_count || 'unknown',
      data.diameter_mm2 || 'unknown',
      data.length_meters || 'unknown',
      data.outer_diameter_mm || 'unknown',
      data.voltage_rating || 'unknown',
      data.packaging_format || '',
      data.parsing_confidence ? `${Math.round(data.parsing_confidence * 100)}%` : 'unknown',
      result.success ? 'Success' : 'Failed',
      new Date().toISOString()
    ];
  }

  convertNetwerkkabelToRow(result, categorySourceUrl = '') {
    const data = result.data || {};
    
    return [
      categorySourceUrl || '',
      result.url || '',
      data.title || '',
      data.brand || '',
      data.price || '',
      data.currency || '',
      data.amount || '',
      data.sku || '',
      data.gtin13 || '',
      data.availability || '',
      data.delivery_time || '',
      (data.description || '').substring(0, 500),
      data.material || '',
      data.image || '',
      data.cable_type || 'unknown',
      data.network_category || 'unknown',
      data.shielding_type || 'unknown',
      data.length_meters || 'unknown',
      data.conductor_count || 'unknown',
      data.data_speed || '',
      data.bandwidth || 'unknown',
      data.packaging_format || '',
      data.parsing_confidence ? `${Math.round(data.parsing_confidence * 100)}%` : 'unknown',
      result.success ? 'Success' : 'Failed',
      new Date().toISOString()
    ];
  }

  convertSwitchingResultToRow(result) {
    const data = result.data || {};
    
    // Handle categories safely
    let categoriesString = '';
    if (data.categories) {
      if (Array.isArray(data.categories)) {
        categoriesString = data.categories.join(', ');
      } else if (typeof data.categories === 'string') {
        categoriesString = data.categories;
      }
    }
    
    return [
      result.url || '',
      data.title || '',
      data.brand || '',
      data.price || '',
      data.currency || '',
      data.amount || '',
      data.sku || '',
      data.availability || '',
      data.primaryCategory || '',
      categoriesString,
      (data.description || '').substring(0, 500), // Limit description length
      data.color || '',
      data.material || '',
      data.image || '',
      data.product_type || 'unknown',
      data.switch_type || 'unknown',
      data.socket_type || 'unknown',
      data.voltage || 'unknown',
      data.current || 'unknown',
      data.power || 'unknown',
      data.poles || 'unknown',
      data.frame_slots || 'unknown',
      data.mounting_depth || 'unknown',
      data.switching_color || 'unknown',
      data.series || 'unknown',
      data.led_indication !== null ? data.led_indication : 'unknown',
      data.child_protection !== null ? data.child_protection : 'unknown',
      data.ip_rating || 'unknown',
      data.smart_compatible !== null ? data.smart_compatible : 'unknown',
      data.switching_quantity || 'unknown',
      data.includes_frame !== null ? data.includes_frame : 'unknown',
      data.switching_parsing_confidence ? `${Math.round(data.switching_parsing_confidence * 100)}%` : 'unknown',
      data.dataQuality ? `${data.dataQuality.percentage}%` : '',
      result.success ? 'Success' : 'Failed',
      result.timestamp || new Date().toISOString()
    ];
  }

  convertResultToRow(result, sheetType = 'cable', categorySourceUrl = '') {
    try {
      console.log(`🔍 Converting result to row for ${sheetType} sheet`);
      
      if (sheetType === 'switching') {
        return this.convertSwitchingResultToRow(result);
      } else if (sheetType === 'grondkabel') {
        return this.convertGrondkabelToRow(result, categorySourceUrl);
      } else if (sheetType === 'netwerkkabel') {
        return this.convertNetwerkkabelToRow(result, categorySourceUrl);
      } else {
        return this.convertCableResultToRow(result, categorySourceUrl);
      }
    } catch (error) {
      console.error('❌ Error converting result to row:', error);
      console.error('Problem result:', result);
      throw error;
    }
  }

  async ensureCorrectHeaders(spreadsheetId, sheetName) {
    try {
      // Clear any existing data in the entire first row to ensure clean start
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!1:1`
      });
      
      // Get correct headers based on sheet type
      let headers;
      switch (sheetName) {
        case 'Grondkabels':
          headers = this.getGrondkabelHeaders();
          break;
        case 'Netwerkkabels':
          headers = this.getNetwerkkabelHeaders();
          break;
        case 'AV_Kabels':
          headers = this.getAVKabelHeaders();
          break;
        case 'Industriele_Kabels':
          headers = this.getIndustrieleKabelHeaders();
          break;
        case 'Installatiekabels':
        case 'Kabels': // Legacy support
          headers = this.getCableHeaders();
          break;
        case 'Schakelmateriaal':
          headers = this.getSwitchingHeaders();
          break;
        default:
          headers = this.getCableHeaders(); // Default fallback
      }
      
      // Dynamic range based on header count
      const endColumn = this.numberToColumn(headers.length);
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:${endColumn}1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers]
        }
      });
      
      // Also clear any stray data in columns beyond our range to prevent confusion
      const clearStartColumn = String.fromCharCode(65 + headers.length); // Next column after our data
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!${clearStartColumn}:ZZ`
      });
      
      console.log(`✅ Headers set correctly for ${sheetName} sheet (${headers.length} columns), cleared any stray data`);
    } catch (error) {
      console.log('Note: Could not reset headers:', error.message);
    }
  }

  determineSheetName(results) {
    // Convert to array if single result
    const resultsArray = Array.isArray(results) ? results : [results];
    
    // First check if this is a cable product
    const cableResult = resultsArray.find(result => {
      return result.data && result.data.category === 'cable';
    });
    
    if (cableResult) {
      // Determine specific cable category sheet
      const cableCategory = cableResult.data.cable_category;
      const productTitle = cableResult.data.title || '';
      
      console.log(`🔍 Cable detected: "${productTitle}" - Category: ${cableCategory}`);
      
      switch (cableCategory) {
        case 'ground':
          console.log(`  🌍 Ground cable → Grondkabels`);
          return 'Grondkabels';
        case 'network':
          console.log(`  🌐 Network cable → Netwerkkabels`);
          return 'Netwerkkabels';
        case 'av':
          console.log(`  📺 AV cable → AV_Kabels`);
          return 'AV_Kabels';
        case 'industrial':
          console.log(`  🏭 Industrial cable → Industriele_Kabels`);
          return 'Industriele_Kabels';
        case 'installation':
        case 'neopreen':
        case 'wire':
        case 'household':
        case 'legacy':
        default:
          console.log(`  ⚡ Installation/General cable → Installatiekabels`);
          return 'Installatiekabels';
      }
    }
    
    // Check for switching materials
    const switchingResult = resultsArray.find(result => {
      return result.data && result.data.category === 'switching';
    });
    
    if (switchingResult) {
      console.log(`  🔌 Switching material → Schakelmateriaal`);
      return 'Schakelmateriaal';
    }
    
    // Fallback for unknown products
    console.log(`  ❓ Unknown product type → Overige_Producten`);
    return 'Overige_Producten';
  }

  async ensureSheetExists(spreadsheetId, sheetName) {
    try {
      // Get current sheets
      const metadata = await this.sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = metadata.data.sheets.map(sheet => sheet.properties.title);
      
      // If sheet doesn't exist, create it
      if (!existingSheets.includes(sheetName)) {
        console.log(`📄 Creating new sheet: ${sheetName}`);
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          }
        });
        console.log(`✅ Created sheet: ${sheetName}`);
        
        // Set up headers for the new sheet
        await this.ensureCorrectHeaders(spreadsheetId, sheetName);
      }
      
      // If this is the first time we're seeing 'Schakelmateriaal', rename the default sheet
      if (sheetName === 'Schakelmateriaal' && existingSheets.includes('Blad1')) {
        console.log(`🔄 Renaming 'Blad1' to 'Schakelmateriaal'`);
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              updateSheetProperties: {
                properties: {
                  sheetId: 0, // Default sheet ID is usually 0
                  title: 'Schakelmateriaal'
                },
                fields: 'title'
              }
            }]
          }
        });
        console.log(`✅ Renamed 'Blad1' to 'Schakelmateriaal'`);
      }
      
    } catch (error) {
      console.error('❌ Error ensuring sheet exists:', error.message);
      throw error;
    }
  }

  async appendResults(spreadsheetId, results, sheetName = null) {
    try {
      // If no sheet name provided, determine sheet based on product type
      if (!sheetName) {
        sheetName = this.determineSheetName(results);
        console.log(`Auto-determined sheet: ${sheetName}`);
      }
      
      // Ensure the target sheet exists
      await this.ensureSheetExists(spreadsheetId, sheetName);

      if (!Array.isArray(results)) {
        results = [results];
      }

      // Determine sheet type for proper row conversion
      let sheetType = 'cable';
      if (sheetName === 'Schakelmateriaal') {
        sheetType = 'switching';
      } else if (sheetName === 'Grondkabels') {
        sheetType = 'grondkabel';
      } else if (sheetName === 'Netwerkkabels') {
        sheetType = 'netwerkkabel';
      }
      
      // Extract category source URL from results if available
      const categorySourceUrl = results[0]?.categorySourceUrl || '';
      
      const rows = results.map(result => this.convertResultToRow(result, sheetType, categorySourceUrl));
      
      // Check if headers exist, if not set them up
      const headerRange = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`
      });
      
      if (!headerRange.data.values || headerRange.data.values.length === 0) {
        console.log('🔧 Setting up headers for new sheet...');
        await this.ensureCorrectHeaders(spreadsheetId, sheetName);
      } else {
        console.log('✅ Headers already exist, appending to existing data');
      }
      
      // Batch processing for large datasets
      const BATCH_SIZE = 25; // Google Sheets can handle about 25-50 rows per request safely
      let totalAdded = 0;
      
      console.log(`📊 Processing ${rows.length} rows in batches of ${BATCH_SIZE}...`);
      
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        
        try {
          // Find the next available row explicitly
          const dataRange = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:A`
          });
          
          const nextRow = (dataRange.data.values?.length || 0) + 1;
          
          // Dynamic column range based on sheet type
          const headers = sheetName === 'Kabels' ? this.getCableHeaders() : this.getSwitchingHeaders();
          const endColumn = this.numberToColumn(headers.length);
          const targetRange = `${sheetName}!A${nextRow}:${endColumn}${nextRow + batch.length - 1}`;
          
          console.log(`📤 Targeting specific range: ${targetRange}`);
          console.log(`📤 Batch contains ${batch.length} rows, first row has ${batch[0]?.length} columns`);
          
          const response = await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: targetRange,
            valueInputOption: 'RAW',
            requestBody: {
              values: batch
            }
          });
          
          console.log(`📤 Response: ${response.data?.updatedRange || 'No range info'}`);
          totalAdded += batch.length;
          console.log(`✅ Added batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)} (${totalAdded}/${rows.length} rows)`);
          
          // Add a small delay between batches to avoid rate limiting
          if (i + BATCH_SIZE < rows.length) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          }
        } catch (batchError) {
          console.error(`❌ Failed to add batch starting at row ${i + 1}:`, batchError.message);
          throw batchError;
        }
      }

      console.log(`✅ Successfully added all ${totalAdded} rows to spreadsheet`);
      return { updatedRows: totalAdded };
    } catch (error) {
      console.error('❌ Failed to append results:', error.message);
      throw error;
    }
  }

  async exportToNewSheet(results, title = 'Product Scraper Results') {
    try {
      // Create new spreadsheet
      const spreadsheetId = await this.createSpreadsheet(title);
      
      // Setup headers
      await this.setupHeaders(spreadsheetId);
      
      // Add data
      await this.appendResults(spreadsheetId, results);
      
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      console.log(`\n🎉 Export completed successfully!`);
      console.log(`📊 ${Array.isArray(results) ? results.length : 1} products exported`);
      console.log(`🔗 Access your spreadsheet: ${spreadsheetUrl}`);
      
      return {
        spreadsheetId,
        spreadsheetUrl,
        success: true
      };
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportToExistingSheet(spreadsheetId, results, sheetName = 'Sheet1') {
    try {
      // Check if spreadsheet exists and is accessible
      await this.sheets.spreadsheets.get({ spreadsheetId });
      
      // Append data
      await this.appendResults(spreadsheetId, results, sheetName);
      
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      console.log(`\n🎉 Export completed successfully!`);
      console.log(`📊 ${Array.isArray(results) ? results.length : 1} products exported`);
      console.log(`🔗 Access your spreadsheet: ${spreadsheetUrl}`);
      
      return {
        spreadsheetId,
        spreadsheetUrl,
        success: true
      };
    } catch (error) {
      console.error('❌ Export to existing sheet failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractSpreadsheetId(input) {
    // If it's already just an ID
    if (input.match(/^[a-zA-Z0-9-_]{44}$/)) {
      return input;
    }
    
    // Extract from Google Sheets URL
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async testConnection() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }

      // Try to create a test spreadsheet
      const testSheet = await this.createSpreadsheet('Test Connection - Delete Me');
      
      if (testSheet) {
        console.log('✅ Google Sheets connection test successful!');
        console.log('💡 You can delete the test spreadsheet if you want.');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = GoogleSheetsExporter;