const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing client insertion...\n');

const testData = {
  name: 'Test Client',
  client_number: '999',
  contact_email: 'test@example.com',
  contact_phone: '555-1234',
  address: '123 Test St',
  city: 'TestCity',
  state: 'CA',
  zip_code: '12345'
};

console.log('Attempting to insert:', testData);

db.run(
  `INSERT INTO clients (name, client_number, contact_email, contact_phone, address, city, state, zip_code)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [testData.name, testData.client_number, testData.contact_email, testData.contact_phone,
   testData.address, testData.city, testData.state, testData.zip_code],
  function(err) {
    if (err) {
      console.error('❌ ERROR:', err.message);
      console.error('Full error:', err);
    } else {
      console.log('✅ SUCCESS! Client created with ID:', this.lastID);

      // Retrieve the client
      db.get('SELECT * FROM clients WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Error retrieving client:', err);
        } else {
          console.log('Retrieved client:', row);

          // Clean up - delete the test client
          db.run('DELETE FROM clients WHERE id = ?', [this.lastID], (err) => {
            if (err) {
              console.error('Error deleting test client:', err);
            } else {
              console.log('Test client deleted successfully');
            }
            db.close();
          });
        }
      });
    }
  }
);
