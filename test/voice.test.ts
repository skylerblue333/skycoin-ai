import assert from 'node:assert/strict';
import test from 'node:test';
import { AiRoutingPolicy, planVoiceRequest } from '../src/index.js';

function policyWithSpeechProvider(): AiRoutingPolicy {
  const policy = new AiRoutingPolicy();
  policy.register({
    id: 'speech-local-adapter',
    capabilities: ['speech'],
    maxPromptChars: 50_000,
    enabled: true,
    priority: 10,
  });
  return policy;
}

test('plans a validated transcription request through speech capability', () => {
  const plan = planVoiceRequest(policyWithSpeechProvider(), {
    operation: 'transcribe',
    language: 'en-US',
    inputSize: 12_000,
  });

  assert.equal(plan?.providerId, 'speech-local-adapter');
  assert.equal(plan?.operation, 'transcribe');
  assert.equal(plan?.language, 'en-US');
});

test('returns null when no speech-capable provider is declared', () => {
  const policy = new AiRoutingPolicy();
  policy.register({ id: 'text-only', capabilities: ['general'], maxPromptChars: 50_000, enabled: true, priority: 1 });

  assert.equal(planVoiceRequest(policy, { operation: 'synthesize', language: 'en', inputSize: 200 }), null);
});

test('rejects malformed language tags and unbounded input metadata', () => {
  const policy = policyWithSpeechProvider();

  assert.throws(() => planVoiceRequest(policy, { operation: 'transcribe', language: '../en', inputSize: 10 }), TypeError);
  assert.throws(() => planVoiceRequest(policy, { operation: 'transcribe', language: 'en', inputSize: 0 }), TypeError);
  assert.throws(() => planVoiceRequest(policy, { operation: 'transcribe', language: 'en', inputSize: 1_000_001 }), TypeError);
});

test('does not imply provider invocation or audio capture', () => {
  const policy = policyWithSpeechProvider();
  const plan = planVoiceRequest(policy, { operation: 'synthesize', language: 'zh-CN', inputSize: 400, complexity: 'low' });

  assert.deepEqual(Object.keys(plan ?? {}).sort(), ['language', 'operation', 'providerId', 'reason']);
});
