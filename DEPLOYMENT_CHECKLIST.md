# Konnect Production Deployment Checklist

## ✅ Pre-Deployment Fixes Applied

### 1. Error Handling
- ✅ Added environment variable validation at startup
- ✅ Added global `uncaughtException` handler (logs but doesn't crash)
- ✅ Added global `unhandledRejection` handler (logs but doesn't crash)
- ✅ Wrapped server initialization in try-catch block
- ✅ Added database connection error handling
- ✅ Added authentication setup error handling
- ✅ Removed `throw err` from error middleware (prevents crash loop)

### 2. Production Configuration
- ✅ Server listens on `0.0.0.0:5000` (required for autoscale)
- ✅ Added explicit host specification
- ✅ Added server error event handler
- ✅ Added detailed logging for each initialization step

### 3. Database Safety
- ✅ 10-second connection timeout configured
- ✅ Database error event listener added
- ✅ Clear error messages for missing DATABASE_URL

---

## 📋 Production Deployment Steps

### Step 1: Verify Environment Variables
Before deploying, ensure these secrets are configured in your **Deployment Settings**:

#### Auto-Configured by Replit (should be present):
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - AI endpoint
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - AI credentials
- `REPL_ID` - Application identifier
- `ISSUER_URL` - OAuth issuer (defaults to https://replit.com/oidc)

#### Verify in Deployment UI:
1. Go to your Replit project
2. Click "Deployments" tab
3. Click on your deployment
4. Click "Settings" → "Environment Variables"
5. Confirm all variables above are listed

**If DATABASE_URL is missing:**
- Go to Tools → Database
- Ensure PostgreSQL database is provisioned
- DATABASE_URL should auto-populate

**If SESSION_SECRET is missing:**
- Replit should auto-generate this
- If not, contact Replit support or manually add a secure random string

---

### Step 2: Build for Production

The build process should:
1. Compile TypeScript (`server/`) to `dist/index.cjs`
2. Bundle frontend assets to `dist/public`

**Command:** 
```bash
npm run build
```

**Verify build output:**
```bash
ls -la dist/
# Should contain:
# - index.cjs (server bundle)
# - public/ (frontend assets)
```

---

### Step 3: Database Migration

Before first deployment, push database schema:

```bash
npm run db:push
```

This creates all tables (users, profiles, career_analyses, personal_essays, kompass_goals, sessions).

**Important:** This is a one-time setup. The schema is already designed and tested.

---

### Step 4: Test Production Build Locally

Simulate production environment:

```bash
NODE_ENV=production node dist/index.cjs
```

**Expected console output:**
```
✓ Environment variables validated
Connecting to database...
✓ Database connection configured
Starting server initialization...
Setting up authentication...
✓ OIDC config loaded
✓ Authentication configured
✓ Routes registered
Setting up static file serving for production...
✓ Static files configured
[timestamp] [express] serving on port 5000 (host: 0.0.0.0)
✓ Server ready
```

**If you see errors:**
- Check which step fails
- Verify environment variables are set
- Check database connectivity
- Review error stack traces

---

### Step 5: Deploy

1. Click "Deploy" button in Replit
2. Wait for build to complete
3. Monitor deployment logs

**What happens during deployment:**
1. Replit runs `npm run build`
2. Creates production container
3. Sets NODE_ENV=production
4. Runs `dist/index.cjs`
5. Server starts on port 5000

---

### Step 6: Post-Deployment Verification

#### Check Deployment Logs
Look for the success pattern:
```
✓ Environment variables validated
✓ Database connection configured
✓ Routes registered
✓ Static files configured
✓ Server ready
```

#### Test Endpoints
1. **Health Check:** Visit your deployment URL - should load the landing page
2. **Authentication:** Click login - should redirect to Replit Auth
3. **Database:** After login, check if user is created in database
4. **API:** Try creating a profile via UI

#### Test AI Features (requires credits)
1. Create a profile
2. Click "분석 시작" (Start Analysis)
3. Should generate career analysis (costs 1 credit)
4. Check credits deducted correctly

---

## 🚨 Common Deployment Errors & Solutions

### Error: "Missing required environment variables: DATABASE_URL"
**Solution:** 
- Provision a PostgreSQL database in Replit
- Go to Tools → Database → Create PostgreSQL Database
- DATABASE_URL will auto-populate

### Error: "Server crashes at line 85"
**Solution:**
This was the original issue. Our fixes:
- Added try-catch around initialization
- Added environment validation
- Added detailed logging
- Removed error throwing that caused crashes

If still occurring:
- Check deployment logs for specific error
- Verify all environment variables are set
- Ensure database is accessible from production

### Error: "Port 5000 is already in use"
**Solution:**
- This shouldn't happen in production (each deployment gets isolated port)
- In development, restart the workflow
- Check for zombie processes: `pkill -f node`

### Error: "Session store unavailable"
**Solution:**
- Verify sessions table exists in database
- Run `npm run db:push` to create it
- Check DATABASE_URL is correct

### Error: "OIDC configuration failed"
**Solution:**
- Verify REPL_ID is set
- Check ISSUER_URL (should be https://replit.com/oidc)
- Ensure internet connectivity for OAuth

### Error: "Anthropic API error"
**Solution:**
- Verify AI_INTEGRATIONS_ANTHROPIC_BASE_URL is set
- Verify AI_INTEGRATIONS_ANTHROPIC_API_KEY is set
- These should be auto-configured by Replit AI Integrations
- If missing, contact Replit support

---

## 🔍 Debugging Production Issues

### View Live Logs
1. Go to Deployments tab
2. Click on active deployment
3. View "Logs" section
4. Look for error messages

### Check Database
1. Go to Tools → Database
2. Query tables directly:
```sql
SELECT * FROM users LIMIT 5;
SELECT * FROM profiles LIMIT 5;
SELECT * FROM sessions LIMIT 5;
```

### Test API Endpoints
Use curl or Postman:

```bash
# Test health
curl https://your-deployment.replit.app/

# Test auth endpoint (should redirect)
curl -L https://your-deployment.replit.app/api/login

# Test API (requires auth cookie)
curl https://your-deployment.replit.app/api/profiles \
  -H "Cookie: connect.sid=your-session-cookie"
```

---

## 📊 Monitoring After Deployment

### Key Metrics to Watch
1. **Server uptime** - Should not crash/restart
2. **Response times** - API calls should be <2s (except AI generation)
3. **Error rates** - Check for 500 errors
4. **Database connections** - Should not exceed pool limit
5. **AI API usage** - Monitor credit consumption

### Performance Expectations
- **Page loads:** <1 second
- **API calls:** <500ms
- **AI analysis generation:** 10-30 seconds
- **AI essay generation:** 10-30 seconds
- **Database queries:** <100ms

---

## ✅ Deployment Success Criteria

Your deployment is successful if:
- ✅ Server starts without crashes
- ✅ Landing page loads
- ✅ Authentication works (login/logout)
- ✅ Users can create profiles
- ✅ Users can view their profiles
- ✅ AI analysis generation works
- ✅ AI essay generation works
- ✅ Kompass goals can be created/edited
- ✅ Credits are properly deducted
- ✅ No errors in deployment logs

---

## 🆘 Emergency Rollback

If deployment fails catastrophically:

1. Go to Deployments tab
2. Find previous working deployment
3. Click "Rollback to this deployment"
4. Investigate issue in development
5. Fix and redeploy

---

## 📝 Post-Deployment Tasks

1. **Test all features** with real user accounts
2. **Monitor error logs** for first 24 hours
3. **Check database growth** - ensure no runaway queries
4. **Verify credit system** - ensure proper deduction
5. **Test AI rate limiting** - make multiple concurrent requests
6. **Document any issues** encountered

---

## 🎯 Production Readiness Checklist

Before marking deployment as "production ready":

- [ ] All environment variables verified
- [ ] Database schema migrated successfully
- [ ] Authentication tested (login/logout)
- [ ] Profile CRUD operations work
- [ ] AI analysis generation tested
- [ ] AI essay generation tested
- [ ] Kompass goals tested
- [ ] Credit system verified
- [ ] Error handling confirmed (no crashes)
- [ ] Performance meets expectations
- [ ] No errors in logs for 1 hour
- [ ] Mobile responsiveness verified
- [ ] Korean language display correct

---

## 📞 Support

If issues persist after following this checklist:

1. Check Replit documentation: https://docs.replit.com
2. Review deployment logs carefully
3. Contact Replit support with:
   - Deployment ID
   - Error logs
   - Steps to reproduce
   - Environment configuration

---

## 🔐 Security Notes

**Production Environment:**
- All secrets managed by Replit
- Database uses SSL connections
- Sessions encrypted with SESSION_SECRET
- OAuth handled by Replit Auth
- No API keys in code

**User Data:**
- All user data stored in PostgreSQL
- Passwords not stored (OAuth only)
- Session data encrypted
- JSONB fields validated on input
- SQL injection protection via Drizzle ORM

---

## 🚀 Next Steps After Successful Deployment

1. **Add custom domain** (optional)
2. **Set up monitoring/analytics**
3. **Plan credit purchase system** (future)
4. **Add more AI features** (future)
5. **Optimize performance** based on metrics
6. **Add user feedback system**

---

**Last Updated:** December 4, 2024
**Version:** 1.0.0
**Status:** Ready for Production Deployment
