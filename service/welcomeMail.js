const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
	service: 'gmail', // You can use other services like 'smtp', 'outlook', etc.
	auth: {
		user: process.env.EMAIL,    // Your Gmail address
		pass: process.env.PASSWORD        // Your generated App Password
	}
});

// Helper function to send email
function sendWelcomeEmail(userDetails) {
	try {
		// Load the email template
		const templatePath = path.join('views', 'emails', 'welcome-email.hbs');
		const templateSource = fs.readFileSync(templatePath, 'utf8');
		const template = handlebars.compile(templateSource);

		// Data to replace in the email template
		const emailContent = template({
			userName: userDetails.firstName + " " + userDetails.lastName,
			siteName: 'Dogo Biscuit', // Customizable site name or company name
			siteUrl: "https://dogobiscuits.online" // URL for your site
		});

		// Send email
		const mailOptions = {
			from: process.env.EMAIL,
			to: userDetails.email,
			subject: 'Welcome to Dogo Biscuit!',
			html: emailContent
		};

		// Send the email
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log('Error sending email:', error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});
	} catch (error) {
		console.log("err : ", error);
		throw (error)
	}
}


module.exports = sendWelcomeEmail