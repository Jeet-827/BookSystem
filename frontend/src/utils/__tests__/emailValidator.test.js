import { describe, it, expect } from 'vitest';
import {
  validateGenuineEmail,
  isBlockedDomain,
  BLOCKED_EMAIL_DOMAINS,
} from '../emailValidator';

describe('Feature 1: Genuine Email Validation (Rejecting test.com, disposable & fake emails)', () => {
  // -------------------------------------------------------------
  // Test Cases 1-10: Explicit Rejection of test.com, dummy & demo domains
  // -------------------------------------------------------------
  it('1. should reject email with domain "test.com"', () => {
    const result = validateGenuineEmail('user@test.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('test.com');
  });

  it('2. should reject dummy local-part "test" on genuine domain (e.g., test@gmail.com)', () => {
    const result = validateGenuineEmail('test@gmail.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('test');
  });

  it('3. should reject both dummy username and domain "test@test.com"', () => {
    const result = validateGenuineEmail('test@test.com');
    expect(result.isValid).toBe(false);
  });

  it('4. should reject "testing@yahoo.com"', () => {
    const result = validateGenuineEmail('testing@yahoo.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('testing');
  });

  it('5. should reject domain "example.com"', () => {
    const result = validateGenuineEmail('john@example.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('example.com');
  });

  it('6. should reject domain "example.org"', () => {
    const result = validateGenuineEmail('alice@example.org');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('example.org');
  });

  it('7. should reject domain "fake.com"', () => {
    const result = validateGenuineEmail('customer@fake.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('fake.com');
  });

  it('8. should reject domain "dummy.com"', () => {
    const result = validateGenuineEmail('member@dummy.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('dummy.com');
  });

  it('9. should reject dummy local-part "fake" (e.g., fake@gmail.com)', () => {
    const result = validateGenuineEmail('fake@gmail.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('fake');
  });

  it('10. should reject dummy local-part "dummy" (e.g., dummy@outlook.com)', () => {
    const result = validateGenuineEmail('dummy@outlook.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('dummy');
  });

  // -------------------------------------------------------------
  // Test Cases 11-16: Rejection of Disposable & Temporary Email Services
  // -------------------------------------------------------------
  it('11. should reject disposable provider "mailinator.com"', () => {
    const result = validateGenuineEmail('buyer@mailinator.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('mailinator.com');
  });

  it('12. should reject temporary email service "tempmail.com"', () => {
    const result = validateGenuineEmail('reader@tempmail.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('tempmail.com');
  });

  it('13. should reject temporary email service "temp-mail.org"', () => {
    const result = validateGenuineEmail('reader@temp-mail.org');
    expect(result.isValid).toBe(false);
  });

  it('14. should reject "10minutemail.com"', () => {
    const result = validateGenuineEmail('reader@10minutemail.com');
    expect(result.isValid).toBe(false);
  });

  it('15. should reject "guerrillamail.com"', () => {
    const result = validateGenuineEmail('reader@guerrillamail.com');
    expect(result.isValid).toBe(false);
  });

  it('16. should reject "yopmail.com"', () => {
    const result = validateGenuineEmail('reader@yopmail.com');
    expect(result.isValid).toBe(false);
  });

  // -------------------------------------------------------------
  // Test Cases 17-21: Rejection of Keyboard Spam & Invalid Structures
  // -------------------------------------------------------------
  it('17. should reject placeholder keyboard pattern "asdf@gmail.com"', () => {
    const result = validateGenuineEmail('asdf@gmail.com');
    expect(result.isValid).toBe(false);
  });

  it('18. should reject placeholder keyboard pattern "qwerty@gmail.com"', () => {
    const result = validateGenuineEmail('qwerty@gmail.com');
    expect(result.isValid).toBe(false);
  });

  it('19. should reject repeated characters "aaaaaa@gmail.com"', () => {
    const result = validateGenuineEmail('aaaaaa@gmail.com');
    expect(result.isValid).toBe(false);
  });

  it('20. should reject missing @ symbol', () => {
    const result = validateGenuineEmail('notanemail.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('format');
  });

  it('21. should reject empty string or whitespace', () => {
    const result = validateGenuineEmail('   ');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('required');
  });

  // -------------------------------------------------------------
  // Test Cases 22-30: Acceptance of Genuine Real-World Emails
  // -------------------------------------------------------------
  it('22. should accept genuine Gmail address "ritulbaldha9@gmail.com"', () => {
    const result = validateGenuineEmail('ritulbaldha9@gmail.com');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedEmail).toBe('ritulbaldha9@gmail.com');
  });

  it('23. should accept genuine Google Mail with dots "jeet.developer@gmail.com"', () => {
    const result = validateGenuineEmail('jeet.developer@gmail.com');
    expect(result.isValid).toBe(true);
  });

  it('24. should accept genuine Yahoo address "alex.turner@yahoo.com"', () => {
    const result = validateGenuineEmail('alex.turner@yahoo.com');
    expect(result.isValid).toBe(true);
  });

  it('25. should accept genuine Outlook address "sarah.connor@outlook.com"', () => {
    const result = validateGenuineEmail('sarah.connor@outlook.com');
    expect(result.isValid).toBe(true);
  });

  it('26. should accept genuine Hotmail address "david_beckham@hotmail.com"', () => {
    const result = validateGenuineEmail('david_beckham@hotmail.com');
    expect(result.isValid).toBe(true);
  });

  it('27. should accept genuine iCloud address "emily.reader@icloud.com"', () => {
    const result = validateGenuineEmail('emily.reader@icloud.com');
    expect(result.isValid).toBe(true);
  });

  it('28. should accept genuine Proton address "secure.coder@proton.me"', () => {
    const result = validateGenuineEmail('secure.coder@proton.me');
    expect(result.isValid).toBe(true);
  });

  it('29. should accept genuine corporate domain "support@redkitindia.com"', () => {
    const result = validateGenuineEmail('support@redkitindia.com');
    expect(result.isValid).toBe(true);
  });

  it('30. should accept genuine regional/country domain "contact@library.co.in"', () => {
    const result = validateGenuineEmail('contact@library.co.in');
    expect(result.isValid).toBe(true);
  });
});
