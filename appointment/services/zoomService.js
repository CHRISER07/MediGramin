// // // server/services/zoomService.js
// // // This is a simplified mock service
// // exports.generateZoomLink = () => {
// //   // In a real implementation, this would call Zoom API to create a meeting
// //   const meetingId = Math.floor(100000000 + Math.random() * 900000000);
// //   const password = Math.random().toString(36).slice(2, 8);
  
// //   return `https://zoom.us/j/${meetingId}?pwd=${password}`;
// // };

// // zoomService.js - Integration with Zoom API
// const axios = require('axios');
// const jwt = require('jsonwebtoken');

// // Replace with your Zoom API credentials
// const ZOOM_API_KEY = 'your_zoom_api_key';
// const ZOOM_API_SECRET = 'your_zoom_api_secret';

// // Create a JWT token for Zoom API authentication
// const generateZoomJWT = () => {
//   const payload = {
//     iss: ZOOM_API_KEY,
//     exp: Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
//   };
  
//   return jwt.sign(payload, ZOOM_API_SECRET);
// };

// // Create a Zoom meeting and return the meeting details
// const createZoomMeeting = async (topic, startTime, duration = 30) => {
//   try {
//     const token = generateZoomJWT();
    
//     const response = await axios({
//       method: 'post',
//       url: 'https://api.zoom.us/v2/users/me/meetings',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       },
//       data: {
//         topic,
//         type: 2, // Scheduled meeting
//         start_time: startTime, // Format: 2023-07-25T10:00:00Z
//         duration,
//         timezone: 'UTC',
//         settings: {
//           host_video: true,
//           participant_video: true,
//           join_before_host: false,
//           mute_upon_entry: true,
//           waiting_room: true,
//           audio: 'both'
//         }
//       }
//     });
    
//     return {
//       id: response.data.id,
//       join_url: response.data.join_url,
//       password: response.data.password,
//       start_url: response.data.start_url
//     };
//   } catch (error) {
//     console.error('Error creating Zoom meeting:', error.response?.data || error.message);
//     throw new Error('Failed to create Zoom meeting');
//   }
// };

// // Update the appointment confirmation endpoint in server.js to use the Zoom API
// // Replace the generateZoomLink function with this:

// /*
// // In server.js, replace the mock generateZoomLink function with:
// const zoomService = require('./zoomService');

// async function generateZoomLink(appointment) {
//   try {
//     const appointmentDate = new Date(appointment.date);
//     const timeSlot = appointment.time_slot.split(':');
//     appointmentDate.setHours(parseInt(timeSlot[0]), parseInt(timeSlot[1]));
    
//     const isoTimeString = appointmentDate.toISOString();
    
//     // Get doctor and patient info for the meeting topic
//     const doctor = await db.get('SELECT name FROM doctors WHERE id = ?', [appointment.doctor_id]);
//     const patient = await db.get('SELECT name FROM patients WHERE id = ?', [appointment.patient_id]);
    
//     const meetingTopic = `Medical Consultation: Dr. ${doctor.name} with ${patient.name}`;
    
//     const zoomMeeting = await zoomService.createZoomMeeting(meetingTopic, isoTimeString, 30);
    
//     return zoomMeeting.join_url;
//   } catch (error) {
//     console.error('Error generating Zoom link:', error);
//     return 'https://zoom.us/j/placeholder-link';
//   }
// }
// */

// module.exports = {
//   createZoomMeeting
// };

require('dotenv').config();
const axios = require('axios');

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

// ✅ Generate OAuth Access Token
const getZoomAccessToken = async () => {
  try {
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: ZOOM_ACCOUNT_ID,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Zoom Access Token:', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error('🚨 Error getting Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom access token');
  }
};

// ✅ Create a Zoom Meeting Using OAuth
const generateZoomLink = async (topic, startTime, duration = 30) => {
  try {
    const token = await getZoomAccessToken(); // Get OAuth token

    console.log('🔗 Using Zoom Token:', token); // Debugging

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime, // Format: "YYYY-MM-DDTHH:mm:ssZ"
        duration,
        timezone: 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          audio: 'both',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Use OAuth token
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      join_url: response.data.join_url, // Patient's Zoom link
      password: response.data.password,
      start_url: response.data.start_url, // Doctor's Zoom link
    };
  } catch (error) {
    console.error('🚨 Error creating Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
};

module.exports = { generateZoomLink };
