import { validateGenuineEmail } from '../utils/emailValidator.js';

// Strict Email Regex for Login
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateRegister = (req, res, next) => {
  if (req.query && Object.keys(req.query).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Access Denied: Query parameters are not permitted on this endpoint',
    });
  }

  const { name, email, password } = req.body;

  // Type checks
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid payload: name, email, and password must be plain text strings',
    });
  }

  const cleanName = name.trim();
  const rawEmail = email.trim();

  // Validate Name
  if (!cleanName || cleanName.length < 2 || cleanName.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Name is required and must be between 2 and 50 characters',
    });
  }

  // Validate Genuine Email (Blocks test.com, disposable, dummy domains)
  const emailValidation = validateGenuineEmail(rawEmail);
  if (!emailValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: emailValidation.message,
    });
  }
  const cleanEmail = emailValidation.sanitizedEmail;

  // Validate Password
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be at least 6 characters long',
    });
  }

  if (password.length > 128) {
    return res.status(400).json({
      success: false,
      message: 'Password cannot exceed 128 characters',
    });
  }

  // Attach sanitized fields to req.body
  req.body.name = cleanName;
  req.body.email = cleanEmail;
  req.body.password = password;

  next();
};

export const validateLogin = (req, res, next) => {
  if (req.query && Object.keys(req.query).length > 0) {
    return res.status(400).json({
      message: 'Access Denied: Query parameters are not permitted on this endpoint',
    });
  }

  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      message: 'Invalid payload: email and password must be plain text strings',
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({
      message: 'Please provide a valid email address',
    });
  }

  if (!password || password.trim().length === 0) {
    return res.status(400).json({
      message: 'Password cannot be empty',
    });
  }

  req.body.email = cleanEmail;
  req.body.password = password;

  next();
};
