# 🔒 Security Configuration Guide

## Critical Security Issues Fixed

### ✅ 1. JWT Secret Key (CRITICAL)
**Status:** Fixed
- Removed hardcoded default value
- Requires `SECRET_KEY` environment variable on startup
- **Setup:**
  ```bash
  export SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
  ```

### ✅ 2. Admin Default Password (CRITICAL)
**Status:** Fixed
- Generates secure random password if `ADMIN_DEFAULT_PASSWORD` not set
- **Setup:**
  ```bash
  export ADMIN_DEFAULT_PASSWORD=$(python -c 'import secrets; print(secrets.token_urlsafe(16))')
  # OR generate once and save securely
  echo "Save this password securely - it's the initial admin password"
  ```

### ✅ 3. JWT Token Storage (HIGH)
**Status:** Fixed - Using httpOnly Secure Cookies
- Tokens no longer stored in localStorage (XSS protection)
- httpOnly cookies prevent JavaScript access
- Secure flag requires HTTPS
- SameSite=strict prevents CSRF
- **Frontend:** Token is managed by browser automatically

### ✅ 4. CORS Configuration (MEDIUM)
**Status:** Fixed
- Explicit allowed origins configuration
- **Setup:**
  ```bash
  export ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"
  ```
- Default (dev): `http://localhost:3000,http://localhost:8000`

### ✅ 5. Security Headers (MEDIUM)
**Status:** Fixed - Added middleware
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security: max-age=31536000` - Force HTTPS
- `Content-Security-Policy` - Restrict resource loading

### ✅ 6. Password Requirements (HIGH)
**Status:** Fixed
- Minimum 12 characters (was 6)
- Requires uppercase letters
- Requires numbers
- Requires special characters (!@#$%^&*-_=+)
- Applied to: user creation, password change, admin reset

### ✅ 7. Rate Limiting (MEDIUM)
**Status:** Fixed
- Login endpoint: 5 attempts per minute per IP/email
- Returns 429 if limit exceeded
- Prevents brute force attacks

### ✅ 8. Error Messages (MEDIUM)
**Status:** Fixed
- Generic error messages prevent user enumeration
- Login shows: "Invalid email or password" (same for both cases)
- Prevents attackers from discovering valid emails

### ✅ 9. Secure Session Management (HIGH)
**Status:** Fixed
- HttpOnly cookies with Secure and SameSite flags
- Automatic browser cookie handling
- No sensitive data in localStorage

### ✅ 10. Input Validation (MEDIUM)
**Status:** Improved
- All user inputs validated
- Email format validation
- Password complexity validation
- File upload size limits

---

## 🚀 Deployment Checklist

### Required Environment Variables
```bash
# CRITICAL - Must be set before first startup
SECRET_KEY=<generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'>
ADMIN_DEFAULT_PASSWORD=<or let it auto-generate on first boot>
ADMIN_DEFAULT_EMAIL=admin@yourdomain.com

# SECURITY - Configure for production
ALLOWED_ORIGINS=https://yourdomain.com

# Database (if using external DB)
DATABASE_URL=postgresql://user:pass@host/dbname
```

### HTTPS/TLS Configuration
```nginx
# Example Nginx config for reverse proxy
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Proxy to FastAPI
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Security
```dockerfile
# Use non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# No secrets in Dockerfile
ARG SECRET_KEY
# Pass via environment at runtime
```

### Database Security
- Use strong passwords for DB accounts
- Restrict DB access to application server only
- Enable connection encryption (SSL/TLS)
- Regular backups with encryption
- Enable audit logging

---

## 🛡️ Runtime Security Best Practices

### 1. Monitoring & Logging
```python
# Already implemented:
- Login attempts logged
- All admin actions logged (create/update/delete users)
- Failed authentication logged
```

### 2. Secrets Management
- Never commit `.env` files
- Use environment variables only
- Rotate secrets regularly
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### 3. Database
- Regular backups
- Encrypted at rest
- Encrypted in transit
- Access control (principle of least privilege)

### 4. API Rate Limiting
Current: 5 attempts/minute on login
Consider adding for other endpoints in production.

### 5. Session Management
- Token expiry: 12 hours (configured in `app/auth.py`)
- HttpOnly cookies (not accessible to JavaScript)
- Automatic cleanup on logout

### 6. Audit Trail
- All user creation/modification logged
- All password changes logged
- All deletions logged
- Include timestamps and user IDs

---

## 🔍 Security Testing

### Test CORS
```bash
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:8000/api/auth/login -v
# Should return 400/403 for unauthorized origins
```

### Test Rate Limiting
```bash
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "Status: %{http_code}\n"
done
# 6th attempt should return 429
```

### Test Security Headers
```bash
curl -I https://yourdomain.com
# Should show:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

### Test Password Validation
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"email":"new@test.com","password":"weak"}'
# Should return 400 with password requirements
```

---

## 📋 Additional Security Recommendations

### For Production
1. **Enable HTTPS everywhere** - Use Let's Encrypt (free)
2. **Set up WAF** - Use Cloudflare, AWS WAF, or similar
3. **Enable CSRF tokens** - Consider adding for state-changing operations
4. **Implement 2FA** - Add two-factor authentication for admin accounts
5. **Setup logging** - Central log aggregation (ELK, Datadog, etc.)
6. **Regular updates** - Keep dependencies updated
7. **Security scanning** - Use tools like OWASP ZAP, Snyk
8. **Penetration testing** - Regular security audits

### Code Quality
- Use `bandit` for security linting
- Run `safety check` for vulnerable dependencies
- Use type hints throughout codebase
- Enable strict mypy checking

### Third-Party Integrations
- Validate all external API responses
- Use API keys securely (environment variables)
- Implement request signing where available
- Monitor for API key leaks

---

## 🚨 Incident Response

If compromised:
1. **Rotate all secrets immediately**
2. **Reset all user passwords**
3. **Review access logs**
4. **Notify all users**
5. **Update security settings**

---

## 📞 Security Contact
Report security vulnerabilities responsibly to: [your-email]

Do NOT create public issues for security vulnerabilities.

---

*Last Updated: 2024-03-30*
*Security Audit Status: Complete - 10/10 issues fixed*
