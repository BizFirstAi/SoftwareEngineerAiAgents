# Questionnaire Examples — Guided Agent Interactions

**How agents guide users through complex tasks step-by-step with recommendations, examples, and choices.**

---

## Example 1: AppQuestionnaire Sample Run

### Scenario: Building an E-commerce Customer Portal

```
────────────────────────────────────────────────────────────────
APPAGENT: Welcome! I'm AppDeveloper, and I'll guide you through 
building your web app. Let's start simple.

What's your app about? (describe briefly)
────────────────────────────────────────────────────────────────

USER: I want to build a customer portal where people can view 
their orders and manage their account

APPAGENT: ✓ Great! Customer portal — that's typically a Dashboard 
type app. Let me show you recommended patterns:

  [Template Preview]
  📊 Generic Portal     — Flexible, bare-bones (recommended)
  🛒 E-commerce Portal  — Orders, products, checkout
  💼 B2B Portal         — Invoices, contracts, analytics
  
Would any of these help you? Or start from scratch?

USER: E-commerce Portal sounds perfect

APPAGENT: Excellent choice! E-commerce portals typically need:

  ✓ Login/authentication
  ✓ Product browsing
  ✓ Shopping cart
  ✓ Order history
  ✓ Account settings
  ✓ Support/contact
  
Does this match what you need?

USER: Yes, looks good

APPAGENT: Perfect! Now let's plan your pages.

[PROGRESS: Step 2 of 6 ▓░░░░░░]

How many pages do you want to start with?

  Recommended for e-commerce: 5-7 pages
  - Home (featured products, promotions)
  - Products (catalog, search, filters)
  - Cart (review items, checkout)
  - Orders (order history, tracking)
  - Account (profile, settings, preferences)
  - Support (FAQ, contact)
  - Logout

USER: Let's start with 4 pages: Home, Products, Cart, Orders

APPAGENT: Smart approach — we can add more later! 

Now let's configure each page. Starting with:

[PAGE 1: Home]

What content should appear on the Home page?

  Recommended:
  • Hero banner (promotion, welcome message)
  • Featured products grid (4-6 items)
  • Categories section (browse by type)
  • Newsletter signup
  • Footer (links, socials)

USER: Yes, all of those sound good

APPAGENT: Great! [Visual preview shows layout]

Here's your Home page structure:
┌─────────────────────────────────┐
│         Hero Banner             │  Hero image + call-to-action
├─────────────────────────────────┤
│  Featured Products Grid (6)     │  Product cards with images
├─────────────────────────────────┤
│  Categories Section             │  Browse by category
├─────────────────────────────────┤
│  Newsletter Signup Form          │  Email capture
├─────────────────────────────────┤
│  Footer                         │  Links, social, contact
└─────────────────────────────────┘

Ready to move to Products page? [Yes / Refine Home / Skip to Review]

USER: Yes, move on

APPAGENT: [PAGE 2: Products]

The Products page needs to help customers find items. What layout 
would you prefer?

  Recommended layouts:
  • Grid (3-4 columns) — Most common for e-commerce
  • List (full width) — Better for detailed comparisons
  • Masonry (Pinterest-style) — Visually interesting

USER: Grid layout, 3 columns

APPAGENT: Perfect! Your Products page will have:

✓ Search bar (top)
✓ Category filters (sidebar)
✓ Product grid (3 columns)
✓ Sorting options (price, popularity, rating)
✓ Product detail popup

Ready to continue? [Yes / Refine / Back]

USER: Yes

APPAGENT: [PAGE 3: Cart & PAGE 4: Orders — continues similarly]

Summary so far:
═══════════════════════════════════════════════════════════════

📋 Your E-commerce Customer Portal

Pages:
  1. Home — Hero, Featured products, Categories, Newsletter
  2. Products — 3-column grid, Search, Filters, Sorting
  3. Cart — Review items, Quantity, Checkout button
  4. Orders — Order history, Status, Tracking

Styling:
  Colors: Brand colors? [Select or Default]
  Mobile-friendly: Yes
  Responsive breakpoints: Mobile, Tablet, Desktop

[PROGRESS: Step 5 of 6 ▓▓▓▓▓░░]

═══════════════════════════════════════════════════════════════

Ready to build? [Yes, build! / Edit something / Go back to menu]

USER: Yes, build!

APPAGENT: Building your app... Creating pages, configuring widgets...

[15 seconds later]

✅ Home page created!
  └─ Hero banner added
  └─ Featured products grid added (empty, ready for products)
  └─ Categories section added
  └─ Newsletter form added
  └─ Footer added

Would you like to see it? I can open it in the browser.

[Shows: Screenshot of Home page in browser window]

Happy with the Home page? [Yes / Make changes / Continue to Products]

USER: Looks great, continue

[App building continues incrementally, with verification after each page]
```

