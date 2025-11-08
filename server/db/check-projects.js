const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Database Check: Projects ===\n');

// Get all clients
db.all('SELECT * FROM clients', (err, clients) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  console.log(`Found ${clients.length} client(s):`);
  clients.forEach(c => {
    console.log(`  - Client #${c.client_number}: ${c.name} (ID: ${c.id})`);
  });

  console.log('\n=== Projects ===\n');

  // Get all projects
  db.all('SELECT * FROM projects', (err, projects) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    console.log(`Found ${projects.length} project(s):`);

    if (projects.length === 0) {
      console.log('  (No projects in database)');
    } else {
      projects.forEach(p => {
        const client = clients.find(c => c.id === p.client_id);
        console.log(`  - Project #${p.project_number}: ${p.project_name}`);
        console.log(`    Client ID: ${p.client_id} (${client?.name || 'Unknown'})`);
        console.log(`    Status: ${p.status}`);
        console.log(`    Created: ${p.created_at}`);
        console.log('');
      });
    }

    db.close();
  });
});
