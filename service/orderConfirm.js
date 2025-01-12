const nodemailer = require('nodemailer');
// Create a Nodemailer transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,    // Your Gmail address
    pass: process.env.PASSWORD        // Your generated App Password
  }
});

// Function to send order confirmation email
function sendOrderConfirmation(orderDetails) {
  const mailOptions = {
    from: process.env.EMAIL,      // Sender's email
    to: orderDetails.customerEmail,    // Customer's email
    subject: `Order Confirmation - ${orderDetails.orderNumber}`,
    html: `
      <div style="font-family: 'Arial', sans-serif; background-color: #f9f9f9; padding: 40px;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #2d88cc; color: white; text-align: center; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed</h1>
          </div>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f1f1f1; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <p><strong>Order ID:</strong> ${orderDetails.orderNumber}</p>
            <p><strong>Customer Name:</strong> ${orderDetails.customerName}</p>
            <p><strong>Email:</strong> ${orderDetails.customerEmail}</p>
            <p><strong>Order Date:</strong> ${orderDetails.date}</p>
            <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
          </div>

          <p>Thank you for your order! Your order is being processed, and you will receive a notification once it has been shipped.</p>
          <a href="https://www.yourcompany.com/order/${orderDetails.orderNumber}" style="display: inline-block; padding: 12px 30px; background-color: #2d88cc; color: white; text-decoration: none; font-size: 16px; border-radius: 5px; margin-top: 20px;">View Your Order</a>

          <div style="text-align: center; font-size: 14px; color: #777; margin-top: 30px;">
            <p>If you have any questions, feel free to <a href="mailto:support@yourcompany.com" style="color: #2d88cc;">contact us</a>.</p>
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    `
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending confirmation email:', error);
    } else {
      console.log('Order confirmation email sent: ' + info.response);
    }
  });
}


// Send the order confirmation email
module.exports = sendOrderConfirmation;
