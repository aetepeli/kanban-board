import nodemailer from 'nodemailer';
import APIError from './apiErrors';
import { API_CODES } from './constants';

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

interface sendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user,
    pass,
  },
});

const sendEmail = async (params: sendEmailParams) => {
  try {
    const { to, subject, html } = params;

    if (!user || !pass) {
      throw new APIError(API_CODES.BAD_REQUEST, 'SMTP settings are missing! Check your .env file.');
    }

    const mailOptions = {
      from: `"Kanban Board App" <${user}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: [${info.messageId}] -> ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending error: ', error);
    return false;
  }
};

export default { sendEmail };
