# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Bucketwise Planner, please report it responsibly.

**Do not open a public GitHub issue.** Instead:

1. **Email your report to:** [Add email or use GitHub Security Advisories]
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce (if possible)
   - Potential impact
   - Suggested fix (if you have one)

3. **Response timeline:**
   - We will acknowledge receipt within 48 hours
   - We will investigate and work on a fix within 7 days for critical issues
   - We will notify you when a fix is released

## Supported Versions

Currently, only the latest release version receives security patches:

| Version | Status |
|---------|--------|
| v0.1.0+ | ✅ Supported |
| < v0.1.0 | ❌ No longer supported |

## Security Best Practices

### For Users

1. **Never commit secrets** to the repository (.env files, API keys, passwords)
2. **Use strong JWT secrets** (minimum 32 characters, random)
3. **Rotate secrets regularly** if deployed in production
4. **Keep dependencies updated** via Dependabot or manual updates
5. **Enable HTTPS** in production (use a reverse proxy like Nginx or Caddy)
6. **Configure CORS** appropriately for your domain

### For Developers

1. **Input validation:** All API inputs validated via Zod schemas
2. **SQL injection prevention:** Use parameterized queries (node-postgres enforces this)
3. **Password hashing:** bcryptjs with 10 rounds (never plaintext)
4. **JWT secrets:** Must be >32 characters, never hardcoded
5. **Secrets management:** Use environment variables, never commit .env files
6. **Dependency scanning:** Monitor for vulnerabilities via npm audit or tools like Snyk

## Known Issues

Currently no known security issues. If you find one, please report it as described above.

---

**Thank you for helping keep Bucketwise Planner secure!**
