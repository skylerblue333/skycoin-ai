# Sky AI Routing Policy

Sky AI Routing Policy is a small provider-neutral TypeScript library for selecting a configured AI provider profile by declared capability, prompt-size limit, enabled state, and deterministic priority rank.

## Status

**Engineering beta.** This package is a routing-policy primitive only. It does not call OpenAI, Anthropic, Google, or any other model provider, and it does not claim that any specific model exists or is integrated.

The historical repository contained hard-coded model names, a nonexistent LLM import, simulated “military grade” AI/security responses, compliance labels, and fake `Tests passing`/`Build completed` scripts. Those unsupported surfaces are removed from the active product branch.

## Supported behavior

- register up to 100 provider profiles;
- declare provider capabilities such as `reasoning`, `vision`, `code`, `fast`, and `general`;
- bound provider IDs and prompt lengths;
- disable providers without deleting their configuration;
- rank providers deterministically with lower numeric priority preferred;
- reject routes that exceed a provider prompt limit;
- return `null` when no configured provider satisfies a request rather than fabricating a fallback;
- expose defensive copies of provider profiles.

## Example

```ts
import { AiRoutingPolicy } from './src';

const policy = new AiRoutingPolicy();
policy.register({
  id: 'reasoning-primary',
  capabilities: ['reasoning', 'general'],
  maxPromptChars: 100_000,
  enabled: true,
  priority: 10,
});

const decision = policy.route({
  capability: 'reasoning',
  complexity: 'high',
  promptChars: 12_000,
});
```

The returned `providerId` is a logical configuration identifier. A separate provider adapter is responsible for credentials, network requests, model identifiers, retries, streaming, rate limits, billing, and response validation.

## Verify

```bash
npm install
npm run build
npm test
npm audit --omit=dev --audit-level=high
```

## Security and operational boundaries

This library accepts metadata describing provider capabilities; it does not handle API keys or secrets. It performs no network I/O and provides no prompt-injection defense, content moderation, threat detection, model-output validation, cost accounting, telemetry, persistence, authentication, tenant isolation, high availability, or production deployment.

## SKYCOIN4444 integration

A future SKYCOIN4444 AI gateway can consume this policy to choose among separately configured provider adapters without coupling business logic to vendor-specific model names. Keeping routing policy separate from provider execution makes availability and security claims explicit and testable.

## License

See `LICENSE`.
