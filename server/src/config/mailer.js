// src/config/mailer.js
// =============================================================================
// Nodemailer transporter and email utility functions.
//
// Architecture decision:
//   - One transporter instance is created here using SMTP credentials from env.
//   - Specific "send" functions (e.g. sendVerificationEmail) are defined here
//     and exported individually. The rest of the app never touches Nodemailer
//     directly — it only calls these named functions.
//   - Swapping mail providers in the future means changing only this file.
// =============================================================================

import nodemailer from "nodemailer";
import env from "./env.js";

// -----------------------------------------------------------------------------
// Transporter
// In development this points to Mailtrap's sandbox SMTP.
// In production, replace env.mailtrap.* with your provider's credentials.
// -----------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: env.mailtrap.host,
  port: env.mailtrap.port,
  auth: {
    user: env.mailtrap.user,
    pass: env.mailtrap.pass,
  },
});

// -----------------------------------------------------------------------------
// sendVerificationEmail
// Sends an email containing a clickable verification link to the new user.
//
// @param {string} toEmail      - recipient's email address
// @param {string} verifyUrl    - full URL the user clicks to verify
// -----------------------------------------------------------------------------
const sendVerificationEmail = async (toEmail, verifyUrl) => {
  const mailOptions = {
    from: `"LocalMart" <${env.mailtrap.from}>`,
    to: toEmail,
    subject: "Verify your LocalMart account",
    // Plain text fallback for email clients that don't render HTML
    text: `Welcome to LocalMart! Please verify your email by visiting this link: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    // HTML version
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to LocalMart!</h2>
        <p>Thank you for registering. Please verify your email address to activate your account.</p>
        <p style="margin: 30px 0;">
          <a
            href="${verifyUrl}"
            style="
              background-color: #4F46E5;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
            "
          >
            Verify My Email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #4F46E5;">${verifyUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export { sendVerificationEmail };
