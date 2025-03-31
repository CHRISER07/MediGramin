const express = require('express'); 
const cors = require('cors'); 
require('dotenv').config();

const app = express();  
const PORT = process.env.PORT || 5000;  

// Middleware  
app.use(cors());  
app.use(express.json());  

// ✅ Import API routes  
const doctorRoutes = require('./routes/doctors');  
const appointmentRoutes = require('./routes/appointments');  
const zoomRoutes = require('./routes/zoom');  // ✅ Zoom Routes  
const timeSlotRoutes = require('./routes/timeSlots');  

// ✅ Use API routes  
app.use('/api/doctors', doctorRoutes);  
app.use('/api/appointments', appointmentRoutes);  
app.use('/api/time_slots', timeSlotRoutes);  
app.use('/api/zoom', zoomRoutes);  // ✅ Register Zoom API routes  

// Handle undefined routes  
app.use((req, res) => {  
  res.status(404).json({ error: "API route not found" });  
});  

app.get('/', (req, res) => {
  res.send("Welcome to the Teleconsultation API");
});


// ✅ Start the server  
app.listen(PORT, () => {  
  console.log(`✅ Server running on http://localhost:${PORT}`);  
});
