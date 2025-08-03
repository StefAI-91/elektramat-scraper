const { scrapeProduct } = require('./scraper');

async function testEnhancedScraper() {
  console.log('🧪 Testing Enhanced Product Scraper with Reference Data');
  console.log('================================================');
  
  // Test with a Gira product from elektramat.nl
  const testUrl = 'https://www.elektramat.nl/gira-stopcontact-met-randaarde-1-voudig-systeem-55-zuiver-wit-glanzend-446603/';
  
  console.log(`🔍 Testing URL: ${testUrl}`);
  console.log('⏳ Scraping...');
  
  try {
    const result = await scrapeProduct(testUrl);
    
    if (result.success) {
      console.log('✅ Scraping successful!');
      console.log('\n📊 Enhanced Product Data:');
      console.log('========================');
      
      const data = result.data;
      
      // Basic fields
      console.log(`🏷️  Title: ${data.title}`);
      console.log(`🏢 Brand: ${data.brand || 'Not detected'}`);
      console.log(`💰 Price: ${data.currency}${data.price}`);
      console.log(`🏷️  SKU: ${data.sku}`);
      console.log(`🎨 Color: ${data.color || 'Not detected'}`);
      console.log(`🔩 Material: ${data.material || 'Not detected'}`);
      console.log(`📋 Availability: ${data.availability}`);
      
      // Categories
      if (data.categories && data.categories.length > 0) {
        console.log(`📂 Categories: ${data.categories.join(' > ')}`);
      }
      
      // Data quality
      if (data.dataQuality) {
        console.log(`📈 Data Quality: ${data.dataQuality.percentage}% (${data.dataQuality.score}/${data.dataQuality.maxScore})`);
        
        if (data.dataQuality.missingRequired.length > 0) {
          console.log(`❌ Missing Required: ${data.dataQuality.missingRequired.join(', ')}`);
        }
        
        if (data.dataQuality.missingOptional.length > 0) {
          console.log(`⚠️  Missing Optional: ${data.dataQuality.missingOptional.join(', ')}`);
        }
      }
      
      // Brand confidence
      if (data.brandConfidence) {
        console.log(`🎯 Brand Confidence: ${Math.round(data.brandConfidence * 100)}%`);
      }
      
      // Debug info
      console.log('\n🔧 Debug Information:');
      console.log('====================');
      console.log('Found selectors:', data.debug.foundSelectors);
      
      if (data.debug.missingFields.length > 0) {
        console.log('Missing fields:', data.debug.missingFields);
      }
      
    } else {
      console.log('❌ Scraping failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testEnhancedScraper();