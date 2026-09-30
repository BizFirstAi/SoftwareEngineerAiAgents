# App Creation Questionnaire

Welcome! This questionnaire will guide you through creating a web application with AppDeveloper. Answer each section, and we'll build your app step-by-step. You can always go back and revise your answers.

---

## **Section 1: Project & App Basics**

### 1.1 Project Name
**Question:** What is the name of your project?
- **Validation:** Alphanumeric + hyphens, 3-50 characters, unique
- **Example:** "customer-portal-2024", "internal-analytics"
- **Helper:** This organizes your project in the system. You can have multiple apps within one project.

### 1.2 App Name & Description
**Question:** What would you like to name this app?
- **Validation:** 2-100 characters
- **Example:** "Customer Dashboard", "Employee Directory"
- **Helper:** This is the title users see when they access your app.

**Question:** What is this app for? (Brief description)
- **Helper:** 1-2 sentences describing the main purpose. Example: "Allows customers to view their orders, invoices, and support tickets in one place."

### 1.3 Target Audience
**Question:** Who will use this app?
- **Options:**
  - Internal employees (company staff only)
  - External customers/partners (public or authenticated)
  - Mixed audience (both internal and external)
- **Helper:** This affects security, authentication, and design decisions.

**Question:** What industry/domain does this app serve?
- **Options:** Finance, Healthcare, E-commerce, Manufacturing, Education, Real Estate, HR/Payroll, Logistics, Media, Other
- **Recommendation:** Based on selection, we'll suggest relevant widgets and patterns.

### 1.4 App Type
**Question:** What type of app are you building?
- **Dashboard** — Visualize data, KPIs, metrics, reports
  - Recommended widgets: Charts, Data tables, Cards, Filters
  - Pages: 1-3 (Overview, Detailed reports, Settings)
  
- **Portal** — Self-service access to information and forms
  - Recommended widgets: Forms, Data tables, Status displays, Notifications
  - Pages: 3-7 (Home, Multiple sections, Account)
  
- **CMS** — Content management and publishing
  - Recommended widgets: Forms, Content editors, Media galleries, Publishing controls
  - Pages: 3+ (Dashboard, Content management, Preview)
  
- **E-Commerce** — Product browsing, cart, checkout
  - Recommended widgets: Product galleries, Search/filters, Shopping cart, Payment forms
  - Pages: 5-10 (Catalog, Product detail, Cart, Checkout, Orders)
  
- **Internal Tool** — Workflow management, data entry, team collaboration
  - Recommended widgets: Forms, Chat, Task lists, File upload, Notifications
  - Pages: 4-8 (Dashboard, Workflows, Team, Settings)
  
- **Custom** — Something else
  - Helper: Describe your specific needs

### 1.5 Template Preference
**Question:** How would you like to start?
- **Empty App** — Start from scratch (recommended for unique designs)
- **Use a Template** — Start from a pre-built template
  - Available templates:
    - "Corporate Dashboard" — Professional KPI dashboard
    - "Customer Portal" — Self-service customer access
    - "Team Collaboration" — Internal team workspace
    - "E-Commerce Store" — Product catalog and shopping
    - "Project Management" — Task/project tracking
- **Clone Existing App** — Start from an existing app in your project (if available)

**Recommendation:** If you're unsure, we recommend starting with "Empty App" and we'll guide you through adding pages and widgets.

---

## **Section 2: Information Architecture**

### 2.1 Page Structure
**Question:** How many pages will your app need?
- **Typical ranges:**
  - Simple app: 1-3 pages (Single page, home + settings)
  - Standard app: 3-7 pages (Home, multiple sections, account)
  - Complex app: 8-15+ pages (Multiple departments, admin areas)
- **Helper:** You can always add or remove pages later.

### 2.2 Define Each Page
**For each page, answer:**
- **Page Name:** (e.g., "Dashboard", "Orders", "Settings")
- **Purpose:** What does this page do? (e.g., "Shows user's active orders and status")
- **Parent Page:** (if this is a sub-page, which page is it under?)

**Example:**
```
Page 1: Dashboard
  Purpose: Overview of key information
  Parent: None (top-level)

Page 2: Orders
  Purpose: List and manage customer orders
  Parent: None (top-level)

Page 2.1: Order Details
  Purpose: View details of a specific order
  Parent: Orders
```

### 2.3 Navigation Structure
**Question:** How should users navigate between pages?
- **Flat Navigation** — All pages at same level (top menu bar)
  - Best for: Simple apps, 3-5 pages
  
- **Hierarchical** — Pages organized by section/department
  - Best for: Complex apps, 8+ pages
  - Example: Main sections (Admin, Reporting, Settings) with sub-pages
  
- **Tab-Based** — Related pages as tabs
  - Best for: Comparing similar data
  - Example: Orders, Invoices, Shipments as tabs

