const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the database
const dbPath = path.join(__dirname, 'telemedicine.db');
console.log(`Checking database at: ${dbPath}`);

// Function to check file permissions
function checkFilePermissions() {
  if (fs.existsSync(dbPath)) {
    console.log('Database file exists');
    
    try {
      // Check if file is readable
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log('✅ File is readable');
    } catch (err) {
      console.log('❌ File is not readable:', err.message);
    }
    
    try {
      // Check if file is writable
      fs.accessSync(dbPath, fs.constants.W_OK);
      console.log('✅ File is writable');
    } catch (err) {
      console.log('❌ File is not writable:', err.message);
    }
    
    // Get file stats
    try {
      const stats = fs.statSync(dbPath);
      console.log('File size:', stats.size, 'bytes');
      console.log('File permissions:', stats.mode.toString(8));
      
      // Check if file is empty or potentially corrupted
      if (stats.size === 0) {
        console.log('⚠️ Warning: File exists but is empty (0 bytes)');
        console.log('Attempting to delete and recreate...');
        try {
          fs.unlinkSync(dbPath);
          console.log('✅ Deleted empty database file');
        } catch (err) {
          console.log('❌ Could not delete file:', err.message);
        }
      }
    } catch (err) {
      console.log('❌ Could not get file stats:', err.message);
    }
  } else {
    console.log('Database file does not exist yet - will be created on connection');
  }
}

// Function to attempt database connection
function testDatabaseConnection() {
  console.log('\nAttempting to connect to database...');
  
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.log('❌ Connection error:', err.message);
      console.log('Error code:', err.code);
      process.exit(1);
    }
    
    console.log('✅ Successfully connected to database');
    
    // Test creating a table
    db.run('CREATE TABLE IF NOT EXISTS _test_table (id INTEGER PRIMARY KEY, data TEXT)', (err) => {
      if (err) {
        console.log('❌ Failed to create test table:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('✅ Successfully created test table');
      
      // Test writing to the table
      db.run('INSERT INTO _test_table (data) VALUES (?)', ['test data ' + Date.now()], function(err) {
        if (err) {
          console.log('❌ Failed to insert data:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('✅ Successfully inserted data with ID', this.lastID);
        
        // Test reading from the table
        db.get('SELECT * FROM _test_table WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            console.log('❌ Failed to read data:', err.message);
          } else {
            console.log('✅ Successfully read data:', row);
          }
          
          // Cleanup
          db.run('DROP TABLE _test_table', (err) => {
            if (err) {
              console.log('⚠️ Warning: Could not clean up test table:', err.message);
            } else {
              console.log('✅ Cleaned up test table');
            }
            
            db.close(() => {
              console.log('✅ Database connection closed');
              console.log('\nDiagnosis complete. If all checks passed, your database should be working now.');
            });
          });
        });
      });
    });
  });
}

// Check permissions first
checkFilePermissions();

// Test database connection
testDatabaseConnection();