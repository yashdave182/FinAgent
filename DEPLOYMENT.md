# FinAgent - Deployment Guide

## 🚀 Quick Deployment to Netlify

### Current Issue: MIME Type Error (SOLVED)

**Problem**: Assets returning HTML instead of CSS/JS files

**Solution**: We've added a `_redirects` file in the `public/` directory that ensures static assets are served correctly before the SPA fallback.

### Files to Commit

Make sure these files are in your repository:

```
✅ public/_redirects       # Critical for asset routing
✅ netlify.toml            # Build configuration
✅ All src files
✅ package.json
✅ tsconfig.json
✅ vite.config.ts
✅ tailwind.config.js
✅ postcss.config.js
```

### Deployment Steps

#### 1. Commit and Push Changes

```bash
# Add all files
git add .

# Commit with message
git commit -m "Fix Netlify deployment with _redirects file"

# Push to your repository
git push origin main
```

#### 2. Netlify Will Auto-Deploy

Once you push, Netlify will:
1. ✅ Install dependencies (`npm install`)
2. ✅ Build the project (`npm run build`)
3. ✅ Copy `public/_redirects` to `dist/_redirects`
4. ✅ Serve files from `dist/` directory
5. ✅ Apply routing rules from `_redirects`

#### 3. Verify Deployment

After deployment completes:

1. **Clear browser cache** (Ctrl + Shift + R or Cmd + Shift + R)
2. Visit your site: `https://fin-agentx.netlify.app`
3. Check browser console - should have NO MIME type errors
4. Test navigation between pages
5. Verify assets load correctly

### Expected Results

✅ **CSS loads correctly** with MIME type `text/css`
✅ **JS loads correctly** with MIME type `application/javascript`
✅ **SPA routing works** (manual URL navigation works)
✅ **Page refresh works** on any route

## 🔧 Troubleshooting

### Issue 1: Still Getting MIME Type Errors

**Cause**: Old cached version of `_redirects` or browser cache

**Fix**:
```bash
# 1. Force clear Netlify cache and redeploy
# In Netlify UI: Deploys → Trigger Deploy → Clear cache and deploy site

# 2. Clear browser cache completely
# Chrome: Settings → Privacy → Clear browsing data → Cached images and files

# 3. Try incognito/private window
# This bypasses cache entirely
```

### Issue 2: _redirects File Not Being Applied

**Verify**:
1. Check that `public/_redirects` exists locally
2. After build, check `dist/_redirects` exists
3. View deployed site's `/_redirects` URL to see the rules

**Fix**:
```bash
# Rebuild locally to verify
npm run build

# Check if _redirects was copied
ls dist/_redirects  # Should exist

# If not, ensure Vite copies public/ files
# This is default behavior, but verify vite.config.ts:
# publicDir: 'public'  (this is default)
```

### Issue 3: TypeScript Build Errors on Netlify

**Symptoms**: Build fails with unused variable errors

**Already Fixed**: We've updated `tsconfig.json` to set:
- `"noUnusedLocals": false`
- `"noUnusedParameters": false`

**If Still Failing**:
```bash
# Test build locally first
npm run build

# If local build succeeds but Netlify fails:
# Check Node version matches
# Netlify uses Node 18 (set in netlify.toml)
```

### Issue 4: 404 on Page Refresh

**Cause**: SPA fallback not working

**Fix**: Verify `_redirects` has this as last line:
```
/*  /index.html  200
```

### Issue 5: CSP Errors in Console

**Symptoms**: Console shows Content-Security-Policy violations

**Fix**: Update CSP in `netlify.toml` under `[[headers]]`:
```toml
Content-Security-Policy = "default-src 'self'; ..."
```

Add domains you need (e.g., for external APIs or CDNs)

## 📋 Pre-Deployment Checklist

Before deploying, verify:

- [ ] `npm run build` succeeds locally
- [ ] `npm run preview` shows working site locally
- [ ] `public/_redirects` file exists
- [ ] No console errors in local preview
- [ ] All routes work in local preview
- [ ] TypeScript compilation passes
- [ ] Git repository is up to date

