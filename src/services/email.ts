'use server';
import 'server-only';
import {createTransport} from 'nodemailer';

const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (
    !process.env.EMAIL_SERVER_USER ||
    !process.env.EMAIL_SERVER_PASSWORD
  ) {
    throw new Error(
      'Missing EMAIL_SERVER_USER or EMAIL_SERVER_PASSWORD environment variables.'
    );
  }

  const mailOptions = {
    from: process.env.EMAIL_SERVER_USER,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw new Error('Could not send email.');
  }
}
