const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `shopZone Cosmetics <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const emailTemplates = {
  orderConfirmation: (order) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Order Confirmed! 🎉</h2>
      <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
      <p>Total: <strong>$${order.totalPrice.toFixed(2)}</strong></p>
      <p>We'll notify you when your order ships.</p>
    </div>
  `,
  orderShipped: (order) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Your Order is on the Way! 🚚</h2>
      <p>Order <strong>#${order.orderNumber}</strong> has been shipped.</p>
      ${order.trackingNumber ? `<p>Tracking: <strong>${order.trackingNumber}</strong></p>` : ''}
    </div>
  `,
  welcomeEmail: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Welcome to shopZone Cosmetics, ${name}! 🛍️</h2>
      <p>We're excited to have you on board. Start exploring thousands of products.</p>
    </div>
  `,
};

module.exports = { sendEmail, emailTemplates };
