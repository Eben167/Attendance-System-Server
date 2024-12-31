const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 10000; // Use the port assigned by Render if available

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

// Endpoint to handle sign-in notifications
app.post('/sign-in', (req, res) => {
    console.log('Received sign-in notification');
    const student = req.body; // Expecting a student object with {id, name, email}
    
    // Validate data
    if (!student.name || !student.email) {
        return res.status(400).json({ error: 'Invalid student data.' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Attendance Notification: Signed In',
        text: `Dear ${student.name},\n\nYou have successfully signed in for the attendance session.\n\nBest regards,\nAttendance System`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Failed to send email to ${student.email}:`, error);
            return res.status(500).json({ error: 'Failed to send sign-in email.' });
        }
        console.log(`Sign-in email sent to ${student.email}:`, info.response);
        res.status(200).json({ message: 'Sign-in notification sent successfully.' });
    });
});

// Endpoint to handle sign-out notifications
app.post('/sign-out', (req, res) => {
    console.log('Received sign-out notification');
    const student = req.body; // Expecting a student object with {id, name, email}

    // Validate data
    if (!student.name || !student.email) {
        return res.status(400).json({ error: 'Invalid student data.' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Attendance Notification: Signed Out',
        text: `Dear ${student.name},\n\nYou have successfully signed out for the attendance session.\n\nBest regards,\nAttendance System`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Failed to send email to ${student.email}:`, error);
            return res.status(500).json({ error: 'Failed to send sign-out email.' });
        }
        console.log(`Sign-out email sent to ${student.email}:`, info.response);
        res.status(200).json({ message: 'Sign-out notification sent successfully.' });
    });
});

// Endpoint to handle reset notifications (for absent students)
app.post('/attendance-reset', (req, res) => {
    console.log('Received request to reset attendance');
    const students = req.body.students; // Expecting an array of all students
    const signedInStudents = req.body.signedInStudents; // List of students who signed in before reset

    if (!Array.isArray(students) || students.length === 0 || !Array.isArray(signedInStudents)) {
        return res.status(400).json({ error: 'Invalid student list.' });
    }

    const absentStudents = students.filter(student => !signedInStudents.some(signedIn => signedIn.id === student.id));

    // Create an array of promises for sending emails
    const emailPromises = absentStudents.map(student => {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: student.email,
            subject: 'Attendance Notification: Missed Session',
            text: `Dear ${student.name},\n\nYou were marked absent during the last attendance session. Please ensure to sign in for future sessions.\n\nBest regards,\nAttendance System`
        };

        // Return a Promise that resolves when the email is sent
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(`Failed to send email to ${student.email}: ${error}`); // Reject if email fails
                } else {
                    resolve(`Email sent to ${student.email}: ${info.response}`); // Resolve if email is sent
                }
            });
        });
    });

    // Use Promise.all to send all emails concurrently
    Promise.all(emailPromises)
        .then(results => {
            console.log('All emails sent successfully:', results);
            res.status(200).json({ message: 'Attendance reset notification sent to absent students.' });
        })
        .catch(error => {
            console.error('Error sending emails:', error);
            res.status(500).json({ error: 'Failed to send some or all emails.' });
        });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
