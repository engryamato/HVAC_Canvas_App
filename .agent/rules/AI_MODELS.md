---
trigger: always_on
priority: p0
critical: true
---

# AI MODELS RESTRICTION - HARDWIRED CONFIGURATION

> **VERSION**: 1.1
> **STATUS**: CRITICAL - CANNOT BE OVERRIDDEN
> **LAST UPDATED**: 2025-02-13
> **REQUIRES USER APPROVAL TO MODIFY**

---

## 🚨 CRITICAL RULE: AUTHORIZED MODELS ONLY

**THIS IS A HARDWIRED RESTRICTION.** The system is configured to use **ONLY** the AI models listed below. No other models may be used under any circumstances.

### ✅ ALLOWED MODEL PROVIDERS

| Provider | Status | Models |
|----------|--------|--------|
| **Google Gemini** | ✅ AUTHORIZED | gemini-2.0-pro-preview |
| **OpenAI** | ✅ AUTHORIZED | gpt-codex-5.3 |

### ❌ PROHIBITED MODEL PROVIDERS

| Provider | Status | Reason |
|----------|--------|--------|
| **Google Gemini (other models)** | ❌ BLOCKED | Only gemini-2.0-pro-preview is authorized |
| **OpenAI (other models)** | ❌ BLOCKED | Only gpt-codex-5.3 is authorized |
| **Anthropic Claude** | ❌ BLOCKED | Not in authorized list |
| **Mistral AI** | ❌ BLOCKED | Not in authorized list |
| **Cohere** | ❌ BLOCKED | Not in authorized list |
| **AI21 Labs** | ❌ BLOCKED | Not in authorized list |
| **Meta (Llama)** | ❌ BLOCKED | Not in authorized list |
| **Any local/OSS models** | ❌ BLOCKED | Not in authorized list |
| **Any other provider** | ❌ BLOCKED | Not in authorized list |

---

## 🔒 ENFORCEMENT MECHANISM

### 1. Agent-Level Enforcement

Every agent file MUST specify a model from the ALLOWED list:

```yaml
---
name: agent-name
description: ...
model: gemini-2.0-pro-preview  # ✅ MUST be from allowed list
tools: ...
skills: ...
---
```

### 2. Model Inheritance Rule

If an agent specifies `model: inherit`, the parent/orchestrator MUST use an allowed model. The inheritance chain must resolve to an allowed model.

### 3. Runtime Validation

**BEFORE invoking ANY agent:**
1. Check the agent's `model` field
2. Verify it exists in the ALLOWED MODELS list below
3. If not allowed → STOP and report error

---

## 📋 COMPLETE ALLOWED MODELS LIST

### Google Gemini Models

| Model Name | Use Case | Tier |
|------------|----------|------|
| `gemini-2.0-pro-preview` | Complex reasoning, coding, analysis | Premium |

### OpenAI Models

| Model Name | Use Case | Tier |
|------------|----------|------|
| `gpt-codex-5.3` | Advanced coding, complex tasks | Premium |

---

## ⚠️ VIOLATION HANDLING

### If a Model is Requested Outside Allowed List:

```
❌ VIOLATION: Model '{model-name}' is NOT in the authorized models list.

AUTHORIZED MODELS:
- Google Gemini: gemini-2.0-pro-preview
- OpenAI: gpt-codex-5.3

CURRENT REQUEST: {model-name}

ACTION REQUIRED:
1. Use an equivalent model from the allowed list
2. See AI_MODELS.md for alternatives
3. Contact system administrator to update authorized models

ALLOWED ALTERNATIVES:
- For coding tasks: gpt-codex-5.3, gemini-2.0-pro-preview
- For analysis tasks: gemini-2.0-pro-preview
```

### If Agent Has Invalid Model:

```
❌ AGENT CONFIGURATION ERROR: Agent '{agent-name}' uses unauthorized model '{model}'.

MUST UPDATE agent file: .agent/agents/{agent-name}.md
Change: model: {invalid-model}
To: model: [ALLOWED MODEL FROM LIST]

See AI_MODELS.md for authorized models.
```

---

## 📝 AGENT CONFIGURATION TEMPLATES

### Template for New Agents

```markdown
---
name: my-agent
description: Agent description here
# ✅ MUST use allowed model
model: gemini-2.0-pro-preview
tools: Read, Write, Edit
skills: clean-code
---

# Agent Content Here
```

### Recommended Model by Use Case

| Use Case | Recommended Model |
|----------|-------------------|
| **Orchestration** | `gemini-2.0-pro-preview` |
| **Code Generation** | `gpt-codex-5.3` |
| **Code Review** | `gpt-codex-5.3` |
| **Fast Tasks** | `gpt-codex-5.3` |
| **Documentation** | `gemini-2.0-pro-preview` |
| **Complex Analysis** | `gemini-2.0-pro-preview` |
| **Design/UI** | `gemini-2.0-pro-preview` |
| **Testing** | `gpt-codex-5.3` |

---

## 🔄 UPDATING AUTHORIZED MODELS

**CRITICAL**: This file can only be modified with explicit user approval.

### Process to Add New Models:

1. User must explicitly request model addition
2. Document the business case
3. User must approve the specific change
4. Update this file with new model
5. Document the change in CHANGELOG

### Current Authorized Configuration

```yaml
# AI_MODELS.yaml - Internal Configuration
authorized_providers:
  - google_gemini
  - openai

authorized_models:
  google_gemini:
    - gemini-2.0-pro-preview
  openai:
    - gpt-codex-5.3

blocked_providers:
  - anthropic
  - mistral
  - cohere
  - ai21
  - meta
  - local_models
  - all_others

blocked_models:
  google_gemini:
    - gemini-1.5-pro
    - gemini-1.5-flash
    - gemini-2.0-flash
    - gemini-ultra
  openai:
    - gpt-4o
    - gpt-4o-mini
    - gpt-4-turbo
    - gpt-4
    - gpt-3.5-turbo
    - o1
    - o1-mini
    - o3-mini

default_model: gemini-2.0-pro-preview
fallback_model: gpt-codex-5.3
```

---

## ✅ COMPLIANCE CHECKLIST

When creating or modifying agents:

- [ ] Agent's `model` field is from ALLOWED MODELS list
- [ ] Model is spelled exactly as listed (case-sensitive)
- [ ] Not using `latest` or auto-updating aliases
- [ ] Not using `inherit` without verifying parent model
- [ ] Test agent initialization confirms allowed model

---

## 🛡️ SECURITY NOTES

1. **No Model Fallbacks**: If specified model unavailable, FAIL rather than fallback to unauthorized model
2. **Explicit Only**: No wildcards, aliases, or "latest" tags
3. **Audit Trail**: All model usage should be logged
4. **Version Lock**: Pin to specific model versions when possible

---

## 📞 ESCALATION

If a task genuinely requires a model outside this list:

1. STOP the current workflow
2. Inform the user of the restriction
3. Request explicit approval to use alternative model
4. Document the exception
5. Do NOT proceed without written approval

---

**END OF AI MODELS CONFIGURATION**

> **REMINDER**: This configuration is HARDWIRED and takes precedence over all other settings.
> Only the user can authorize modifications to this file.
