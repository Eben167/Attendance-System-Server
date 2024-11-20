const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000; // Use the Render-assigned port or default to 3000

// Middleware to parse incoming JSON data
app.use(bodyParser.json());

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // Using Gmail service
    auth: {
        user: process.env.EMAIL_USER, // Your email address (set in .env)
        pass: process.env.EMAIL_PASS  // Your email password (set in .env)
    }
});

// Endpoint to receive absent students list
app.post('/absent-students', (req, res) => {
    console.log('Received request to /absent-students');
    const absentStudents = req.body; // Expecting an array of student objects
    console.log('Received absent students:', absentStudents);

    // Validate data
    if (!Array.isArray(absentStudents) || absentStudents.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty student list.' });
    }

    // Send emails to absent students
    absentStudents.forEach(student => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: student.email,
            subject: 'Attendance Notification',
            text: `Dear ${student.name},\n\nYou were marked absent during the last attendance session. Please provide a valid reason for your absence.\n\nBest regards,\nAttendance System`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Failed to send email to ${student.email}:`, error);
            } else {
                console.log(`Email sent to ${student.email}:`, info.response);
            }
        });
    });

    res.status(200).json({ message: 'Emails sent to absent students successfully.' });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