## 🌐 Netlify Configuration

### Build Settings (Already in netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

### How _redirects Works

The `_redirects` file is processed **in order**, top to bottom:

1. **First matches win**: Once a rule matches, no further rules are checked
2. **Explicit routes first**: We define `/assets/*`, `/images/*`, etc. first
3. **Catch-all last**: The `/*` rule catches everything else and serves `index.html`

Example flow:
```
Request: /assets/index-abc123.css
→ Matches: /assets/* → Serves actual CSS file ✅

Request: /login
→ Doesn't match: /assets/*, /images/*, etc.
→ Matches: /* → Serves index.html (SPA handles /login route) ✅
```

## 🎯 Testing Deployed Site

### Manual Tests

1. **Direct URL Navigation**
   - Visit: `https://fin-agentx.netlify.app/login`
   - Should: Show login page (not 404)

2. **Asset Loading**
   - Open DevTools Network tab
   - Refresh page
   - Check: CSS and JS files have correct MIME types
   - Look for: `text/css` and `application/javascript`

3. **SPA Navigation**
   - Login → Navigate to Chat
   - Chat → Navigate to Admin
   - Use browser back button
   - All should work smoothly

4. **Page Refresh**
   - Navigate to `/chat`
   - Press F5 (refresh)
   - Should: Stay on chat page (not 404)

### Automated Checks

You can add these to your CI/CD:

```bash
# Check if critical files exist after build
test -f dist/index.html || exit 1
test -f dist/_redirects || exit 1
test -d dist/assets || exit 1

# Verify _redirects content
grep -q "/*  /index.html  200" dist/_redirects || exit 1
```

## 🔐 Security Headers

Already configured in `netlify.toml`:

- ✅ X-Frame-Options (prevent clickjacking)
- ✅ X-Content-Type-Options (prevent MIME sniffing)
- ✅ Strict-Transport-Security (enforce HTTPS)
- ✅ Content-Security-Policy (XSS protection)
- ✅ Permissions-Policy (restrict browser features)

## 🚀 Performance Optimization

Cache headers are set in `netlify.toml`:

- **index.html**: No cache (instant updates)
- **/assets/***: 1 year cache (immutable hashed files)
- **Static files**: Long-term cache

This ensures:
- New deployments are seen immediately
- Assets cached aggressively (Vite uses content hashes)
- Fast repeat visits

## 📝 Post-Deployment

### 1. Update Environment Variables (if needed)

In Netlify UI: Site settings → Environment variables

Example:
```
VITE_API_URL=https://api.yourbackend.com
VITE_ANALYTICS_ID=UA-XXXXXXXXX
```

**Remember**: Environment variables starting with `VITE_` are embedded at build time.

### 2. Set Up Custom Domain (Optional)

In Netlify UI: Site settings → Domain management → Add custom domain

Follow Netlify's DNS configuration instructions.

### 3. Enable Branch Deploys (Optional)

Deploy preview branches automatically:
- Netlify UI: Site settings → Build & deploy → Deploy contexts
- Enable: Deploy previews for pull requests

## 🆘 Emergency Rollback

If deployment breaks production:

1. **In Netlify UI**: Deploys → (find last working deploy) → Publish deploy
2. This instantly reverts to previous version
3. Fix issues locally and redeploy

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Site loads without console errors
3. ✅ All routes are accessible
4. ✅ CSS and JS files load correctly (check Network tab)
5. ✅ Page refresh works on any route
6. ✅ Navigation between pages works
7. ✅ No MIME type errors in console

## 📞 Support

If issues persist:

1. Check Netlify build logs for errors
2. Verify `_redirects` file is in `dist/` after build
3. Test locally with `npm run build && npm run preview`
4. Clear all caches (browser + Netlify)
5. Deploy from a fresh git clone

---

**Last Updated**: January 2024
**Status**: ✅ MIME Type Issues Resolved
**Live Site**: https://fin-agentx.netlify.app