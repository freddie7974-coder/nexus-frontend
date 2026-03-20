import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { validatePassword, validateEmail } from '../../src/utils/api.js';

let result;

Given('I have the password validator', () => {});
Given('I have the email validator', () => {});

When('I validate password {string}', (password) => {
  result = validatePassword(password);
});

When('I validate email {string}', (email) => {
  result = validateEmail(email);
});

Then('the result should be valid', () => {
  assert.strictEqual(result.valid, true, `Expected valid but got: ${result.msg}`);
});

Then('the result should be invalid', () => {
  assert.strictEqual(result.valid, false, `Expected invalid but got: ${result.msg}`);
});

Then('the message should contain {string}', (text) => {
  assert.ok(result.msg.toLowerCase().includes(text.toLowerCase()),
    `Expected "${text}" in: "${result.msg}"`);
});