---

## Example 2: WorkflowQuestionnaire Sample Run

### Scenario: Building a Customer Order Processing Workflow

```
────────────────────────────────────────────────────────────────
WORKFLOWAGENT: Welcome! I'll help you build a workflow. 

What workflow are you building?
(Brief description of what it should do)
────────────────────────────────────────────────────────────────

USER: I need to process customer orders automatically. When someone 
submits an order, validate it, check inventory, process payment, 
and send a confirmation.

WORKFLOWAGENT: Perfect! Customer order processing — that's a 
classic workflow.

Let me ask: How does the workflow get triggered?

  Options:
  ✓ Form submission (customer submits order form)
  ☐ Scheduled (every hour, daily, etc.)
  ☐ API call (external system triggers it)
  ☐ Manual (someone clicks a button)
  ☐ Event (something happens in database)

Most e-commerce flows: Form submission

USER: Yes, form submission

WORKFLOWAGENT: Good! So workflow starts when customer submits order.

[PROGRESS: Step 2 of 7 ▓░░░░░░]

What happens next? Here are common order processing steps:

  Typical sequence:
  1. Receive order (capture data)
  2. Validate order (check required fields, amounts)
  3. Check inventory (confirm items in stock)
  4. Process payment (charge card)
  5. Send confirmation (email customer)
  6. Create shipping label (hand off to logistics)

Does this match your process? Anything to add/remove?

USER: Looks good, but we also need to handle payment failures

WORKFLOWAGENT: Excellent point! Error handling is critical.

So your workflow structure:

  ┌─ Receive Order ─┐
  │                │
  ├─ Validate ─────┤
  │    (Error path)├─→ Send error email + Stop
  │                │
  ├─ Check Inventory
  │    (Error path)├─→ Send "out of stock" + Stop
  │                │
  ├─ Process Payment
  │    (Error path)├─→ Retry 3x, then Send "payment failed" + Stop
  │                │
  ├─ Send Confirmation
  │                │
  └─ Create Shipping Label

Does this look right?

USER: Yes, perfect!

WORKFLOWAGENT: Great! Now let's configure each step.

[STEP 1: VALIDATE ORDER]

Where's your order data coming from?

  ✓ Form submission (what we're using)
  Validate these fields:
  • Email (required, valid format)
  • Product IDs (required, exist in catalog)
  • Quantities (required, positive numbers)
  • Address (required, valid)
  • Payment method (required, valid)

Any other validation rules?

USER: Check that customer has no outstanding disputes

WORKFLOWAGENT: Added! Will query customer record for disputes.

[STEP 2: CHECK INVENTORY]

Where's your inventory data?

  Options:
  ☑ Database (internal)
  ☐ API (external system)
  ☐ Spreadsheet
  ☐ Real-time sync (Shopify, etc.)

USER: Database

APPAGENT: Which database and table?

USER: Postgres, products table, check "stock_quantity" column

WORKFLOWAGENT: Perfect! For each product in order, 
  IF stock_quantity < order_quantity → Out of stock

[STEP 3: PROCESS PAYMENT]

What payment processor?

  ✓ Stripe (recommended, most reliable)
  ☐ PayPal
  ☐ Square
  ☐ Custom (direct bank)

USER: Stripe

WORKFLOWAGENT: Need your Stripe API credential.

  Do you have it configured? [Yes / Create new / Skip for now]

USER: I have it

WORKFLOWAGENT: Which credential? [Dropdown: Stripe-Prod, Stripe-Test]

USER: Stripe-Prod

WORKFLOWAGENT: Got it! For payment failures:

  Retry strategy:
  ☐ No retry (fail immediately)
  ☐ Retry 1x
  ✓ Retry 3x with 5-second delay
  ☐ Retry until timeout (60 seconds)

USER: Retry 3x sounds good

[STEP 4: SEND CONFIRMATION]

Which notification channels?

  ✓ Email (customer email from form)
  ☐ SMS (if phone provided)
  ☐ Slack (notify admin)
  ☐ In-app (if using your app)

USER: Email to customer

WORKFLOWAGENT: Email template:

  Subject: Order confirmation #{orderID}
  Body: 
    Thank you for your order!
    Order ID: {orderID}
    Total: ${amount}
    Items: {itemList}
    Tracking will be sent to {email}

Want to customize this? [Yes / Use template / Skip]

USER: Use template

[Configuration continues for Step 5, 6...]

WORKFLOWAGENT: [FINAL REVIEW]

═══════════════════════════════════════════════════════════════

📊 Your Order Processing Workflow

Trigger: Form submission (order_form)

Steps:
  1. Validate Order
     └─ Check: email, products, qty, address, disputes
     └─ Error: Send error email → Stop
  
  2. Check Inventory
     └─ Query: products table
     └─ Error: Send "out of stock" → Stop
  
  3. Process Payment (Stripe)
     └─ Retry: 3x with 5-sec delay
     └─ Error: Send "payment failed" → Stop
  
  4. Send Confirmation Email
     └─ Template: Order receipt with ID + total
  
  5. Create Shipping Label
     └─ Hand off to logistics system

Estimated execution time: 5-10 seconds per order

[PROGRESS: Step 7 of 7 ▓▓▓▓▓▓▓]

═══════════════════════════════════════════════════════════════

Ready to build this workflow? [Yes, build! / Edit / Back to menu]

USER: Yes, build!

WORKFLOWAGENT: Building workflow... Creating nodes, setting up 
error paths, configuring integrations...

✅ Workflow "Order Processing" created!
  └─ Validation node added
  └─ Inventory check node added
  └─ Payment node (Stripe) added
  └─ Email notification node added
  └─ Shipping label node added

Testing the workflow...

✅ All nodes validated successfully!

[Shows: Workflow diagram in browser]

Ready to deploy? [Deploy now / Test first / Edit]

USER: Test first

WORKFLOWAGENT: Running test with sample order...

✅ Test passed!
  ├─ Validation: ✓
  ├─ Inventory: ✓
  ├─ Payment (test mode): ✓
  ├─ Confirmation email: ✓ (sent to test@example.com)
  └─ Execution time: 2.3 seconds

Ready to go live? [Deploy / Adjust / Abort]
```

