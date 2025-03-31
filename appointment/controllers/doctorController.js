

// server/controllers/doctorController.js
const { db } = require('../db');

exports.getDoctors = (req, res) => {
  db.all('SELECT * FROM doctors', (err, doctors) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ doctors });
  });
};

exports.getDoctorAvailability = (req, res) => {
  const doctorId = req.params.id;
  
  const query = `
    SELECT * FROM time_slots 
    WHERE doctor_id = ? AND is_available = 1 
    AND datetime(start_time) > datetime('now')
    ORDER BY start_time
  `;
  
  db.all(query, [doctorId], (err, timeSlots) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ timeSlots });
  });
};
