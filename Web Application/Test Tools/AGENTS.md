# AGENTS

# agent.md

## AI Multi-Agent Workflow

This project uses a multi-agent workflow for development and testing processes.

---

# Workflow Overview

```text
User Prompt
   ↓
dev-agent
   ↓
test-agent
```

## Agent Routing Rules

### Development Related Tasks

If the user request is related to:

- Development
- Coding
- Refactoring
- API implementation
- Bug fixing
- Script generation
- Backend/Frontend implementation
- Database logic
- DevOps
- Automation
- Infrastructure code

Use: dev-agent
Agent definition file: .agents/\_ai-agent-assistant/four-noble-truths-framework/dev-agent.md

#### dev-agent Rules

- dev-agent must primarily follow the user prompt.
- If no ba-agent exists, dev-agent is responsible for understanding business requirements directly from the user prompt.
- dev-agent should:
  - Analyze requirements
  - Implement solution
  - Explain technical decisions
  - Validate implementation
  - Prepare testing handoff

After development is completed: Automatically continue workflow with test-agent.

### Testing Related Tasks

If the task is related to:

- QA
- Testing
- Validation
- Functional testing
- Regression testing
- API testing
- Test case generation
- Root cause analysis
- UAT validation
- Post-development verification

Use: test-agent
Agent definition file: .agents/\_ai-agent-assistant/four-noble-truths-framework/test-agent.md

#### test-agent Rules

- test-agent validates outputs from dev-agent.
- test-agent should:
  - Verify requirement coverage
  - Generate test cases
  - Validate edge cases
  - Detect regressions
  - Validate API behavior
  - Verify error handling
  - Review integration impacts
  - Produce bug reports if defects are found

## Handoff Workflow

When dev-agent finishes implementation, provide:

- Summary of implementation
- Files changed
- Technical assumptions
- Known limitations
- Suggested testing scope

Then continue with: test-agent validation workflow

## Priority Order

Agents must follow this order of priority:

1.User Prompt
2.agent.md workflow rules
3.Agent-specific instructions
4.Repository conventions

If conflicts occur: Prioritize the user prompt.
