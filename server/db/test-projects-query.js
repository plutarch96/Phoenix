const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing the GET /api/projects SQL query...\n');

// First, check what's in the database
db.all('SELECT * FROM clients', (err, clients) => {
  console.log('Clients in DB:', clients);
});

db.all('SELECT * FROM projects', (err, projects) => {
  console.log('Projects in DB:', projects);
});

// Now test the exact query used in the route
const client_id = 1;
const query = `
  SELECT p.*, c.name as client_name, c.client_number,
         COUNT(DISTINCT t.id) as test_count
  FROM projects p
  LEFT JOIN clients c ON p.client_id = c.id
  LEFT JOIN tests t ON p.id = t.project_id
  WHERE p.client_id = ?
  GROUP BY p.id ORDER BY p.created_at DESC
`;

console.log('\nTesting query with client_id =', client_id);
console.log('Query:', query);

db.all(query, [client_id], (err, rows) => {
  if (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('Full error:', err);
  } else {
    console.log('\n✅ SUCCESS! Returned', rows.length, 'rows');
    console.log('Results:', JSON.stringify(rows, null, 2));
  }

  db.close();
});
