import assert from 'node:assert/strict';
import test from 'node:test';
import { SKY_MODEL_GATEWAY_CONTRACT, routeModelRequest } from '../src/modelGateway';

const targets = [
  { id: 'b', provider: 'ProviderB', capabilities: ['chat', 'vision'] as const, enabled: true, priority: 20 },
  { id: 'a', provider: 'ProviderA', capabilities: ['chat'] as const, enabled: true, priority: 10 },
  { id: 'off', provider: 'ProviderC', capabilities: ['chat'] as const, enabled: false, priority: 1 },
];

test('routes by deterministic priority fallback', () => {
  assert.deepEqual(routeModelRequest(targets, { capability: 'chat' }), {
    targetId: 'a', provider: 'providera', capability: 'chat', reason: 'priority_fallback',
  });
});

test('breaks equal-priority ties by locale-independent code-unit id order', () => {
  const tied = [
    { id: 'z', provider: 'ProviderZ', capabilities: ['chat'] as const, enabled: true, priority: 10 },
    { id: 'A', provider: 'ProviderA', capabilities: ['chat'] as const, enabled: true, priority: 10 },
  ];
  assert.equal(routeModelRequest(tied, { capability: 'chat' }).targetId, 'A');
});

test('honors an eligible preferred provider', () => {
  assert.deepEqual(routeModelRequest(targets, { capability: 'chat', preferredProvider: ' PROVIDERB ' }), {
    targetId: 'b', provider: 'providerb', capability: 'chat', reason: 'preferred_provider',
  });
});

test('falls back when preferred provider lacks requested capability', () => {
  const result = routeModelRequest(targets, { capability: 'vision', preferredProvider: 'ProviderA' });
  assert.equal(result.targetId, 'b');
  assert.equal(result.reason, 'priority_fallback');
});

test('rejects requests with no eligible target', () => {
  assert.throws(() => routeModelRequest(targets, { capability: 'embedding' }), /no_eligible_model_target/);
});

test('publishes a provider-neutral no-invocation contract', () => {
  assert.equal(SKY_MODEL_GATEWAY_CONTRACT.request, 'sky.model.route.v1');
  assert.equal(SKY_MODEL_GATEWAY_CONTRACT.invokesProvider, false);
  assert.equal(SKY_MODEL_GATEWAY_CONTRACT.storesPrompts, false);
});
