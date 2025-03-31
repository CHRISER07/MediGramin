const { db } = require('../db');
const { generateZoomLink } = require('../services/zoomService');

exports.getAppointments = (req, res) => {
  const query = `
    SELECT a.*, d.name as doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY datetime(a.start_time)
  `;
  
  db.all(query, (err, appointments) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ appointments });
  });
};

exports.getAppointmentById = (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }

  const query = `
    SELECT a.*, d.name as doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = ?
  `;

  db.get(query, [id], (err, appointment) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json({ appointment });
  });
};

exports.createAppointment = async (req, res) => {
  const { doctor_id, patient_name, patient_email, start_time, end_time } = req.body;
  
  if (!doctor_id || !patient_name || !patient_email || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.get(
    'SELECT id FROM time_slots WHERE doctor_id = ? AND start_time = ? AND is_available = 1',
    [doctor_id, start_time],
    async (err, timeSlot) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!timeSlot) {
        return res.status(400).json({ error: 'Time slot is not available' });
      }

      try {
        const zoomLink = await generateZoomLink();
        console.log("Generated Zoom Link:", zoomLink);

        const insertQuery = `
          INSERT INTO appointments (doctor_id, patient_name, patient_email, start_time, end_time, zoom_link, status)
          VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
        `;

        db.run(insertQuery, 
          [doctor_id, patient_name, patient_email, start_time, end_time, zoomLink], 
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            db.run('UPDATE time_slots SET is_available = 0 WHERE doctor_id = ? AND start_time = ?', 
              [doctor_id, start_time]);

            db.get('SELECT name FROM doctors WHERE id = ?', [doctor_id], (err, doctor) => {
              if (err) {
                console.error(err);
              }

              const appointmentId = this.lastID;
              const confirmationMessage = `You have scheduled an appointment with ${doctor ? doctor.name : 'your doctor'} at ${new Date(start_time).toLocaleString()}. Please join through this link: ${zoomLink?.join_url || 'Zoom link not available'}`;

              res.status(201).json({ 
                appointment_id: appointmentId,
                zoom_link: zoomLink,
                confirmation_message: confirmationMessage
              });
            });
          }
        );
      } catch (error) {
        console.error("Zoom API Error:", error);
        return res.status(500).json({ error: "Failed to generate Zoom link" });
      }
    }
  );
};

exports.updateAppointment = (req, res) => {
  const appointmentId = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  if (!['Scheduled', 'Completed', 'Canceled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  db.run('UPDATE appointments SET status = ? WHERE id = ?', 
    [status, appointmentId], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      if (status === 'Canceled') {
        db.get('SELECT doctor_id, start_time FROM appointments WHERE id = ?', 
          [appointmentId], 
          (err, appointment) => {
            if (!err && appointment) {
              db.run('UPDATE time_slots SET is_available = 1 WHERE doctor_id = ? AND start_time = ?', 
                [appointment.doctor_id, appointment.start_time]);
            }
          }
        );
      }
      
      res.json({ message: 'Appointment updated successfully' });
    }
  );
};

exports.deleteAppointment = (req, res) => {
  const appointmentId = req.params.id;
  
  db.get('SELECT doctor_id, start_time FROM appointments WHERE id = ?', 
    [appointmentId], 
    (err, appointment) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      db.run('DELETE FROM appointments WHERE id = ?', 
        [appointmentId], 
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          db.run('UPDATE time_slots SET is_available = 1 WHERE doctor_id = ? AND start_time = ?', 
            [appointment.doctor_id, appointment.start_time]);
          
          res.json({ message: 'Appointment canceled successfully' });
        }
      );
    }
  );
};
