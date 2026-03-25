import test from 'node:test';
import assert from 'node:assert';
import { Contract } from '../src/models/Contract.js';

test('Contract model properties', (t) => {
  const attributes = (Contract as any).rawAttributes;

  assert.ok(attributes.quality, 'quality attribute should exist');
  assert.strictEqual(attributes.quality.type.constructor.name, 'INTEGER', 'quality should be INTEGER');
  assert.strictEqual(attributes.quality.defaultValue, 500, 'quality default value should be 500');
  assert.strictEqual(attributes.quality.allowNull, false, 'quality should not be nullable');
});
