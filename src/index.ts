export type Capability = 'fast' | 'reasoning' | 'vision' | 'speech' | 'code' | 'general';
export type Complexity = 'low' | 'medium' | 'high';

export interface RouteRequest {
  capability: Capability;
  complexity: Complexity;
  promptChars: number;
}

export interface ProviderProfile {
  id: string;
  capabilities: readonly Capability[];
  maxPromptChars: number;
  enabled: boolean;
  /** Lower values are preferred. */
  priority: number;
}

export interface RouteDecision {
  providerId: string;
  capability: Capability;
  complexity: Complexity;
  reason: string;
}

const MAX_PROVIDERS = 100;
const MAX_PROVIDER_ID = 128;
const MAX_PROMPT_CHARS = 1_000_000;

function compareProviderIds(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function validateProvider(profile: ProviderProfile): ProviderProfile {
  const id = profile.id.trim();
  if (!id || id.length > MAX_PROVIDER_ID) throw new TypeError('provider id must be 1-128 characters');
  if (!Number.isSafeInteger(profile.maxPromptChars) || profile.maxPromptChars < 1 || profile.maxPromptChars > MAX_PROMPT_CHARS) {
    throw new TypeError(`maxPromptChars must be an integer between 1 and ${MAX_PROMPT_CHARS}`);
  }
  if (!Number.isSafeInteger(profile.priority) || profile.priority < 0 || profile.priority > 10_000) {
    throw new TypeError('priority must be an integer between 0 and 10000');
  }
  if (profile.capabilities.length === 0) throw new TypeError('provider must declare at least one capability');
  return { ...profile, id, capabilities: [...new Set(profile.capabilities)] };
}

function validateRequest(request: RouteRequest): void {
  if (!Number.isSafeInteger(request.promptChars) || request.promptChars < 0 || request.promptChars > MAX_PROMPT_CHARS) {
    throw new TypeError(`promptChars must be an integer between 0 and ${MAX_PROMPT_CHARS}`);
  }
}

/** Provider-neutral deterministic routing policy. It never calls a model or network service. */
export class AiRoutingPolicy {
  private readonly providers = new Map<string, ProviderProfile>();

  register(profile: ProviderProfile): ProviderProfile {
    const validated = validateProvider(profile);
    if (!this.providers.has(validated.id) && this.providers.size >= MAX_PROVIDERS) {
      throw new RangeError('provider registry capacity reached');
    }
    this.providers.set(validated.id, validated);
    return this.get(validated.id)!;
  }

  remove(id: string): boolean {
    return this.providers.delete(id.trim());
  }

  get(id: string): ProviderProfile | undefined {
    const profile = this.providers.get(id.trim());
    return profile ? { ...profile, capabilities: [...profile.capabilities] } : undefined;
  }

  list(): ProviderProfile[] {
    return [...this.providers.values()]
      .sort((a, b) => a.priority - b.priority || compareProviderIds(a.id, b.id))
      .map((profile) => ({ ...profile, capabilities: [...profile.capabilities] }));
  }

  route(request: RouteRequest): RouteDecision | null {
    validateRequest(request);
    const selected = this.list().find(
      (profile) =>
        profile.enabled &&
        profile.maxPromptChars >= request.promptChars &&
        profile.capabilities.includes(request.capability),
    );
    if (!selected) return null;

    return {
      providerId: selected.id,
      capability: request.capability,
      complexity: request.complexity,
      reason: `selected lowest-priority-rank enabled provider supporting ${request.capability} within prompt limit`,
    };
  }
}

export const LIMITS = { MAX_PROVIDERS, MAX_PROVIDER_ID, MAX_PROMPT_CHARS } as const;
export * from './modelGateway.js';
export * from './voice.js';
