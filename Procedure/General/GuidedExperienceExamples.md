# Guided Experience Examples

**Purpose:** Real-world examples showing how AI agents guide users step-by-step through complex builds with recommendations, visual feedback, and iterative refinement.

---

## 1. Simple Build: Contact Form (15 minutes)

### User Request
> "I want a contact form on my website to collect customer inquiries"

### Phase 1: Understanding Requirements

**Agent:**
```
Contact form — perfect! Let's gather some details so I can 
build exactly what you need.

Questions:
1. Who should receive these messages?
   → Your email: [user@company.com]

2. What information should you collect?
   ☑ Name (required)
   ☑ Email (required, validated)
   ☑ Phone number (optional)
   ☑ Subject (required, dropdown or text?)
   ☑ Message (required, long text area)
   
3. Additional requirements?
   ☐ Auto-reply to users
   ☐ Attach files
   ☐ Store in database
   ☐ Send notifications to Slack

Recommendations:
→ Add auto-reply so users know you got their message
→ Store submissions so you can review anytime
```

**User Input:**
- Email: sales@company.com
- Fields: Name, Email, Phone, Subject (dropdown), Message
- Auto-reply: Yes
- Storage: Yes

---

### Phase 2: Design

**Agent:**
```
Great! I'm creating your form with these specs:

PAGE: "Contact Us"

FIELDS:
┌─────────────────────────────────────┐
│ Name          [Text input]          │
│ Email         [Email input]         │
│ Phone         [Phone input, optional]
│ Subject       [Dropdown: Sales, Support, Feedback, Other]
│ Message       [Text area, 5 rows]   │
│               [Submit Button]       │
└─────────────────────────────────────┘

After submit:
→ Show: "Thank you! We'll respond within 24 hours"
→ Send email to: sales@company.com
→ Auto-reply to user
→ Store in database

Does this look right?
[✓ Yes, build it]  [Refine]  [Start over]
```

**Browser shows:** Live preview of form with proper styling

**User:** ✓ Yes, build it

---

### Phase 3: Configuration

**Agent:**
```
Building your form...

✓ Created form page
✓ Added all fields with validation
✓ Configured email notifications to: sales@company.com
✓ Set up auto-reply template: "Thank you for contacting us..."
✓ Configured database storage
✓ Added security: CSRF tokens, input validation
✓ Enabled analytics tracking

TESTING:
Testing form submission...
✓ Form validates correctly
✓ Email sent successfully
✓ Data stored in database
✓ Auto-reply received

Your contact form is ready to go live!

Next steps:
1. [Deploy now]
2. [Test with team first]
3. [Review auto-reply message]
4. [Make changes]
```

---

## 2. Complex Build: Chat Assistant (3 hours)

### User Request
> "I want a chat assistant that can answer questions about our product documentation"

### Breakdown Plan

**Agent:**
```
Chat assistant with document knowledge — this is a great project!
Here's the plan to build it:

PHASE 1: Knowledge Base Setup (30 min)
→ Upload your product docs
→ Index them for searching
→ Test retrieval accuracy

PHASE 2: Workflow Design (45 min)
→ Create chat processing workflow
→ Configure knowledge search
→ Add AI response generation
→ Set up error handling

PHASE 3: App Interface (45 min)
→ Design chat screen
→ Add document viewer
→ Create settings page
→ Link to workflow

PHASE 4: Testing & Launch (30 min)
→ Test end-to-end
→ Verify answer quality
→ Deploy to production
→ Set up monitoring

TOTAL: ~3 hours

Ready to start?  [Yes]  [Adjust plan]  [Question?]
```

---

### Phase 1: Knowledge Base Setup

**Agent:**
```
Let's build your knowledge base first. This is where the 
chat assistant learns about your product.

STEP 1: Document Upload
Please upload your documentation files:
- PDF files ✓ supported
- Word documents ✓ supported
- Text files ✓ supported
- Web links ✓ supported

Recommended: 10+ pages for good coverage
```

