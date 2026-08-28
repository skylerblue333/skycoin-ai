export type ModelCapability = 'chat' | 'embedding' | 'vision' | 'speech';

export interface ModelTarget {
  id: string;
  provider: string;
  capabilities: readonly ModelCapability[];
  enabled: boolean;
  priority: number;
}

export interface ModelRequest {
  capability: ModelCapability;
  preferredProvider?: string;
}

export interface ModelRouteDecision {
  targetId: string;
  provider: string;
  capability: ModelCapability;
  reason: 'preferred_provider' | 'priority_fallback';
}

function normalized(value: string): string {
  const v = value.trim().toLowerCase();
  if (!v) throw new Error('invalid_model_gateway_value');
  return v;
}

function compareTargetIds(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function routeModelRequest(targets: readonly ModelTarget[], request: ModelRequest): ModelRouteDecision {
  const capability = request.capability;
  const eligible = targets
    .filter((target) => target.enabled && target.capabilities.includes(capability))
    .map((target) => ({ ...target, provider: normalized(target.provider) }))
    .sort((a, b) => a.priority - b.priority || compareTargetIds(a.id, b.id));

  if (eligible.length === 0) throw new Error('no_eligible_model_target');

  if (request.preferredProvider) {
    const preferred = normalized(request.preferredProvider);
    const match = eligible.find((target) => target.provider === preferred);
    if (match) {
      return { targetId: match.id, provider: match.provider, capability, reason: 'preferred_provider' };
    }
  }

  const selected = eligible[0];
  return { targetId: selected.id, provider: selected.provider, capability, reason: 'priority_fallback' };
}

export const SKY_MODEL_GATEWAY_CONTRACT = {
  request: 'sky.model.route.v1',
  decision: 'sky.model.route.decision.v1',
  invokesProvider: false,
  storesPrompts: false,
} as const;
