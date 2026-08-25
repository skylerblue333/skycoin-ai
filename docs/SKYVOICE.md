# SkyVoice (#95) — Speech Interface Boundary

Status: **engineering beta / deterministic planner**.

SkyVoice adds a provider-neutral speech-interface contract to the existing SKYCOIN4444 AI routing-policy library. It validates bounded transcription/synthesis request metadata and asks `AiRoutingPolicy` to select a provider that explicitly declares the `speech` capability.

## Implemented contract

`planVoiceRequest(policy, request)` accepts:
- operation: `transcribe` or `synthesize`
- bounded BCP-47-like language tag
- bounded positive input-size metadata
- optional complexity classification

It returns a deterministic plan containing the selected provider ID and routing reason, or `null` when no enabled speech-capable provider is registered.

## SKYCOIN4444 integration

Adjacent UI/chat/education components can construct a SkyVoice request and consume the plan without depending on a concrete speech vendor. Provider adapters remain outside this package. This keeps future SkyModelGateway/provider integration separable from the voice request contract.

## Security and truth boundary

This library does **not** capture microphone audio, store recordings, transcribe speech, synthesize audio, call a model/provider, handle API keys, perform biometric identification, verify speakers, moderate content, or claim production deployment. `inputSize` is planning metadata, not uploaded audio. Applications that later process recordings must add explicit consent, retention/deletion controls, authentication/authorization, transport security, provider-specific validation, and operational monitoring.