---

## Example 3: CredentialQuestionnaire Sample Run

### Scenario: Setting Up Salesforce API Credential

```
────────────────────────────────────────────────────────────────
CREDENTIALAGENT: Hi! Let's set up a credential securely.

What credential are you creating?
────────────────────────────────────────────────────────────────

USER: Salesforce API key for our integrations

CREDENTIALAGENT: Salesforce API — excellent!

What type of authentication?

  ✓ OAuth 2.0 (recommended for Salesforce)
  ☐ API Key (simple, less secure)
  ☐ JWT (service-to-service)
  ☐ Custom

USER: OAuth 2.0

CREDENTIALAGENT: Perfect! I need:

  1. Client ID (from Salesforce Connected App)
  2. Client Secret (keep this safe!)
  3. Refresh Token

Do you have these? [Yes / Need help / Get from Salesforce]

USER: Yes, I have them

CREDENTIALAGENT: Great! Enter your credentials:

  Client ID: [••••••••]
  Client Secret: [••••••••]
  Refresh Token: [••••••••]

[Validating... ✓ Connected!]

CREDENTIALAGENT: Excellent! Connected to your Salesforce instance.

Who should be able to use this credential?

  Access levels:
  ☐ Workspace admins only (most secure)
  ☐ Specific users (recommended)
  ✓ Only me (testing)
  ☐ Shared across workspace (least secure)

[Shows security implications for each]

USER: Specific users — give access to John, Sarah, and Michael

CREDENTIALAGENT: Perfect! This credential will be accessible only 
to:
  • John (john@company.com)
  • Sarah (sarah@company.com)
  • Michael (michael@company.com)

[PROGRESS: Step 3 of 5 ▓▓░░░]

When should this credential expire?

  Recommendations:
  ☐ Never (testing environments)
  ✓ 90 days (standard security)
  ☐ 60 days (high security)
  ☐ 30 days (extremely sensitive)
  ☐ Custom date

Most organizations: 90 days

USER: 90 days, so it expires on [December 28, 2024]

CREDENTIALAGENT: Got it! We'll need to refresh it before then.

How often should we rotate (replace) this credential?

  Rotation schedule:
  ☐ Never (testing)
  ☐ Quarterly (every 90 days)
  ✓ Monthly (standard)
  ☐ Weekly (high-security)

USER: Monthly

CREDENTIALAGENT: Monthly rotation means:
  • 1st of every month: Create new credential
  • 2nd of month: Update apps using this credential
  • 3rd of month: Revoke old credential

We'll send reminders! 📅

[PROGRESS: Step 4 of 5 ▓▓▓░░]

Last step: Where will this credential be used?

  Usage:
  ☐ Workflows (background automation)
  ✓ APIs (in your code/apps)
  ☐ Integrations (third-party systems)
  ☑ Scheduled tasks

Examples:
  • Sync Salesforce contacts to CRM
  • Pull sales data for dashboards
  • Update Salesforce from order system

USER: All three — workflows, APIs, and scheduled sync

CREDENTIALAGENT: [FINAL REVIEW]

═══════════════════════════════════════════════════════════════

🔐 Your Salesforce OAuth Credential

Name: Salesforce API
Type: OAuth 2.0
Access: John, Sarah, Michael (3 users)
Expiration: 90 days (Dec 28, 2024)
Rotation: Monthly (1st of every month)
Usage: Workflows, APIs, Scheduled tasks

Status: ✅ Connected and validated

[PROGRESS: Step 5 of 5 ▓▓▓▓▓]

═══════════════════════════════════════════════════════════════

Ready to save this credential? [Yes / Edit / Cancel]

USER: Yes, save it

CREDENTIALAGENT: ✅ Credential saved!

  Name: Salesforce API
  Created: Today at 2:34 PM
  Expires: Dec 28, 2024 (90 days)
  Next rotation: Nov 1, 2024
  Accessible by: 3 users

You'll receive an email reminder 2 weeks before expiration.

Next steps:
  1. Use in a workflow [Go]
  2. Use in an API call [Go]
  3. View all credentials [Go]
  4. Done [Close]
```

