# SkyModelGateway — Wave 2 slot #92

SkyModelGateway is a bounded engineering-beta routing-policy core. It selects a configured model target deterministically by requested capability, optional preferred provider, priority, and stable target-id tie breaking.

## Integration contract

- Request: `sky.model.route.v1`
- Decision: `sky.model.route.decision.v1`
- Provider invocation: **false**
- Prompt storage: **false**

The decision can be consumed by a separately authenticated/provider-connected adapter. Keeping routing policy separate from provider execution prevents this library from implying network connectivity it does not possess.

## Limitations

No external AI/model provider is contacted. There is no inference execution, credential management, billing, quotas, model-quality evaluation, prompt/content safety service, durable registry, availability probing, failover networking, compliance certification, or verified production deployment.