**User uploads:** 5 PDF files (Product Guide, API Docs, FAQ, Quick Start, Troubleshooting)

**Agent:**
```
Files received! Processing...

📄 Product Guide (25 pages)
📄 API Docs (18 pages)
📄 FAQ (12 pages)
📄 Quick Start (8 pages)
📄 Troubleshooting (15 pages)

Total: 78 pages, ~45,000 words

Creating knowledge base...
✓ Extracting content
✓ Chunking text into searchable segments
✓ Building search index
✓ Processing embeddings

TESTING: Let me verify it works by asking sample questions

Q: "How do I get started?"
A: [Found in Quick Start guide, section 2.1]

Q: "What's the API endpoint for user creation?"
A: [Found in API Docs, section 4.3]

Q: "I'm getting a 401 error. Help!"
A: [Found in Troubleshooting, section 3.2]

✓ Knowledge base is working great!
Confidence scores: 85%, 92%, 88%

Ready for workflow integration?  [Yes]
```

---

### Phase 2: Workflow Design

**Agent:**
```
Now let's design the chat workflow. This controls what 
happens when someone asks a question.

FLOW DIAGRAM:
┌──────────────┐
│ User Message │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ Search Knowledge Base    │
│ (Find relevant docs)     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ AI Generation            │
│ (Generate smart response)│
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Format & Send Response   │
│ (Show to user + sources) │
└──────────────────────────┘

CONFIGURATION:
✓ Knowledge search: Top 3 relevant documents
✓ AI model: GPT-4 (or your preference)
✓ Temperature: 0.7 (balanced, creative)
✓ Max tokens: 500 (reasonable length)
✓ Include sources: Yes (show what docs answered)

ERROR HANDLING:
→ If no relevant docs: "I don't know the answer. 
                        Try our support team."
→ If API fails: "Connection issue. Try again in a moment."
→ Timeout handling: Return partial response + offer support

Ready to build?  [Yes]
```

**Building workflow...**

```
✓ Created execution workflow
✓ Added Input Node (capture user message)
✓ Added RAG Node (knowledge search)
✓ Added Agent Node (response generation)
✓ Added Output Node (format response)
✓ Configured error paths

TESTING WORKFLOW:
Testing with sample questions...

Q: "How do I authenticate?"
→ Search found: [Auth guide, API Docs, FAQ]
→ Generated response: "To authenticate, use OAuth2 
   with these credentials..."
→ Response time: 1.2 seconds
✓ PASS

Q: "What's your pricing?"
→ Search found: [No results in knowledge base]
→ Generated response: "I don't have pricing info. 
   Please contact sales."
✓ PASS

Workflow is ready!  [Continue to app design]
```

---

### Phase 3: App Interface

**Agent:**
```
Let's create the chat app interface. This is what users 
will interact with.

DESIGN OVERVIEW:
Page 1: Chat Screen
  - Message history (scrollable)
  - User message input field
  - Send button
  - Typing indicator
  - Source documents (footer)

Page 2: Document Browser
  - Search uploaded documents
  - View document snippets
  - Link to full document

Page 3: Settings
  - Chat history (clear/export)
  - Response preferences
  - About this assistant

Ready?  [Show design]  [Customize]
```

**Browser shows:** Wireframe of chat interface

```
CHAT SCREEN PREVIEW:
┌─────────────────────────────────┐
│ 💬 Product Assistant            │ ← Title
├─────────────────────────────────┤
│ Assistant: Hi! I can help with  │ ← Bot message
│ questions about our product...  │
│                                  │
│ You: How do I get started?      │ ← User message
│                                  │
│ Assistant: To get started:      │ ← Bot response
│ 1. Create an account at...      │
│                                  │
│ 📄 Source: Quick Start Guide    │ ← Sources
├─────────────────────────────────┤
│ [Your question here...]  [Send] │ ← Input
└─────────────────────────────────┘
```

