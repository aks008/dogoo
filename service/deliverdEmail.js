const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const moment = require("moment");

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like 'smtp', 'outlook', etc.
    auth: {
        user: process.env.EMAIL,    // Your Gmail address
        pass: process.env.PASSWORD        // Your generated App Password
    }
});

// Helper function to send email
function sendDeliverdMail(orderDetails) {
    try {
        // Send email
        const mailOptions = {
            from: process.env.EMAIL,
            to: orderDetails.customerEmail,
            subject: 'Hope You Love It! Your Order Has Arrived 🐾',
            html: `<div style="font-family: 'Arial', sans-serif; background-color: #f9f9f9; padding: 40px;">
    <div
        style="max-width: 650px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
        <div
            style="background-color: #28a745; color: white; text-align: center; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Order Delivered!</h1>
        </div>

        <div
            style="margin: 30px 0; padding: 20px; background-color: #f1f1f1; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <p><strong>Order ID:</strong> ${orderDetails.orderNumber}</p>
            <p><strong>Customer Name:</strong> ${orderDetails.customerName}</p>
            <p><strong>Delivery Date:</strong> ${moment().format("DD/MM/YYYY")}</p>
        </div>

        <p>Hello ${orderDetails.customerName},</p>
        <p>We’re happy to let you know that your order has been successfully delivered! We hope you’re delighted with
            your purchase.</p>
        <p>If you have any questions, concerns, or feedback, feel free to contact us. Your satisfaction is our top
            priority!</p>

        <a href="https://dogobiscuits.online/order/${orderDetails.orderNumber}"
            style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; font-size: 16px; border-radius: 5px; margin-top: 20px;">View
            Your Order</a>
        <div
            style="margin-top: 30px; background-color: #fffbea; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <p style="margin: 0; font-size: 14px; color: #777;">Enjoyed your order? We’d love to hear your feedback.
                Write a review and let us know your thoughts!</p>
        </div>

        <div style="text-align: center; font-size: 14px; color: #777; margin-top: 30px;">
            <p>If you have any questions, feel free to <a href="mailto:dogobuscuits@gmail.com"
                    style="color: #28a745;">contact us</a>.</p>
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
</div>`
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


module.exports = sendDeliverdMail;