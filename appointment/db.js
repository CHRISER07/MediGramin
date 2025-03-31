const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'telemedicine.db'));

function initDatabase() {
  db.serialize(() => {
    // Create Doctors table
    db.run(
      `CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        email TEXT UNIQUE
      )`
    );

    // Create Time Slots table
    db.run(
      `CREATE TABLE IF NOT EXISTS time_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_available BOOLEAN DEFAULT 1,
        FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
      )`
    );

    // Create Appointments table
    db.run(
      `CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER,
        patient_name TEXT NOT NULL,
        patient_email TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        zoom_link TEXT,
        status TEXT DEFAULT 'Scheduled',
        FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE CASCADE
      )`
    );

    // Check if doctors table is empty
    db.get('SELECT COUNT(*) AS count FROM doctors', (err, row) => {
      if (err) {
        console.error('Error checking doctors table:', err);
        return;
      }

      if (row.count === 0) {
        importDoctorsAndSlots();
      }
    });
  });
}

// Function to insert sample doctors and generate time slots
function importDoctorsAndSlots() {
  const sampleDoctors = [
    { name: 'Dr. Sarah Johnson', specialty: 'General Practitioner', email: 'sjohnson@example.com' },
    { name: 'Dr. Michael Chen', specialty: 'Cardiologist', email: 'mchen@example.com' },
    { name: 'Dr. Emily Rodriguez', specialty: 'Pediatrician', email: 'erodriguez@example.com' }
  ];

  db.serialize(() => {
    const insertDoctor = db.prepare('INSERT INTO doctors (name, specialty, email) VALUES (?, ?, ?)');

    sampleDoctors.forEach(doctor => {
      insertDoctor.run(doctor.name, doctor.specialty, doctor.email, function (err) {
        if (err) {
          console.error('Error inserting doctor:', err);
        }
      });
    });

    insertDoctor.finalize(() => {
      console.log('Doctors inserted successfully.');

      // Fetch all doctor IDs
      db.all('SELECT id FROM doctors', (err, doctors) => {
        if (err) {
          console.error('Error fetching doctor IDs:', err);
          return;
        }

        const insertTimeSlot = db.prepare(
          'INSERT INTO time_slots (doctor_id, start_time, end_time) VALUES (?, ?, ?)'
        );

        doctors.forEach(({ id: doctor_id }) => {
          for (let day = 0; day < 7; day++) {
            const date = new Date();
            date.setDate(date.getDate() + day);
            date.setHours(9, 0, 0, 0); // Start at 9 AM

            for (let hour = 0; hour < 8; hour++) {
              const startTime = new Date(date);
              startTime.setHours(startTime.getHours() + hour);

              const endTime = new Date(startTime);
              endTime.setHours(endTime.getHours() + 1);

              insertTimeSlot.run(doctor_id, startTime.toISOString(), endTime.toISOString(), err => {
                if (err) console.error('Error inserting time slot:', err);
              });
            }
          }
        });

        insertTimeSlot.finalize(() => console.log('Time slots inserted successfully.'));
      });
    });
  });
}

// Function to get a doctor by ID
function getDoctorById(doctorId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM doctors WHERE id = ?', [doctorId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Function to get available time slots for a doctor
function getDoctorAvailability(doctorId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM time_slots WHERE doctor_id = ? AND is_available = 1 ORDER BY start_time',
      [doctorId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Export functions
module.exports = { initDatabase, db, getDoctorById, getDoctorAvailability };