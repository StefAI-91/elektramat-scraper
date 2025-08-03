const { spawn } = require('child_process');

const child = spawn('node', ['index.js'], { 
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
});

let step = 0;

child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    if (output.includes('Enter choice (1-5)') && step === 0) {
        child.stdin.write('1\n');
        step = 1;
    } else if (output.includes('Enter product URL:') && step === 1) {
        child.stdin.write('https://www.elektramat.nl/gira-e2-afdekraam-1-5-voudig-zwart-mat-100109/#combinations\n');
        step = 2;
    } else if (output.includes('Choose export format:') && step === 2) {
        child.stdin.write('2\n'); // Google Sheets
        step = 3;
    } else if (output.includes('Enter spreadsheet name') && step === 3) {
        child.stdin.write('Product Scraper Results\n');
        step = 4;
    }
});

child.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
});

child.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
});