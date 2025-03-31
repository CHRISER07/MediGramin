const { db } = require('../db');

// ✅ Get available time slots for a doctor
exports.getTimeSlotsByDoctor = (req, res) => {
  const doctorId = req.params.id;

  if (!doctorId || isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID" });
  }

  const query = `
    SELECT * FROM time_slots 
    WHERE doctor_id = ? AND is_available = 1 
    ORDER BY start_time
  `;

  db.all(query, [doctorId], (err, slots) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ slots });
  });
};

// ✅ Get a specific time slot by ID (IMPORTANT: This fixes the 404 error)
exports.getTimeSlotById = (req, res) => {
  const timeSlotId = req.params.id;

  if (!timeSlotId || isNaN(timeSlotId)) {
    return res.status(400).json({ error: "Invalid time slot ID" });
  }

  db.get('SELECT * FROM time_slots WHERE id = ?', [timeSlotId], (err, slot) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!slot) {
      return res.status(404).json({ error: "Time slot not found" });
    }
    res.json(slot);
  });
};
