// // server/controllers/zoomController.js
// const { generateZoomLink } = require('../services/zoomService');

// exports.generateZoomLink = (req, res) => {
//   const zoomLink = generateZoomLink();
//   res.json({ zoom_link: zoomLink });
// };

const { createZoomMeeting } = require('../services/zoomService');

exports.generateZoomLink = async (req, res) => {
  try {
    const { doctorName, patientName, startTime } = req.body;

    if (!doctorName || !patientName || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const meetingTopic = `Consultation: Dr. ${doctorName} & ${patientName}`;
    
    const zoomMeeting = await createZoomMeeting(meetingTopic, startTime, 30);
    
    res.status(200).json(zoomMeeting);
  } catch (error) {
    console.error('Error generating Zoom link:', error.message);
    res.status(500).json({ error: 'Failed to create Zoom meeting' });
  }
};