**Agent continues:**
```
Building the app...

✓ Created Chat page with message history
✓ Added input field with send button
✓ Connected to workflow
✓ Added source document display
✓ Configured styling (professional, clean)
✓ Added Document Browser page
✓ Added Settings page

STYLING:
→ Color scheme: Professional (blue/white)
→ Font: Clear, readable
→ Mobile responsive: Yes
→ Dark mode: Available

Ready to test?  [Yes]
```

---

### Phase 4: Testing & Deployment

**Agent:**
```
FULL END-TO-END TEST:

Scenario 1: User asks about features
User: "What can your product do?"
→ Search: [Found 8 relevant sections]
→ AI generates: "Our product allows you to..."
→ Shows: Sources from features doc
Result: ✓ PASS

Scenario 2: User asks unclear question
User: "xyz abc 123"
→ Search: [No relevant match]
→ AI generates: "I didn't understand. Try asking about..."
→ Helpful fallback: "Or browse our docs"
Result: ✓ PASS

Scenario 3: Multiple messages in sequence
User: "How do I authenticate?"
Asst: [Response with auth steps]
User: "Can I use API key instead?"
→ Context preserved from previous message
→ AI gives follow-up answer
Result: ✓ PASS

ALL TESTS PASSED! ✓

DEPLOYMENT:
✓ Knowledge base indexed
✓ Workflow tested and optimized
✓ App interface tested on mobile/desktop
✓ Security: Input sanitized, rate limiting enabled
✓ Monitoring: Set up performance tracking

Your chat assistant is ready for production!

NEXT STEPS:
→ Deploy to production
→ Share link with team
→ Monitor usage
→ Gather feedback
→ Iterate (improve docs/answers based on questions)

[Deploy now]  [Review logs]  [Make changes]
```

---

## 3. Integration Scenario: Salesforce Sync Workflow

### User Request
> "I want to automatically sync our Salesforce contacts into our app every day"

### Step-by-Step Guided Build

**Step 1: Connect Salesforce**

```
Agent: "First, we need to securely connect to Salesforce.
I'll guide you through getting the OAuth credentials.

GO TO YOUR SALESFORCE ORG:
1. Settings → Apps → App Manager
2. Create New Connected App
3. Fill in:
   - App Name: 'BizFirst Sync'
   - API Name: 'bizfirst_sync'
   - Enable OAuth: Yes
   - Callback URL: [I'll provide this]

4. Copy these values:
   - Client ID: [field to paste]
   - Client Secret: [field to paste]

Need help? [Detailed guide]"
```

User provides credentials.

```
Agent: "Testing connection to Salesforce...
✓ Connected successfully!
✓ Can read contacts: YES (250 total)
✓ Permissions verified

Great! Let's design the sync workflow."
```

**Step 2: Design Sync Logic**

```
Agent: "Here's the daily sync workflow I'm creating:

EVERY DAY AT 2 AM:
1. Connect to Salesforce
2. Fetch all contacts (with changes since last sync)
3. Map fields:
   Salesforce → BizFirst App
   First Name → FirstName
   Email → Email
   Phone → PhoneNumber
   
4. Load into database
5. Send sync report to you
6. Log any issues

What should happen if:
→ Contact email is missing?
   ☐ Skip contact
   ☐ Use phone as identifier
   ☑ Notify admin (recommended)

→ Contact already exists?
   ☑ Update with new data (recommended)
   ☐ Keep existing data
   ☐ Duplicate it

→ Sync fails?
   ☑ Retry 3 times (recommended)
   ☐ Notify admin
   ☐ Pause workflow
   
Is this good?  [Yes]  [Adjust]
```

**Step 3: Configure Schedule**

