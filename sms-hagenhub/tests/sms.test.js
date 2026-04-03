import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isValidPhoneNumber, isValidMessage, sanitizePhoneNumber } from '../src/utils/validators.js';

describe('Phone number validation', () => {
  it('accepts valid E.164 numbers', () => {
    assert.strictEqual(isValidPhoneNumber('+491234567890'), true);
    assert.strictEqual(isValidPhoneNumber('+12025551234'), true);
  });

  it('rejects invalid numbers', () => {
    assert.strictEqual(isValidPhoneNumber('01234567890'), false);
    assert.strictEqual(isValidPhoneNumber('+0123'), false);
    assert.strictEqual(isValidPhoneNumber(''), false);
    assert.strictEqual(isValidPhoneNumber('abc'), false);
  });
});

describe('Message validation', () => {
  it('accepts valid messages', () => {
    assert.strictEqual(isValidMessage('Hello!'), true);
    assert.strictEqual(isValidMessage('A'.repeat(1600)), true);
  });

  it('rejects invalid messages', () => {
    assert.strictEqual(isValidMessage(''), false);
    assert.strictEqual(isValidMessage(null), false);
    assert.strictEqual(isValidMessage('A'.repeat(1601)), false);
  });
});

describe('Phone sanitization', () => {
  it('removes spaces and dashes', () => {
    assert.strictEqual(sanitizePhoneNumber('+49 123 456 7890'), '+491234567890');
    assert.strictEqual(sanitizePhoneNumber('+49-123-456-7890'), '+491234567890');
    assert.strictEqual(sanitizePhoneNumber('+49 (123) 456-7890'), '+491234567890');
  });
});
