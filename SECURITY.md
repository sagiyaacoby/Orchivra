# Security Policy

## Reporting a Vulnerability

If you find a security vulnerability in Orchivra, please report it privately. Do not open a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/sagiyaacoby/Orchivra/security/advisories/new) when enabled. If it is unavailable, contact [the maintainer](https://github.com/sagiyaacoby) to arrange a private channel before sharing vulnerability details.

Include:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment (what could an attacker do?)
- Any suggested fixes, if you have them

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Assessment:** Within 7 days
- **Fix or mitigation:** Depends on severity, but we aim for 30 days for critical issues

## Scope

The following are in scope:
- Orchivra server (`server.js`) and API endpoints
- Dashboard portal (`portal/`)
- Agent execution and task system
- Secrets vault and credential storage
- File system access controls

Out of scope:
- Issues in third-party dependencies (report those upstream)
- Social engineering attacks
- Denial of service via resource exhaustion on local installs

## Credit

We're happy to credit security researchers who report valid vulnerabilities. Let us know in your report if you'd like to be acknowledged.

## No CLA Required

You don't need to sign a CLA to submit security fixes. Just open a PR.
