import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      family: 4,
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("[EMAIL SKIP] No email credentials configured");
    return null;
  }

  try {
    const info = await getTransporter().sendMail({
      from: '"Ki Khabo" <' + process.env.EMAIL_USER + ">",
      to,
      subject,
      html,
    });
    console.log("[EMAIL SENT]", to, subject, info.messageId);
    return info;
  } catch (err) {
    console.error("[EMAIL FAIL]", to, subject, err.message);
    return null;
  }
};

export default sendEmail;