**Recommendation:** [Based on page count and type]

### 2.4 Common Layout Patterns
**Question:** Which layout pattern matches your app?
- **Two-Column** — Sidebar + main content (typical for portals)
- **Three-Column** — Sidebar + main + right panel (dashboards, admin tools)
- **Full-Width** — Single column, full width (simple content apps)
- **Card-Based Grid** — Dashboard with multiple cards

**Preview:** [Show visual mockup]

---

## **Section 3: Content & Features**

### 3.1 Widgets per Page
**For each page, select widgets needed:**

**Available Widgets (friendly names):**
- **Content** — Text, images, rich content display
- **Data Table** — Browse and filter data records
- **Form** — Collect user input (contact form, search, filters)
- **Chart/Graph** — Visualize data (bar, line, pie charts)
- **Image Gallery** — Show multiple images with lightbox
- **Video Player** — Embed and play videos
- **PDF Viewer** — Display PDF documents
- **Chat Panel** — Live chat or messaging interface
- **Workflow Trigger** — Launch a workflow/automation
- **Notifications** — Alert messages and updates
- **File Upload** — Allow users to upload files
- **Cards** — Summary cards with key metrics
- **Search & Filter** — Help users find data
- **Pagination** — Navigate through large datasets

**Example:**
```
Page: Dashboard
  - Cards (top metrics)
  - Charts (revenue, users, activity)
  - Data Table (recent activity)

Page: Orders
  - Search & Filter (find orders)
  - Data Table (list orders)
  - Workflow Trigger (export, refund)
```

### 3.2 Feature Prioritization
**Question:** Which features are essential (MVP) vs. nice-to-have?
- **MVP (Launch)** — Must have for initial release
- **Phase 2** — Add after launch
- **Future** — Future enhancements

**Example:**
```
MVP:
  - View orders (Data Table)
  - Search orders (Filter)
  - Basic reporting (Charts)

Phase 2:
  - Export to Excel
  - Customer notes
  
Future:
  - Advanced analytics
  - Predictive recommendations
```

---

## **Section 4: Design & Branding**

### 4.1 Color Scheme
**Question:** What colors represent your brand?
- **Option 1:** Use existing brand colors (provide hex codes)
- **Option 2:** Choose from preset palettes
  - Professional Blue
  - Modern Green
  - Bold Orange
  - Minimalist Gray
- **Option 3:** Choose a theme (Light, Dark, Auto-detect)

**Helper:** Colors are used for buttons, headers, highlights, and accents throughout the app.

### 4.2 Logo & Branding Assets
**Question:** Do you have a logo?
- **Yes** — Upload logo file
  - Recommended: PNG/SVG, 200x200px minimum
  - Placement: Top-left or centered header
- **No** — We can use a text-based header or placeholder

### 4.3 Typography
**Question:** What tone does your app convey?
- **Professional** — Formal, business-focused
- **Modern** — Clean, contemporary, minimalist
- **Friendly** — Approachable, warm, conversational
- **Technical** — Detail-oriented, precise

**Recommendation:** [Based on industry + audience, suggest font pairing]

### 4.4 Responsive Design
**Question:** What devices will users access from?
- **Desktop only** — Optimized for desktop/laptop
- **Responsive** — Works on desktop, tablet, mobile
- **Mobile-first** — Optimized for mobile, then tablet/desktop

**Helper:** Responsive design (recommended) ensures your app looks good on all screens. No extra work required—we handle it automatically.

### 4.5 Dark Mode Support
**Question:** Should your app support dark mode?
- **Yes** — Users can toggle between light/dark
- **No** — Light mode only
- **Auto** — Follow system preference (Windows/Mac dark mode setting)

### 4.6 Accessibility
**Question:** What accessibility level is required?
- **Basic** — WCAG AA (covers most users)
- **Full** — WCAG AAA (highest standard)
- **None** — Not required

**Helper:** Accessibility ensures users with vision/hearing impairments can use your app. Recommended for public apps.

---

## **Section 5: Integration & Data**

### 5.1 Data Sources
**Question:** Where is your data stored?
- **Database tables** — From BizFirst database (list available tables)
- **External API** — Third-party service (provide API endpoint)
- **Multiple sources** — Mix of database + APIs
- **Static content** — No dynamic data (static website)

**For each data source:**
- Name/description
- Fields to display
- Filters/search criteria
- Update frequency

### 5.2 Authentication & Access Control
**Question:** Who can access this app?
- **Public** — No login required (everyone can access)
- **Login required** — All users must sign in
- **Role-based** — Different access levels (Admin, User, Guest)

**For role-based access:**
- Define roles (Admin, Manager, User, Guest, etc.)
- Specify what each role can see/do
- Example: "Users see only their own data; Admins see all data"