---

## Example 4: ServerQuestionnaire Sample Run

### Scenario: Provisioning Production Application Server

```
────────────────────────────────────────────────────────────────
SERVERAGENT: Welcome! I'll help you provision a server.

What type of server do you need?
────────────────────────────────────────────────────────────────

USER: Application server for my web app in production

SERVERAGENT: Production app server — let's set it up right!

[PROGRESS: Step 1 of 8 ▓░░░░░░]

First: What's the expected traffic level?

  Traffic estimates:
  🟢 Low (1-10 requests/sec)
    └─ Blog, brochure site, internal tools
  
  🟡 Medium (10-100 requests/sec)
    └─ Small SaaS, startups, content sites
  
  🔴 High (100+ requests/sec)
    └─ E-commerce, popular SaaS, social platforms

USER: Medium — expecting 20-30 requests per second

SERVERAGENT: Smart! For Medium traffic, I recommend:

  Compute:
  ✓ 4-8 CPU cores
  ✓ 8-16 GB RAM
  ✓ SSD storage (100+ GB)
  ✓ Load balancer
  ✓ Auto-scaling enabled

  These specs handle traffic spikes and maintain performance.

Would you like these defaults? [Yes / Customize]

USER: Yes, but 8 cores instead of 4-8

SERVERAGENT: Perfect! Customized specs:
  ✓ 8 CPU cores
  ✓ 8 GB RAM
  ✓ Auto-scaling (up to 4 additional servers)
  ✓ Load balanced across instances
  ✓ SSD storage

[PROGRESS: Step 2 of 8 ▓▓░░░░░]

Where should the server be located?

  Geographic regions:
  🌎 North America
    ☑ US East (Virginia) — Default, best coverage
    ☐ US West (California) — For West Coast users
    ☐ Canada (Toronto)
  
  🌍 Europe
    ☐ EU West (Ireland)
    ☐ EU Central (Germany)
  
  🌏 Asia Pacific
    ☐ Singapore
    ☐ Tokyo
    ☐ Sydney

USER: US East (where most of our users are)

SERVERAGENT: Good choice! US East provides lowest latency 
for East Coast users.

Operating system and runtime?

  Options:
  ✓ Ubuntu 22.04 LTS (recommended)
  ☐ Windows Server 2022
  ☐ Amazon Linux 2
  ☐ CentOS

USER: Ubuntu 22.04

SERVERAGENT: Ubuntu 22.04 — solid choice!

What runtime environment does your app need?

  ✓ .NET 9.0 runtime (Node.js, Python also available)
  ✓ Node.js 20 LTS
  ☐ Python 3.12
  ☐ Java 17
  ☐ Go 1.21
  ☐ Multiple runtimes

USER: .NET 9.0 (it's a .NET app)

SERVERAGENT: Got it! .NET 9.0 will be pre-installed.

[PROGRESS: Step 4 of 8 ▓▓▓▓░░░]

What about networking?

  Configuration:
  ✓ Public IP (internet accessible)
  ✓ Private IP (internal network)
  ✓ SSL/TLS certificates (HTTPS)
  ✓ Firewall rules (restrict access)

Who should access this server?

  Firewall rules:
  • Port 80 (HTTP): Public (everyone)
  • Port 443 (HTTPS): Public (everyone)
  • Port 22 (SSH): Restricted (admin only)
  • Port 3389 (RDP): Off by default

USER: Yes, that's right. Only SSH for admin access

SERVERAGENT: Perfect! Your security setup:
  ✓ HTTPS enforced (port 443)
  ✓ HTTP redirects to HTTPS
  ✓ SSH restricted to admin network
  ✓ All other ports closed

[PROGRESS: Step 5 of 8 ▓▓▓▓▓░░]

Backup and disaster recovery?

  Options:
  ☐ No backup (not recommended)
  ✓ Daily backups (standard)
  ☐ Hourly backups (for critical apps)
  
  Retention:
  ☑ Keep 7 days of backups
  ☑ Keep 4 weekly backups
  ☑ Keep 12 monthly backups

USER: Daily backups, keep 7 days

SERVERAGENT: Good! Daily snapshots, 7-day retention.
Estimated cost: $50/month for backup storage.

Monitoring and alerts?

  What to monitor:
  ✓ CPU usage (alert if > 80%)
  ✓ Memory usage (alert if > 85%)
  ✓ Disk space (alert if > 90%)
  ✓ Application health (ping every 30s)
  ✓ Network I/O

Alert channels:
  ☑ Email (ops@company.com)
  ☐ SMS
  ☐ Slack

USER: Email and Slack

SERVERAGENT: Added Slack notifications to #ops-alerts channel.

[PROGRESS: Step 7 of 8 ▓▓▓▓▓▓░]

[FINAL REVIEW]

═══════════════════════════════════════════════════════════════

🖥️ Your Production Application Server

Environment: Production
Location: US East (Virginia)
Operating System: Ubuntu 22.04 LTS
Runtime: .NET 9.0

Compute:
  • 8 CPU cores
  • 8 GB RAM
  • 100 GB SSD storage
  • Load balanced, auto-scaling (max 4 instances)

Networking:
  • Public IP (HTTP/HTTPS)
  • Private network access
  • SSL/TLS enforced
  • SSH restricted to admin

Backup & Recovery:
  • Daily snapshots
  • 7-day retention
  • Recovery time: 15 minutes

Monitoring:
  • CPU, Memory, Disk, Health checks
  • Alerts: Email + Slack

Estimated Cost:
  • Server: $200/month
  • Storage: $50/month
  • Backup: $50/month
  • Total: $300/month

[PROGRESS: Step 8 of 8 ▓▓▓▓▓▓▓]

═══════════════════════════════════════════════════════════════

Ready to provision? [Yes, provision! / Review / Back]

USER: Yes, provision!

SERVERAGENT: Provisioning server... Setting up OS, runtime, 
networking, monitoring...

[30 seconds later]

✅ Server provisioned successfully!

  IP Address: 54.123.45.67
  Name: prod-app-server-01
  Status: Running
  Health: ✓ All systems healthy

Next steps:
  1. Deploy your application [How-to guide]
  2. Configure SSL certificate [Guide]
  3. Test connectivity [Test]
  4. Done [Close]

[Shows: Server dashboard with live metrics]
```

