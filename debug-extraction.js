/**
 * Debug script to test extraction methods
 */

// Test voltage extraction
const testText = "Gira E2 enkelpolige schakelaar wit 16A 230V";
console.log(`Testing text: "${testText}"`);

const voltagePattern = /(\d+)\s*[Vv](?:olt)?/g;
console.log('\nVoltage extraction:');
console.log('Pattern:', voltagePattern);

// Method 1: Using match()
const voltageMatches = testText.match(voltagePattern);
console.log('Matches:', voltageMatches);

if (voltageMatches && voltageMatches[0]) {
    // Extract the number from the first match
    const numberMatch = voltageMatches[0].match(/\d+/);
    console.log('Number from first match:', numberMatch);
}

// Method 2: Using exec() for capture groups
voltagePattern.lastIndex = 0; // Reset regex
const voltageExec = voltagePattern.exec(testText);
console.log('Exec result:', voltageExec);

if (voltageExec && voltageExec[1]) {
    console.log('Capture group 1:', voltageExec[1]);
}

// Test current extraction  
const currentPattern = /(\d+)\s*[Aa](?:mp|mpère)?/g;
console.log('\nCurrent extraction:');
const currentExec = currentPattern.exec(testText);
console.log('Current exec result:', currentExec);

// Test frame extraction
const frameText = "Jung A500 2-voudig afdekframe antraciet mat";
const framePattern = /(\d+)[-\s]?voudig/g;
console.log('\nFrame extraction:');
const frameExec = framePattern.exec(frameText);
console.log('Frame exec result:', frameExec);

// Test IP extraction
const ipText = "EMAT schuko stopcontact met randaarde kinderveilig IP44";
const ipPattern = /\bip\s*(\d{2})\b/gi;
console.log('\nIP extraction:');
const ipExec = ipPattern.exec(ipText);
console.log('IP exec result:', ipExec);

// Test series extraction
const seriesText = "Gira E2 schakelaar";
const seriesPattern = /gira\s*(e2|e3|e22|event|esprit|classix|studio)/gi; 
console.log('\nSeries extraction:');
const seriesExec = seriesPattern.exec(seriesText);
console.log('Series exec result:', seriesExec);