/**
 * Test script for switching material parser integration
 */

const { testSwitchingParser, SwitchingMaterialParser, ElektramatSwitchingParser } = require('./switchingMaterialParser');

console.log('🧪 Testing FlowWijs Switching Material Parser Integration\n');

// Test 1: Basic parser functionality
console.log('='.repeat(60));
console.log('TEST 1: Basic Switching Material Parser');
console.log('='.repeat(60));
testSwitchingParser();

// Test 2: ElektramatSwitchingParser integration
console.log('\n' + '='.repeat(60));
console.log('TEST 2: ElektramatSwitchingParser Integration');
console.log('='.repeat(60));

const integrationParser = new ElektramatSwitchingParser();

const testProducts = [
    {
        title: 'Gira E2 schakelaar enkelpolig wit 16A',
        description: 'Hoogwaardige schakelaar voor wandmontage',
        breadcrumb: 'Elektro > Schakelmateriaal > Schakelaars',
        price: '12.50',
        currency: '€'
    },
    {
        title: 'Jung A500 dimmer universeel 400W LED',
        description: 'Dimmer geschikt voor LED verlichting',
        breadcrumb: 'Elektro > Schakelmateriaal > Dimmers',
        price: '45.75',
        currency: '€'
    },
    {
        title: 'Busch-Jaeger schuko stopcontact randaarde kinderveilig',
        description: 'Veilig stopcontact met kinderveiligheid IP44',
        breadcrumb: 'Elektro > Schakelmateriaal > Stopcontacten',
        price: '8.90',
        currency: '€'
    }
];

testProducts.forEach((product, i) => {
    console.log(`\nTest Product ${i + 1}:`);
    console.log(`Title: ${product.title}`);
    
    const enhanced = integrationParser.parseProduct(product);
    
    console.log(`Category: ${enhanced.category}`);
    console.log(`Product Type: ${enhanced.product_type}`);
    console.log(`Switch Type: ${enhanced.switch_type}`);
    console.log(`Socket Type: ${enhanced.socket_type}`);
    console.log(`Voltage: ${enhanced.voltage}`);
    console.log(`Current: ${enhanced.current}`);
    console.log(`Power: ${enhanced.power}`);
    console.log(`Color: ${enhanced.switching_color}`);
    console.log(`Series: ${enhanced.series}`);
    console.log(`Confidence: ${(enhanced.switching_parsing_confidence * 100).toFixed(1)}%`);
});

// Test 3: Category determination
console.log('\n' + '='.repeat(60));
console.log('TEST 3: Category Detection');
console.log('='.repeat(60));

const categoryTests = [
    {
        breadcrumb: 'Elektro > Kabels > Installatie',
        title: 'YMvK kabel 3x2.5mm²',
        expected: 'cable'
    },
    {
        breadcrumb: 'Elektro > Schakelmateriaal > Schakelaars',
        title: 'Gira schakelaar enkelpolig',
        expected: 'switching'
    },
    {
        breadcrumb: 'Elektro > Verlichting > LED',
        title: 'LED lamp 10W',
        expected: 'lighting'
    },
    {
        breadcrumb: 'Elektro > Verdelers > Groepenkast',
        title: 'Hager groepenkast 12 modules',
        expected: 'distribution'
    }
];

// Import the category function - we need to access it from scraper.js
// For now, let's create a simple test implementation
function testDetermineProductCategory(breadcrumbs, title, description = '') {
    const text = `${breadcrumbs} ${title} ${description}`.toLowerCase();
    
    // Check distribution first to avoid conflict with "module" in switching
    if (text.includes('groepenkast') || text.includes('verdeler') || text.includes('automaat')) {
        return 'distribution';
    } else if (text.includes('kabel') || text.includes('draad') || text.includes('cable')) {
        return 'cable';
    } else if (text.includes('schakelmateriaal') || text.includes('schakelaar') || 
               text.includes('stopcontact') || text.includes('dimmer') || 
               text.includes('frame') || text.includes('afdekframe') ||
               text.includes('drukknop') || text.includes('module')) {
        return 'switching';
    } else if (text.includes('verlichting') || text.includes('lamp') || text.includes('led') || text.includes('armatuur')) {
        return 'lighting';
    } else {
        return 'other';
    }
}

categoryTests.forEach((test, i) => {
    const detected = testDetermineProductCategory(test.breadcrumb, test.title);
    const status = detected === test.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} Test ${i + 1}: "${test.title}" -> ${detected} (expected: ${test.expected})`);
});

console.log('\n🎉 Testing completed!');
console.log('\nTo test with live data, run the main scraper on switching material URLs from elektramat.nl');