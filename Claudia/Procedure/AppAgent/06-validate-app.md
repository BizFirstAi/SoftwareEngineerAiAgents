# Procedure: Validate and Test App Before Publishing

Final verification that the app works correctly before publishing.

## When to Use

- Before publishing (required step)
- After major changes (pages, widgets, styling, content)
- When user reports issues rendering or navigating

## Test Checklist

### 1. Navigation & Structure

- [ ] All pages appear in page menu (`page-navigation` widget)
- [ ] Clicking page links navigates to correct page
- [ ] Default page loads when app first opens
- [ ] Back button works between pages
- [ ] Nested pages (if any) show correctly in tree menu

### 2. Widget Rendering

- [ ] All widgets render (not blank/missing)
- [ ] Content widgets show user's content
- [ ] Form widgets load their forms
- [ ] Media widgets (image, video, audio, pdf) show their content
- [ ] Galleries show items (live query working)
- [ ] Chat/workflow widgets have Execute/Chat buttons
- [ ] Auth widgets show sign-in when logged out, user menu when in

### 3. Styling & Theme

- [ ] Colors match chosen palette
- [ ] Fonts are readable (size, weight, spacing)
- [ ] Layout is clean (not cramped or too spread out)
- [ ] Sections have proper spacing (padding/margin)
- [ ] Background images/colors show correctly

### 4. Responsive Design

- [ ] Test on mobile width (320px)
- [ ] Test on tablet width (768px)
- [ ] Test on desktop width (1024px+)
- [ ] Layout doesn't break at any width
- [ ] Touch targets are large enough (mobile)
- [ ] Text doesn't overflow its container

### 5. Interactions (if applicable)

- [ ] Forms can be submitted
- [ ] Workflows can be triggered
- [ ] Chat can send messages
- [ ] All buttons/links work
- [ ] No JavaScript errors in console

### 6. Performance

- [ ] App loads quickly
- [ ] No memory/CPU warnings
- [ ] Images are optimized (not huge files)
- [ ] No network errors in Dev Tools

## Test Steps

1. **Open app in App Player** (not Designer canvas)
   - Use real Player URL: `/{appID}?tenantID=...`
   - OR via explicit page: `/​{appID}/page/{slug}`
   - NOT the Designer preview (different rendering path)

2. **Hard reload** (F5, not just refresh)
   - Clears cached CSS/JS
   - Ensures you're testing actual live data

3. **Check console** (DevTools)
   - Any errors? Fix them before publishing
   - Any warnings? Evaluate if they matter

4. **Test on different devices**
   - Use DevTools device emulation
   - Or test on actual phone/tablet if possible

5. **Ask user to review**
   - Show them the live app
   - Does it match what they wanted?
   - Any changes needed before publish?

## Common Issues & Fixes

| Issue | Likely Cause | Fix |
|-------|---|---|
| Widgets don't appear | Section doesn't exist | Create section before widgets |
| Content is blank | Config shape is wrong | Check widget config doc, verify `content`/`format` fields match |
| No page content on Player | Widget in non-primary section | Check `layout.appSections` for `isPrimaryContentSection: true`, move widget to that section |
| Styles missing | `allowScripts: true` flag stripping CSS | Remove flag or move `<style>` outside script block |
| Page doesn't load from menu | Page not set as default or menu widget not linked | Check `isDefault` flag, verify `page-navigation` widget config |
| Media doesn't show | URL is wrong or asset not public | Verify `IsPublicAsset: true`, check URL is accessible |

## Publishing Checklist

Before calling `publish_app`:

- [ ] All pages tested and working
- [ ] All widgets rendering correctly
- [ ] Styling looks good on mobile, tablet, desktop
- [ ] No console errors
- [ ] User has reviewed and approved
- [ ] User gave explicit yes to publish

## Knowledge

- [01-app-model.md](../../Knowledge/AppAgent/01-app-model.md) — Section scoping, page defaults, primary content
- [02-widget-types.md](../../Knowledge/AppAgent/02-widget-types.md) → specific widget docs for widget-specific testing
- [04-design-patterns.md](../../Knowledge/AppAgent/04-design-patterns.md) — Style issues, theme testing
- [05-integration-guide.md](../../Knowledge/AppAgent/05-integration-guide.md) — API patterns

## After Publishing

1. Confirm `publish_app` call succeeded
2. Show user final published URL
3. Celebrate! 🎉

---

**See Also:** [Create Empty App](01-create-empty-app.md) | [Add Widgets](04-add-widgets.md) | [Style & Theme](05-style-and-theme.md)
