/**
 * Debug script to test regex patterns
 */

// Test voltage regex
const testText = "Gira E2 enkelpolige schakelaar wit 16A 230V";
console.log(`Testing text: "${testText}"`);

// Test patterns individually
const voltagePattern = /(\d+)\s*[Vv](?:olt)?/g;
const currentPattern = /(\d+)\s*[Aa](?:mp|mpère)?/g;

console.log('\nVoltage pattern test:');
console.log('Pattern:', voltagePattern);
const voltageMatches = testText.match(voltagePattern);
console.log('Matches:', voltageMatches);

console.log('\nCurrent pattern test:');
console.log('Pattern:', currentPattern);
const currentMatches = testText.match(currentPattern);
console.log('Matches:', currentMatches);

// Test frame pattern
const frameText = "Jung A500 2-voudig afdekframe antraciet mat";
console.log(`\nTesting frame text: "${frameText}"`);

const framePattern = /(\d+)[-\s]?voudig/g;
console.log('Frame pattern:', framePattern);
const frameMatches = frameText.match(framePattern);
console.log('Frame matches:', frameMatches);

// Test IP pattern
const ipText = "EMAT schuko stopcontact met randaarde kinderveilig IP44";
console.log(`\nTesting IP text: "${ipText}"`);

const ipPattern = /\bip\s*(\d{2})\b/g;
console.log('IP pattern:', ipPattern);
const ipMatches = ipText.match(ipPattern);
console.log('IP matches:', ipMatches);

// Test power pattern
const powerText = "Berker S.1 dimmer LED 400W universeel wit glanzend";
console.log(`\nTesting power text: "${powerText}"`);

const powerPattern = /(\d+)\s*[Ww](?:att)?/g;
console.log('Power pattern:', powerPattern);
const powerMatches = powerText.match(powerPattern);
console.log('Power matches:', powerMatches);

// Test series pattern
const seriesText = "Gira E2 schakelaar";
console.log(`\nTesting series text: "${seriesText}"`);

const seriesPatterns = [
    /gira\s+(e2|e3|e22|event|esprit|classix|studio)/g,
    /jung\s+(a\d+|as\d+|cd\d+|ls\d+)/g,
    /berker\s+(\w+)/g,
    /\b(\w+\s+(?:serie|series|line))\b/g,
];

seriesPatterns.forEach((pattern, i) => {
    console.log(`Series pattern ${i+1}:`, pattern);
    const seriesMatches = seriesText.match(pattern);
    console.log(`Series matches ${i+1}:`, seriesMatches);
});