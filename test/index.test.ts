import assert from 'node:assert/strict';
import test from 'node:test';

import { AiRoutingPolicy } from '../src/index';

test('routes to lowest-ranked enabled provider that satisfies capability and prompt bound', () => {
  const policy = new AiRoutingPolicy();
  policy.register({ id: 'secondary', capabilities: ['reasoning'], maxPromptChars: 10_000, enabled: true, priority: 20 });
  policy.register({ id: 'primary', capabilities: ['reasoning', 'general'], maxPromptChars: 5_000, enabled: true, priority: 10 });

  assert.equal(
    policy.route({ capability: 'reasoning', complexity: 'high', promptChars: 4_000 })?.providerId,
    'primary',
  );
  assert.equal(
    policy.route({ capability: 'reasoning', complexity: 'high', promptChars: 8_000 })?.providerId,
    'secondary',
  );
});

test('returns null rather than fabricating a route when no provider matches', () => {
  const policy = new AiRoutingPolicy();
  policy.register({ id: 'text-only', capabilities: ['general'], maxPromptChars: 1_000, enabled: true, priority: 1 });
  assert.equal(policy.route({ capability: 'vision', complexity: 'medium', promptChars: 100 }), null);
});

test('disabled providers are never selected', () => {
  const policy = new AiRoutingPolicy();
  policy.register({ id: 'disabled', capabilities: ['fast'], maxPromptChars: 1_000, enabled: false, priority: 0 });
  policy.register({ id: 'enabled', capabilities: ['fast'], maxPromptChars: 1_000, enabled: true, priority: 5 });
  assert.equal(policy.route({ capability: 'fast', complexity: 'low', promptChars: 10 })?.providerId, 'enabled');
});

test('validates provider and request bounds', () => {
  const policy = new AiRoutingPolicy();
  assert.throws(
    () => policy.register({ id: '', capabilities: ['general'], maxPromptChars: 100, enabled: true, priority: 1 }),
    /provider id/,
  );
  assert.throws(
    () => policy.register({ id: 'bad', capabilities: [], maxPromptChars: 100, enabled: true, priority: 1 }),
    /capability/,
  );
  assert.throws(() => policy.route({ capability: 'general', complexity: 'low', promptChars: -1 }), /promptChars/);
});

test('returned provider profiles cannot mutate registry state', () => {
  const policy = new AiRoutingPolicy();
  const profile = policy.register({ id: 'provider', capabilities: ['general'], maxPromptChars: 100, enabled: true, priority: 1 });
  (profile.capabilities as string[]).push('vision');
  assert.deepEqual(policy.get('provider')?.capabilities, ['general']);
});
