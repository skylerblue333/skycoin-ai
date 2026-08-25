import { AiRoutingPolicy, type Complexity, type RouteDecision } from './index.js';

export type VoiceOperation = 'transcribe' | 'synthesize';

export interface VoiceRequest {
  operation: VoiceOperation;
  language: string;
  inputSize: number;
  complexity?: Complexity;
}

export interface VoicePlan {
  operation: VoiceOperation;
  language: string;
  providerId: string;
  reason: string;
}

const LANGUAGE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/;
const MAX_INPUT_SIZE = 1_000_000;

function validateVoiceRequest(request: VoiceRequest): void {
  if (request.operation !== 'transcribe' && request.operation !== 'synthesize') {
    throw new TypeError('unsupported voice operation');
  }
  if (!LANGUAGE_PATTERN.test(request.language)) {
    throw new TypeError('language must be a bounded BCP-47-like tag');
  }
  if (!Number.isSafeInteger(request.inputSize) || request.inputSize < 1 || request.inputSize > MAX_INPUT_SIZE) {
    throw new TypeError(`inputSize must be an integer between 1 and ${MAX_INPUT_SIZE}`);
  }
}

/**
 * Deterministic speech-interface planner. This validates metadata and selects a declared
 * speech-capable provider through AiRoutingPolicy; it never captures audio or calls a provider.
 */
export function planVoiceRequest(policy: AiRoutingPolicy, request: VoiceRequest): VoicePlan | null {
  validateVoiceRequest(request);
  const decision: RouteDecision | null = policy.route({
    capability: 'speech',
    complexity: request.complexity ?? 'medium',
    promptChars: request.inputSize,
  });
  if (!decision) return null;

  return {
    operation: request.operation,
    language: request.language,
    providerId: decision.providerId,
    reason: decision.reason,
  };
}

export const VOICE_LIMITS = { MAX_INPUT_SIZE } as const;
