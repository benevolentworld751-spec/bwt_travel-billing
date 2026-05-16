import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


  const mailOptions = {
    from: `"TravelBill Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: " + info.response);
    return info;
  } catch (error) {
    console.error("Nodemailer Error Details:", error);
    throw error;
  }
   
};

export default sendEmail;