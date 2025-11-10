const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding document_category column to project_media table...');

db.serialize(() => {
  // Add document_category column if it doesn't exist
  db.run(`
    ALTER TABLE project_media
    ADD COLUMN document_category TEXT DEFAULT 'client_documents'
  `, (err) => {
    if (err) {
      // Check if column already exists
      if (err.message.includes('duplicate column name')) {
        console.log('✓ Column document_category already exists');
      } else {
        console.error('Error adding document_category column:', err);
      }
    } else {
      console.log('✓ Column document_category added successfully');
    }
  });

  // Create index for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_project_media_document_category
    ON project_media(document_category)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
    } else {
      console.log('✓ Index created on document_category');
      console.log('\nMigration completed successfully!');
      console.log('\nAvailable document categories:');
      console.log('  - test_plan: Test plans and test procedures');
      console.log('  - purchase_order: Purchase orders and invoices');
      console.log('  - proposal: Proposals and quotes');
      console.log('  - nda: Non-disclosure agreements');
      console.log('  - client_documents: Documents visible to clients (default)');
    }

    db.close();
  });
});
