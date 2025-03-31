const express = require('express');
const router = express.Router();
const { db, getDoctorById, getDoctorAvailability } = require('../db');

// ✅ Get all doctors
router.get('/', (req, res) => {
  db.all('SELECT * FROM doctors', (err, doctors) => {
    if (err) {
      console.error('Error fetching doctors:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(doctors); // ✅ Send proper response code
  });
});

// ✅ Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10); // Ensure ID is a number
    if (isNaN(doctorId)) return res.status(400).json({ error: 'Invalid doctor ID' });

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (err) {
    console.error('Error fetching doctor:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Get doctor's available time slots
router.get('/:id/availability', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    if (isNaN(doctorId)) return res.status(400).json({ error: 'Invalid doctor ID' });

    const timeSlots = await getDoctorAvailability(doctorId);
    if (!timeSlots || timeSlots.length === 0) {
      return res.status(404).json({ error: 'No available time slots' });
    }
    res.status(200).json({ timeSlots });
  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;