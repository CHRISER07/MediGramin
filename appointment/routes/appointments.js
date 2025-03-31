const express = require('express');
const router = express.Router();
const { 
  getAppointments, 
  getAppointmentById,  
  createAppointment, 
  updateAppointment, 
  deleteAppointment 
} = require('../controllers/appointmentController'); 

// ✅ Fetch all appointments
router.get('/', getAppointments);

// ✅ Fetch a single appointment by ID (with validation)
router.get('/:id', (req, res, next) => {
  if (isNaN(req.params.id)) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }
  next();
}, getAppointmentById);

// ✅ Create a new appointment
router.post('/', createAppointment);

// ✅ Update an appointment by ID
router.put('/:id', updateAppointment);

// ✅ Delete an appointment by ID
router.delete('/:id', deleteAppointment);

module.exports = router;