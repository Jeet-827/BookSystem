// Helper: Check if a value contains MongoDB query operators or objects (NoSQL Injection Prevention)
const containsQueryOperator = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) return true;
    if (typeof obj[key] === 'object' && containsQueryOperator(obj[key])) {
      return true;
    }
  }
  return false;
};

// Strict Email Regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Middleware: Denies query parameters and validates/sanitizes registration body
 */
export const validateRegister = (req, res, next) => {
  // Deny any query parameters on auth routes
  if (req.query && Object.keys(req.query).length > 0) {
    return res.status(400).json({
      message: 'Access Denied: Query parameters are not permitted on this endpoint',
    });
  }

  // Deny NoSQL injection in body
  if (containsQueryOperator(req.body)) {
    return res.status(400).json({
      message: 'Access Denied: Invalid characters or query operators detected in payload',
    });
  }

  const { name, email, password } = req.body;

  // Type checks
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      message: 'Invalid payload: name, email, and password must be plain text strings',
    });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  // Validate Name
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
    return res.status(400).json({
      message: 'Name is required and must be between 2 and 50 characters',
    });
  }

  // Validate Email
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({
      message: 'Please provide a valid email address (e.g. user@example.com)',
    });
  }

  // Validate Password
  if (!password || password.length < 6) {
    return res.status(400).json({
      message: 'Password is required and must be at least 6 characters long',
    });
  }

  if (password.length > 128) {
    return res.status(400).json({
      message: 'Password cannot exceed 128 characters',
    });
  }

  // Attach sanitized fields to req.body
  req.body.name = trimmedName;
  req.body.email = trimmedEmail;
  req.body.password = password;

  next();
};

/**
 * Middleware: Denies query parameters and validates/sanitizes login body
 */
export const validateLogin = (req, res, next) => {
  // Deny any query parameters on auth routes
  if (req.query && Object.keys(req.query).length > 0) {
    return res.status(400).json({
      message: 'Access Denied: Query parameters are not permitted on this endpoint',
    });
  }

  // Deny NoSQL injection in body
  if (containsQueryOperator(req.body)) {
    return res.status(400).json({
      message: 'Access Denied: Invalid characters or query operators detected in payload',
    });
  }

  const { email, password } = req.body;

  // Type checks
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      message: 'Invalid payload: email and password must be plain text strings',
    });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Validate Email
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({
      message: 'Please provide a valid email address',
    });
  }

  // Validate Password
  if (!password || password.trim().length === 0) {
    return res.status(400).json({
      message: 'Password cannot be empty',
    });
  }

  req.body.email = trimmedEmail;
  req.body.password = password;

  next();
};
