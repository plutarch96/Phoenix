/**
 * Email Service
 *
 * Currently logs emails to console for development.
 * In production, replace with a real email service like:
 * - SendGrid
 * - Mailgun
 * - AWS SES
 * - Nodemailer with SMTP
 */

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} username - User's username
 */
async function sendPasswordResetEmail(to, resetToken, username) {
  // In production, this would be the actual reset URL
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // For now, log to console (replace with actual email service in production)
  console.log('\n==========================================');
  console.log('PASSWORD RESET EMAIL');
  console.log('==========================================');
  console.log('To:', to);
  console.log('Subject: Password Reset Request');
  console.log('\nMessage:');
  console.log(`Hello ${username},\n`);
  console.log('You requested to reset your password for the Fire Research Lab Test Tracking System.\n');
  console.log('Click the link below to reset your password:');
  console.log(resetUrl);
  console.log('\nThis link will expire in 1 hour.\n');
  console.log('If you did not request this, please ignore this email.\n');
  console.log('Best regards,');
  console.log('Fire Research Lab Team');
  console.log('==========================================\n');

  // Simulate async email sending
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, messageId: `mock-${Date.now()}` });
    }, 100);
  });
}

/**
 * Send password changed confirmation email
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 */
async function sendPasswordChangedEmail(to, username) {
  console.log('\n==========================================');
  console.log('PASSWORD CHANGED CONFIRMATION EMAIL');
  console.log('==========================================');
  console.log('To:', to);
  console.log('Subject: Password Changed Successfully');
  console.log('\nMessage:');
  console.log(`Hello ${username},\n`);
  console.log('Your password has been changed successfully.\n');
  console.log('If you did not make this change, please contact support immediately.\n');
  console.log('Best regards,');
  console.log('Fire Research Lab Team');
  console.log('==========================================\n');

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, messageId: `mock-${Date.now()}` });
    }, 100);
  });
}

/**
 * Send welcome email to new user
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} temporaryPassword - Temporary password (optional)
 */
async function sendWelcomeEmail(to, username, temporaryPassword = null) {
  console.log('\n==========================================');
  console.log('WELCOME EMAIL');
  console.log('==========================================');
  console.log('To:', to);
  console.log('Subject: Welcome to Fire Research Lab Test Tracking');
  console.log('\nMessage:');
  console.log(`Hello ${username},\n`);
  console.log('Welcome to the Fire Research Lab Test Tracking System!\n');

  if (temporaryPassword) {
    console.log('Your account has been created with the following credentials:');
    console.log(`Username: ${username}`);
    console.log(`Temporary Password: ${temporaryPassword}\n`);
    console.log('Please log in and change your password immediately.\n');
  } else {
    console.log('Your account has been created. You can now log in to the system.\n');
  }

  console.log('Best regards,');
  console.log('Fire Research Lab Team');
  console.log('==========================================\n');

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, messageId: `mock-${Date.now()}` });
    }, 100);
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail
};
