const nodemailer = require('nodemailer');
const moment = require("moment");

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Helper function to send new order email
function sendNewOrderMail(orderDetails) {
    try {
        // Email content
        const mailOptions = {
            from: process.env.EMAIL,
            to: `akashrupareliya321@gmail.com`,
            subject: `Heads Up! A New Order is in Your System : ${orderDetails.orderNumber}`,
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Received</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 40px;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #007bff;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .order-details {
            margin: 30px 0;
            padding: 20px;
            background-color: #f1f1f1;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .order-details p {
            margin: 10px 0;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #777;
            margin-top: 30px;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            font-size: 16px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="header">
            <h1>New Order Received!</h1>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #f1f1f1; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <p><strong>Order ID:</strong> ${orderDetails.orderNumber}</p>
            <p><strong>Customer Name:</strong> ${orderDetails.customerName}</p>
            <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
            <p><strong>Order Date:</strong> ${orderDetails.date}</p>
            <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
        </div>

        <p>Hello Admin,</p>
        <p>You have received a new order. Please review the details and process the order as soon as possible.</p>

        <a href="https://yourwebsite.com/admin/orders/${orderDetails.orderNumber}" class="button">View Order</a>

        <div class="footer">
            <p>If you have any questions, feel free to <a href="mailto:support@yourcompany.com">contact us</a>.</p>
            <p>&copy; 2025 Your Company. All rights reserved.</p>
        </div>
    </div>

</body>
</html>`
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
        console.log("Error sending new order email: ", error);
        throw error;
    }
}

module.exports = sendNewOrderMail;