```
Agent: "When should the sync run?

Options:
→ Every hour (most frequent)
→ Every 6 hours
→ Daily at [2 AM] (recommended for data freshness)
→ Weekly
→ Manual only

Best time to run: Off-peak hours (2 AM - 6 AM)
Recommended: Daily at 2 AM

Your preference?  [2 AM daily]
```

**Step 4: Testing**

```
Agent: "Running a test sync to verify everything works...

SYNC LOG:
────────────────────────────────────────
Time: 2024-01-15 14:32:05
Type: TEST SYNC
────────────────────────────────────────

📊 RESULTS:
✓ Connected to Salesforce
✓ Retrieved 250 contacts
✓ Processed 248 contacts
  - 200: Added as new
  - 48: Updated existing
  
⚠️ Issues (2):
  - Contact ID 2841: Missing email (skipped)
  - Contact ID 3029: Invalid phone format (fixed)

✓ Loaded to database
✓ Sent report email

Duration: 4.2 seconds
Next automatic sync: Tomorrow 2 AM

Issues found:
1. Contact 2841 should be reviewed manually
2. Phone format validation updated for future syncs

Actions:
[✓ Everything looks good]  [Review issues]  [Adjust config]
```

**Step 5: Go Live**

```
Agent: "Your Salesforce sync is now LIVE! 🎉

CONFIGURATION SUMMARY:
─────────────────────────────
Sync Frequency: Daily at 2 AM
Source: Salesforce (250 contacts)
Destination: BizFirst App Database
Field Mapping: Email, Phone, Name, Company
Error Handling: Retry 3x, notify admin
Status: ACTIVE

NEXT AUTOMATIC SYNC:
→ Tomorrow at 2 AM (Jan 16, 2024)

MONITORING DASHBOARD:
View sync history: [Dashboard link]
Recent syncs:
- ✓ Jan 15 - TEST (248 of 250 synced)
- ✓ Jan 14 - AUTOMATIC (250 of 250 synced)
- ✓ Jan 13 - AUTOMATIC (250 of 250 synced)

You'll receive daily emails with:
- Number of contacts synced
- Any issues found
- Link to view full log

Questions or issues?  [Contact support]  [View logs]
```

---

## 4. Error Recovery: Graceful Failure

### Scenario: Widget Not Available

```
User: "Add a Chart widget to my dashboard"

Agent: "Adding Chart widget to dashboard...
[Working...]

⚠️ Error: Chart widget type is not currently available

Recovery Options:

Option 1: Use Table widget instead (recommended)
→ Shows data in rows/columns
→ Very flexible, can sort and filter
→ Ready now
→ Can upgrade to Chart later

Option 2: Wait for Chart widget
→ Chart widget releases tomorrow
→ Will have full charting capabilities
→ You can update your dashboard then

Option 3: Build a custom solution
→ More complex, takes longer
→ But fully customizable

RECOMMENDATION: Start with Table (Option 1)
→ Get your dashboard working today
→ Upgrade to Chart tomorrow
→ Easy to switch, no data loss

Which option?  
[✓ Use Table]  [Wait for Chart]  [Custom]
```

User chooses Option 1.

```
Agent: "Building with Table widget...

✓ Added table widget
✓ Configured with your data
✓ Added sorting and filtering
✓ Styled to match dashboard

TABLE PREVIEW:
┌──────────────────────────────────┐
│ Date    | Sales    | Trend       │
├──────────────────────────────────┤
│ Jan 15  | $45,230  | ↑ +5%       │
│ Jan 14  | $43,100  | ↓ -2%       │
│ Jan 13  | $43,900  | ↑ +1%       │
└──────────────────────────────────┘

✓ Dashboard is ready!

NEXT STEPS:
Tomorrow when Chart widget releases:
→ You'll get a notification
→ I can convert this to a Chart in 2 minutes
→ No data loss, no redesign needed

Documented for future reference:
→ Saved in your project notes
→ I'll remind you tomorrow

Ready to continue?  [Yes]
```

---

