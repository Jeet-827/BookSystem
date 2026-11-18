/**
 * Genuine Email Validation Utility
 * Enforces strict RFC compliance, validates real TLDs, and rejects
 * disposable, temporary, placeholder, and test domains (e.g., test.com, example.com, mailinator).
 */

// Blocklist of disposable, test, and placeholder domains
export const BLOCKED_EMAIL_DOMAINS = new Set([
  // Explicit Test, Demo & Placeholder Domains
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

  // Temporary & Disposable Mail Services
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
  'guerrillamail.biz',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'dispostable.com',
  'disposablemail.com',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'cool.fr.nf',
  'jetable.fr.nf',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'getnada.com',
  'abcvg.com',
  'inboxbear.com',
  'mohmal.com',
  'mohmal.im',
  'mohmal.in',
  'mytemp.email',
  'generator.email',
  'fakemailgenerator.com',
  'crazymailing.com',
  'emailfake.com',
  'dropmail.me',
  'burnermail.io',
  'inboxkitten.com',
  'nada.ltd',
  'getairmail.com',
  'maildrop.cc',
  'harakirimail.com',
  'meltmail.com',
  'mytempemail.com',
  'nowmymail.com',
  'onewaymail.com',
  'spambox.us',
  'throwawayemail.com',
  'mintemail.com',
  'incognitoprivateemail.com',
  'e4ward.com',
  'gishpuppy.com',
  'tempinbox.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
]);

// Blocked dummy or placeholder local-part usernames
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
  'null',
  'undefined',
  'void',
]);

/**
 * Checks if a domain is a known test, temporary, or disposable domain
 * @param {string} domain - Domain string in lower case
 * @returns {boolean}
 */
export const isBlockedDomain = (domain) => {
  if (!domain) return true;
  const clean = domain.trim().toLowerCase();

  // Direct match
  if (BLOCKED_EMAIL_DOMAINS.has(clean)) return true;

  // Subdomain match (e.g. sub.mailinator.com, user.test.com)
  for (const blocked of BLOCKED_EMAIL_DOMAINS) {
    if (clean.endsWith('.' + blocked)) return true;
  }

  // Prefix & special TLD checks
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

/**
 * Validates whether an email is genuine, well-formed, and not from a test or disposable provider.
 * @param {string} rawEmail - Email address string to test
 * @returns {{ isValid: boolean, sanitizedEmail?: string, message?: string }}
 */
export const validateGenuineEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return {
      isValid: false,
      message: 'Email address is required.',
    };
  }

  const email = rawEmail.trim().toLowerCase();

  // Standard RFC Email Regex
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!EMAIL_REGEX.test(email) || email.includes('..')) {
    return {
      isValid: false,
      message: 'Please provide a valid email address format (e.g. yourname@gmail.com).',
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

  // Length checks
  if (!localPart || localPart.length < 2) {
    return {
      isValid: false,
      message: 'Email username must be at least 2 characters long.',
    };
  }

  if (email.length > 254) {
    return {
      isValid: false,
      message: 'Email address exceeds maximum length of 254 characters.',
    };
  }

  // Blocked dummy local parts (e.g. test@..., fake@..., dummy@...)
  if (BLOCKED_LOCAL_PARTS.has(localPart)) {
    return {
      isValid: false,
      message: `The email username "${localPart}" is a test/placeholder name. Please provide your real, genuine email address.`,
    };
  }

  // Check for repeated dummy characters (e.g., "aaaaaa@...", "111111@...")
  if (/^(.)\1{4,}$/.test(localPart)) {
    return {
      isValid: false,
      message: 'Please provide a genuine email address, not repeated placeholder characters.',
    };
  }

  // Domain structure checks
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return {
      isValid: false,
      message: 'Email domain must have a valid top-level extension (e.g. .com, .org, .in).',
    };
  }

  const domainName = domainParts[0];
  const tld = domainParts[domainParts.length - 1];

  // Domain name check (e.g. at least 2 chars, unless recognized single-char domains like x.com)
  if (domainName.length < 2 && domain !== 'x.com' && domain !== 'q.com') {
    return {
      isValid: false,
      message: 'Email domain name is too short to be genuine.',
    };
  }

  // TLD check (letters only, min 2 chars, e.g. .com, .org, .edu, .net, .in, .tech)
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return {
      isValid: false,
      message: 'Email domain extension must contain only valid alphabet letters.',
    };
  }

  // Test and disposable domain blocklist check
  if (isBlockedDomain(domain)) {
    return {
      isValid: false,
      message: `The domain "${domain}" is a test, dummy, or temporary email service. Please register with a genuine email provider (e.g., Gmail, Outlook, Yahoo) or your real personal/work email.`,
    };
  }

  return {
    isValid: true,
    sanitizedEmail: email,
  };
};

export default validateGenuineEmail;
