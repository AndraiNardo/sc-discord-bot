import test from 'node:test';
import assert from 'node:assert';
import { isValidConfigValue } from '../src/utils/config.js';

test('isValidConfigValue should return false for undefined or empty values', (t) => {
  assert.strictEqual(isValidConfigValue(undefined), false);
  assert.strictEqual(isValidConfigValue(''), false);
});

test('isValidConfigValue should return false for placeholder values', (t) => {
  assert.strictEqual(isValidConfigValue('your_contracts_board_channel_id_here'), false);
  assert.strictEqual(isValidConfigValue('your_bot_token_here'), false);
  assert.strictEqual(isValidConfigValue('your_uexcorp_api_key_here'), false);
});

test('isValidConfigValue should return true for valid values', (t) => {
  assert.strictEqual(isValidConfigValue('123456789012345678'), true);
  assert.strictEqual(isValidConfigValue('my-secret-token'), true);
  assert.strictEqual(isValidConfigValue('api-key-abc-123'), true);
});
