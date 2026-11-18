/**
 * Genuine Email Validation Utility (Frontend)
 * Validates real format, proper domain structure, and rejects
 * disposable, temporary, and test domains (test.com, example.com, mailinator, etc.).
 */

export const BLOCKED_EMAIL_DOMAINS = new Set([
  'test.com',
  'testing.com',
  'test.org',
  'test.net',
  'test.io',
  'test.co',
  'testmail.com',
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'fake.com',
  'fakemail.com',
  'fakeinbox.com',
  'fakedata.com',
  'dummy.com',
  'dummydomain.com',
  'sample.com',
  'sample.org',
  'sample.net',
  'demo.com',
  'demomail.com',
  'invalid.com',
  'invalid.org',
  'localhost',
  'local.dev',
  'foo.com',
  'bar.com',
  'foobar.com',
  'baz.com',
  'xyz.com',
  'abc.com',
  'qwerty.com',
  'asdf.com',
  'temp.com',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'binkmail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempail.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'dispostable.com',
  'disposablemail.com',
  'yopmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'getnada.com',
  'mohmal.com',
  'mytemp.email',
  'generator.email',
  'fakemailgenerator.com',
  'crazymailing.com',
  'emailfake.com',
  'dropmail.me',
  'burnermail.io',
]);

const BLOCKED_LOCAL_PARTS = new Set([
  'test',
  'testing',
  'tester',
  'fake',
  'dummy',
  'sample',
  'demo',
  'asdf',
  'qwerty',
  '123456',
  '12345',
  'noreply',
  'no-reply',
]);

export const isBlockedDomain = (domain) => {
  if (!domain) return true;
  const clean = domain.trim().toLowerCase();

  if (BLOCKED_EMAIL_DOMAINS.has(clean)) return true;

  for (const blocked of BLOCKED_EMAIL_DOMAINS) {
    if (clean.endsWith('.' + blocked)) return true;
  }

  if (
    clean.startsWith('tempmail') ||
    clean.startsWith('temp-mail') ||
    clean.startsWith('10minute') ||
    clean.startsWith('disposable') ||
    clean.startsWith('throwaway') ||
    clean.startsWith('trashmail') ||
    clean.endsWith('.test') ||
    clean.endsWith('.example') ||
    clean.endsWith('.invalid') ||
    clean.endsWith('.localhost')
  ) {
    return true;
  }

  return false;
};

export const validateGenuineEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return {
      isValid: false,
      message: 'Email address is required.',
    };
  }

  const email = rawEmail.trim().toLowerCase();
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!EMAIL_REGEX.test(email) || email.includes('..')) {
    return {
      isValid: false,
      message: 'Please provide a valid email address format (e.g. name@gmail.com).',
    };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      message: 'Invalid email address structure.',
    };
  }

  const [localPart, domain] = parts;

  if (!localPart || localPart.length < 2) {
    return {
      isValid: false,
      message: 'Email username must be at least 2 characters long.',
    };
  }

  if (BLOCKED_LOCAL_PARTS.has(localPart)) {
    return {
      isValid: false,
      message: `The username "${localPart}" is a test/placeholder name. Please provide your real, genuine email.`,
    };
  }

  if (/^(.)\1{4,}$/.test(localPart)) {
    return {
      isValid: false,
      message: 'Please provide a genuine email address, not repeated placeholder characters.',
    };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return {
      isValid: false,
      message: 'Email domain must have a valid extension (e.g. .com, .org, .in).',
    };
  }

  const domainName = domainParts[0];
  const tld = domainParts[domainParts.length - 1];

  if (domainName.length < 2 && domain !== 'x.com' && domain !== 'q.com') {
    return {
      isValid: false,
      message: 'Email domain name is too short to be genuine.',
    };
  }

  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return {
      isValid: false,
      message: 'Email domain extension must contain only valid alphabet letters.',
    };
  }

  if (isBlockedDomain(domain)) {
    return {
      isValid: false,
      message: `The domain "${domain}" is a test or temporary email service. Please use a genuine email (e.g. Gmail, Outlook, Yahoo).`,
    };
  }

  return {
    isValid: true,
    sanitizedEmail: email,
  };
};

export default validateGenuineEmail;
