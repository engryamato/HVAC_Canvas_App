# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of HVAC Canvas App seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email:** Send details to **[your-email@example.com]**
2. **GitHub Security Advisory:** Use the "Security" tab → "Report a vulnerability"
3. **Private Message:** Contact repository maintainers directly

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., XSS, SQL injection, remote code execution)
- **Full paths of source file(s)** related to the vulnerability
- **Location** of the affected source code (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact** of the vulnerability (what an attacker could do)
- **Suggested fix** (if you have one)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 5 business days
- **Fix Timeline:** Depends on severity
  - **Critical:** 1-7 days
  - **High:** 7-30 days
  - **Medium:** 30-90 days
  - **Low:** 90+ days or next release

### What to Expect

1. **Acknowledgment:** We'll confirm receipt of your report
2. **Investigation:** We'll investigate and validate the vulnerability
3. **Communication:** We'll keep you updated on our progress
4. **Resolution:** We'll work on a fix and coordinate disclosure
5. **Credit:** We'll credit you in the security advisory (unless you prefer to remain anonymous)

## Security Features

### Current Security Measures

**Code Security:**
- ✅ TypeScript for type safety
- ✅ ESLint for code quality
- ✅ Automated dependency updates via Dependabot
- ✅ CodeQL security scanning
- ✅ Dependency review on pull requests

**Build Security:**
- ✅ Environment variable validation
- ✅ Production build verification
- ✅ No debug mode in production
- ✅ Secure defaults enforced

**CI/CD Security:**
- ✅ Automated security scans
- ✅ Dependency vulnerability checks
- ✅ npm audit in CI pipeline
- ✅ Cargo audit for Rust dependencies
- ✅ License compliance checking

### Planned Security Improvements

- [ ] Code signing for desktop applications
- [ ] Automated vulnerability patching
- [ ] Security headers for web deployment
- [ ] Content Security Policy (CSP)
- [ ] Subresource Integrity (SRI)

## Security Best Practices

### For Contributors

1. **Never commit secrets** (API keys, passwords, tokens)
2. **Use environment variables** for sensitive data
3. **Validate all user input** before processing
4. **Sanitize data** before rendering or storing
5. **Follow least privilege principle** for permissions
6. **Keep dependencies up to date** (Dependabot will help)
7. **Run security scans** before submitting PRs

### For Users

1. **Keep the app updated** to the latest version
2. **Download only from official sources**
3. **Verify installer signatures** (when available)
4. **Use strong passwords** for accounts
5. **Report suspicious behavior** immediately

## Known Security Considerations

### Desktop Application (Tauri)

**Sandboxing:**
- Tauri provides process isolation
- WebView runs in separate process
- Limited system access by default

**IPC Security:**
- Commands require explicit allowlisting
- Type validation on all IPC calls
- No eval() or dynamic code execution

**File System Access:**
- Scoped to user's documents folder
- No access to system files
- All file operations are audited

### Web Application (Next.js)

**Client-Side Security:**
- No sensitive data in localStorage
- XSS protection via React
- CSRF protection built-in
- Secure session management

**API Security:**
- Input validation on all endpoints
- Rate limiting (planned)
- Authentication required (planned)
- CORS properly configured

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow the principle of coordinated vulnerability disclosure:

1. **Private Report:** You report the vulnerability privately
2. **Investigation:** We investigate and develop a fix
3. **Fix Release:** We release a patched version
4. **Public Disclosure:** We publish a security advisory
5. **Credit:** We credit the reporter (if desired)

**Timeline:** Typically 90 days from report to public disclosure

### Public Disclosure

We will publicly disclose vulnerabilities only after:
- A fix has been released
- Users have had time to update (typically 7-14 days)
- The reporter has been notified

## Security Advisories

### Where to Find Them

- **GitHub Security Advisories:** [Repository Security Tab](https://github.com/engryamato/HVAC_Canvas_App/security/advisories)
- **Release Notes:** Check CHANGELOG.md for security fixes
- **Dependabot Alerts:** Automated alerts for dependency vulnerabilities

### Severity Levels

We use CVSS (Common Vulnerability Scoring System) to rate vulnerabilities:

| Severity | CVSS Score | Response Time |
|----------|------------|---------------|
| Critical | 9.0 - 10.0 | 1-7 days |
| High | 7.0 - 8.9 | 7-30 days |
| Medium | 4.0 - 6.9 | 30-90 days |
| Low | 0.1 - 3.9 | 90+ days |

## Automated Security

### Dependabot

- **Schedule:** Weekly updates on Mondays
- **Scope:** npm, Cargo, GitHub Actions
- **Auto-merge:** Patch updates only (with passing CI)
- **Review Required:** Minor and major updates

### CodeQL Scanning

- **Schedule:** Weekly on Mondays + every push
- **Languages:** JavaScript, TypeScript
- **Queries:** Security-extended + quality checks
- **Reports:** Viewable in Security tab

### Dependency Review

- **Trigger:** Every pull request
- **Checks:** Vulnerabilities, licenses, supply chain risks
- **Threshold:** Moderate severity or higher
- **Action:** Fail PR if vulnerabilities found

## Security Tools

### Recommended Tools for Development

**Pre-commit Hooks:**
```bash
# Install pre-commit hooks
npm install --save-dev husky lint-staged

# Scan for secrets
npm install --save-dev detect-secrets
```

**Local Security Scanning:**
```bash
# npm audit
npm audit --audit-level=moderate

# Cargo audit
cargo audit

# License checker
npm install --save-dev license-checker
npx license-checker
```

**SAST (Static Analysis):**
```bash
# ESLint with security plugin
npm install --save-dev eslint-plugin-security

# SonarQube (optional)
npm install --save-dev sonarqube-scanner
```

## Compliance

### License Compliance

**Allowed Licenses:**
- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- CC0-1.0
- Unlicense

**Denied Licenses:**
- GPL-2.0, GPL-3.0 (copyleft)
- AGPL-3.0 (network copyleft)
- LGPL-2.1, LGPL-3.0 (weak copyleft)

### Data Privacy

**Local-First:**
- All data stored locally
- No cloud sync by default
- No telemetry or analytics
- No user tracking

**User Control:**
- Users own their data
- Export/import functionality
- No vendor lock-in
- Clear data policies

## Contact

### Security Team

- **Primary Contact:** [your-email@example.com]
- **Backup Contact:** [backup-email@example.com]
- **Response Time:** Within 48 hours

### Bug Bounty

Currently, we do not offer a bug bounty program. However, we greatly appreciate security researchers who responsibly disclose vulnerabilities and will:

- Credit you in our security advisories
- Mention you in release notes
- Thank you publicly (if you wish)

## Resources

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Tauri Security](https://tauri.app/v1/references/architecture/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### Learning Resources

- [Web Security Academy](https://portswigger.net/web-security)
- [Secure Code Warrior](https://www.securecodewarrior.com/)
- [SANS Security Training](https://www.sans.org/cyber-security-courses/)

## Changelog

### Security Updates

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of security fixes by version.

**Latest Security Fixes:**
- v1.0.0: Initial security audit completed
- Future releases will be listed here

---

**Last Updated:** 2025-01-15

**Version:** 1.0

**Contact:** security@hvaccanvasapp.com (replace with actual email)

Thank you for helping keep HVAC Canvas App secure! 🔒
