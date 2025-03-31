const express = require('express');
const router = express.Router();
const { getTimeSlotsByDoctor, getTimeSlotById } = require('../controllers/timeSlotController');

// ✅ Get available time slots for a doctor
router.get('/doctor/:id', getTimeSlotsByDoctor);

// ✅ Get a specific time slot by ID (This fixes your error!)
router.get('/:id', getTimeSlotById);

module.exports = router;