---

## 5. Navigation Tips for Users

Every questionnaire should show:

- **Current question** — Clear heading
- **Why we're asking** — Brief explanation
- **Recommended option(s)** — Best practice highlighted
- **Examples** — What this looks like in practice
- **Progress indicator** — "Step 3 of 7"
- **Navigation options** — [Continue / Back / Skip / Decline to menu]

### Friendly Language
❌ "Specify application type"  
✅ "What's your app about?"

❌ "Configure CPU allocation"  
✅ "Expected traffic: Low, Medium, or High?"

❌ "Enter OAuth parameters"  
✅ "Do you have your Salesforce credentials?"

---

## 6. Common Patterns Across All Questionnaires

| Phase | What | Example |
|-------|------|---------|
| **Discovery** | Understand goal | "What's your app about?" |
| **Type Selection** | Pick category | "E-commerce? B2B? Custom?" |
| **Details** | Specific configuration | "How many pages? Which widgets?" |
| **Review** | Confirm all choices | "Here's your summary..." |
| **Action** | Build/Deploy | "Ready to build?" |
| **Progress** | Show results | "✅ Home page created!" |

---

## 7. Error Recovery

If user gets stuck:

```
AGENT: Not sure? Let me help!

🎯 Quick templates:
  • Standard E-commerce
  • Admin Dashboard
  • CRM Portal
  • Content Management

Or:
  [See examples] [Watch demo] [Talk to support]
```

Agents make complex tasks feel simple. Always recommend, always explain, always offer to go back.