### 5.3 Multi-Language Support
**Question:** Does your app need multiple languages?
- **Single language** — English only
- **Multiple languages** — Specify languages (English, Spanish, French, German, etc.)

**Helper:** Multi-language support adds minimal overhead. If you might need it later, it's easier to add now.

### 5.4 API Integrations
**Question:** Does your app integrate with external services?
- **No external integrations**
- **Email notifications** — Send emails from your app
- **Payment gateway** — Accept payments (Stripe, PayPal, etc.)
- **Calendar/scheduling** — Google Calendar, Outlook, etc.
- **File storage** — Google Drive, OneDrive, Dropbox
- **Third-party APIs** — Custom integrations (specify details)

---

## **Section 6: Deployment & Timeline**

### 6.1 Deployment Target
**Question:** Where will this app run?
- **Development** — Internal testing only, not visible to end users
- **Staging** — Preview environment for approval before production
- **Production** — Live app, available to real users
- **All environments** — Start in dev, move through staging to production

**Recommendation:** Start with Development or Staging; move to Production after testing.

### 6.2 Timeline & Urgency
**Question:** When do you need this app?
- **ASAP** — This week
- **Soon** — Within 2-3 weeks
- **Flexible** — 1-3 months
- **No rush** — Whenever it's ready

**Recommendation:** [Suggest realistic timeline based on complexity]

### 6.3 Performance Requirements
**Question:** How many concurrent users will access the app?
- **Low** — 1-100 users
- **Medium** — 100-1,000 users
- **High** — 1,000-10,000+ users

**Helper:** This helps us optimize performance and scale accordingly.

### 6.4 Security & Compliance
**Question:** Are there security or compliance requirements?
- **Standard** — Basic security (SSL, secure login)
- **Enhanced** — Data encryption, audit logs, access controls
- **Compliance** — HIPAA (healthcare), PCI-DSS (payments), GDPR (EU data), SOC 2

**Helper:** Specify any industry-specific requirements (healthcare, financial, legal, etc.)

---

## **Section 7: Review & Confirmation**

### 7.1 Summary
**Display:**
- Project name, app name, type
- Number of pages and widgets
- Key features (MVP + Phase 2)
- Design choices (colors, theme, responsive)
- Data sources and integrations
- Timeline and deployment target

### 7.2 Review & Modify
**Question:** Does everything look correct?
- **Yes, proceed** → Move to next step
- **Modify** → Which section? (Select section, edit, return to review)
- **Cancel** → Go back to main menu

### 7.3 Confirmation
**Final confirmation:**
"You're about to create a [App Type] app with [# pages] pages. Ready to build?"
- **Yes, let's build!** → Start app creation with AppDeveloper
- **Save for later** → Save questionnaire, come back later
- **Cancel** → Return to main menu

---

## **Section 8: Helper Prompts & Recommendations**

### 8.1 Intelligent Recommendations
**Based on user selections, suggest:**
- "For a customer portal with 5+ pages, we recommend hierarchical navigation with a sidebar."
- "Your app handles payments—we recommend role-based access (Customer vs. Admin) and audit logging."
- "You're building a dashboard. Consider these widgets: Cards for KPIs, Charts for trends, Tables for details."

### 8.2 Validation & Error Messages
- **Project name exists** → "This project name is already taken. Try: 'customer-portal-v2'"
- **No data source selected** → "Select at least one data source for your app to display data."
- **Too many pages** → "Consider breaking this into multiple apps or simplifying the design."

### 8.3 Tips & Best Practices
- "💡 **Tip:** Start with 3-5 pages for MVP. Add more later."
- "✓ **Best Practice:** Use role-based access to keep data secure and users focused on their tasks."
- "⚡ **Performance:** Limit charts to 1,000 data points for best performance."

---

## **Next Steps After Questionnaire**

Once questionnaire is complete:
1. **Review Summary** — Confirm all choices
2. **AppDeveloper Creates Project** → Initializes project and app
3. **Page Creation** → Adds pages in specified order
4. **Widget Configuration** → Adds widgets to each page with settings
5. **Design Application** → Applies colors, theme, responsive breakpoints
6. **Data Binding** → Connects data sources and APIs
7. **Testing Preview** → Show progress in browser, iterate based on feedback
8. **Deployment** → Push to target environment

---

## **Notes for AppDeveloper Agent**

- **Progress Tracking:** After each major step, refresh the browser and show user the result
- **Feedback Loop:** After pages are created, ask: "Does this match your vision? Any changes?"
- **Widget Configuration:** For each widget, provide a preview and ask for confirmation before moving to next
- **Document Decisions:** Store user choices in Rouge_Notes (Semantic type) for future reference
- **Graceful Decline:** At any step, user can decline and return to this menu or main menu
