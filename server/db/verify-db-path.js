const path = require('path');
const fs = require('fs');

// This is what database.js uses
const dbPath = path.join(__dirname, 'testtracking.db');

console.log('Expected database path:', dbPath);
console.log('Absolute path:', path.resolve(dbPath));
console.log('File exists:', fs.existsSync(dbPath));
console.log('File size:', fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 'N/A');

// Check for any other .db files
console.log('\nLooking for all .db files in server/db:');
const dbDir = __dirname;
const files = fs.readdirSync(dbDir);
files.forEach(file => {
  if (file.endsWith('.db')) {
    const fullPath = path.join(dbDir, file);
    const stats = fs.statSync(fullPath);
    console.log(`  ${file}: ${stats.size} bytes, modified: ${stats.mtime}`);
  }
});
