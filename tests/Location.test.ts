import test from 'node:test';
import assert from 'node:assert';
import { Location } from '../src/models/Location.js';

test('Location model properties', (t) => {
  const attributes = (Location as any).rawAttributes;

  assert.ok(attributes.id, 'id attribute should exist');
  assert.strictEqual(attributes.id.type.constructor.name, 'STRING', 'id should be STRING');
  assert.strictEqual(attributes.id.primaryKey, true, 'id should be primary key');

  assert.ok(attributes.name, 'name attribute should exist');
  assert.strictEqual(attributes.name.type.constructor.name, 'STRING', 'name should be STRING');
  assert.strictEqual(attributes.name.allowNull, false, 'name should not be nullable');

  assert.ok(attributes.type, 'type attribute should exist');
  assert.strictEqual(attributes.type.type.constructor.name, 'STRING', 'type should be STRING');
  assert.strictEqual(attributes.type.allowNull, true, 'type should be nullable');
});

test('Location model configuration', (t) => {
  assert.strictEqual(Location.name, 'Location', 'Model name should be Location');
  assert.strictEqual((Location as any).tableName, 'locations', 'Table name should be locations');
});