## 5. Iterative Feedback Loop

### Scenario: User Refines App Design

```
Agent: "I've created your app with 4 pages:

1. Dashboard (overview, key metrics)
2. Transactions (detailed table)
3. Reports (charts, analytics)
4. Settings (config, preferences)

Let me show you a preview..."

[Browser shows: Clickable prototype]

Agent: "What do you think? Any changes?"

User: "The dashboard feels cramped. The layout is too tight."
```

**Agent responds:**

```
I see what you mean. The dashboard has a lot of information.
Let's refine the layout.

Options:
1. Remove the least important widgets
   → Which widgets matter most?

2. Spread across more pages
   → Dashboard (top-level metrics)
   → Dashboard Detail 1 (sales metrics)
   → Dashboard Detail 2 (user metrics)

3. Use tabs instead of separate pages
   → Keep information grouped
   → Less cluttered
   → Easier navigation

4. Reorganize layout
   → 2-column instead of 3-column
   → Larger font
   → More whitespace

Recommendation: Try Option 3 (tabs)
→ Looks cleaner
→ Still organized
→ Fast to implement

Which would you prefer?
[Use tabs]  [Remove widgets]  [More pages]  [Reorganize]
```

User chooses tabs.

```
Agent: "Redesigning with tabs...
[Updating preview in real-time]

NEW LAYOUT:
┌────────────────────────────────────┐
│ Dashboard [▼ Tabs ▼] │ | Settings │
├────────────────────────────────────┤
│ [Overall] [Sales] [Users] [Reports]│
├────────────────────────────────────┤
│                                     │
│  Key Metrics Overview               │
│  ┌─────────┐  ┌─────────┐         │
│  │ Revenue │  │ Orders  │         │
│  │ $150K   │  │ 1,234   │         │
│  └─────────┘  └─────────┘         │
│                                     │
└────────────────────────────────────┘

Much cleaner! What do you think?"

User: "Perfect! That's exactly what I wanted."

Agent: "Excellent! Saving these design decisions:
- Changed to tab-based layout
- Grouped metrics by category
- Improved whitespace and readability

Design locked in. Ready to continue with:
→ Add more pages?
→ Configure data sources?
→ Test the app?
→ Deploy to production?

[Add pages]  [Configure data]  [Test]  [Deploy]
```

---

## 6. Key UX Patterns Demonstrated

### ✓ Clear Phases with Progress
- Understand → Design → Build → Test → Deploy
- Progress indicator at each stage
- Clear timing expectations
- Visual milestones

### ✓ Recommendations Based on Context
- "We recommend..." suggestions
- Reasoning provided
- User can accept or customize
- Best practices built in

### ✓ Visual Feedback & Browser Preview
- Screenshots and prototypes
- Live updates as you build
- See it before committing
- Real-time validation

### ✓ Error Recovery (Graceful, Non-Blocking)
- No dead-ends
- Multiple solutions offered
- Recommended path highlighted
- Can always adjust later

### ✓ User Choice at Key Points
- Confirm major decisions
- Options clearly labeled
- Recommendation highlighted
- Never forced into one path

### ✓ Summary Before Proceeding
- Recap what will be built
- Confirm understanding
- Easy to ask questions
- Clear next steps

### ✓ Decision Documentation
- Decisions saved in notes
- Rationale recorded
- Can reference later
- Used for future iterations

### ✓ Fast Feedback Loops
- Build → Show → Get feedback → Adjust
- Cycles take 5-15 minutes
- User feels progress
- Motivation maintained

---

## Summary

These examples show how guided experiences:
- **Simplify complexity** through step-by-step guidance
- **Build confidence** with visual feedback and recommendations
- **Save time** with smart defaults and templates
- **Enable iteration** through fast feedback loops
- **Recover gracefully** from errors and constraints
- **Document decisions** for future reference

The key is making the user feel in control while providing expert guidance every step of the way.
