import Notification from "../models/Notification.js";
import sendEmail from "./sendEmail.js";

const notify = async ({ userId, userEmail, type, title, message, link, emailSubject, emailHtml }) => {
  // 1. Create in-app notification
  try {
    await Notification.create({ user: userId, type, title, message, link: link || "" });
  } catch (err) {
    console.error("[NOTIFY DB FAIL]", err.message);
  }

  // 2. Send email (non-blocking — don't let email failure break the API)
  if (userEmail && emailSubject && emailHtml) {
    sendEmail({ to: userEmail, subject: emailSubject, html: emailHtml }).catch(() => {});
  }
};

export default notify;