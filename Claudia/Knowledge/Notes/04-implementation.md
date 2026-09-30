# Implementation: RougeNote Entity & Database

Technical reference for the Rouge system architecture, entity model, database schema, and validation constraints.

## Project Structure

**BizFirstPayrollV3/src/mvc-server/Ai/Rouge/**

```
Rouge/
├── Api/                          # REST controllers
│   ├── RougeNoteController.cs    # CRUD endpoints
│   └── RougeSearchController.cs  # Search/filter endpoints
├── Api.Base/                     # Shared base
│   └── BaseRougeNoteController.cs
├── Domain/                       # Entity models
│   ├── RougeNote.cs             # Main entity
│   ├── Constants/               # Enum constants
│   │   ├── RougeNoteTypeConstants.cs
│   │   ├── RougeNoteCategoryConstants.cs
│   │   └── RougeNoteStatusConstants.cs
│   └── Request/Response/        # DTOs
├── Service/                      # Business logic
│   ├── IRougeNoteService.cs     # Interface
│   ├── RougeNoteService.cs      # Validation, CRUD
│   └── RougeNoteValidator.cs    # Fluent validation
├── Infrastructure/              # Data access
│   ├── RougeDbContext.cs        # EF Core DbContext
│   ├── RougeNoteRepository.cs   # IRepository<T> impl
│   └── DependencyInjection.cs   # DI registration
└── Tests/                        # Unit + integration tests
```

---

## RougeNote Entity

**Location:** `Domain/RougeNote.cs`

```csharp
public class RougeNote : BaseEntity
{
    public int RougeNoteID { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; }
    
    [MaxLength(10000)]
    public string Note { get; set; }
    
    [MaxLength(300)]
    public string NoteType { get; set; }  // Semantic, Episodic, Procedural
    
    [MaxLength(300)]
    public string NoteCategory { get; set; }  // RogueAgentMemory
    
    [MaxLength(300)]
    public string Status { get; set; }  // Active, Archived
}
```

### Inheritance: BaseEntity

RougeNote inherits `BaseEntity` which provides (per CLAUDE.md):
- `Deleted` (bool) — Soft delete flag
- `Archived` (bool) — Archive flag
- `LastModifiedOn` / `LastModifiedBy` — Audit fields
- `CreatedOn` / `CreatedBy` — Audit fields
- `SourceAppID`, `ClientAccountID`, `AppDomainID`, `DataDomainID`, `DataSegmentID` — Standard fields
- `TenantID` — Multi-tenant isolation (from JWT claim)
- `ResID` — Resource ID

---

## Database Schema

**Table:** `Rouge_Notes` (in RougeDbContext)

```sql
CREATE TABLE [Rouge_Notes] (
    [RougeNoteID] INT PRIMARY KEY IDENTITY(1,1),
    [Title] NVARCHAR(200) NOT NULL,
    [Note] NVARCHAR(MAX),
    [NoteType] NVARCHAR(300),      -- Semantic, Episodic, Procedural
    [NoteCategory] NVARCHAR(300),  -- RogueAgentMemory
    [Status] NVARCHAR(300),        -- Active, Archived (⚠️ currently missing, see Note below)
    
    -- Inherited from BaseEntity
    [Deleted] BIT NOT NULL DEFAULT 0,
    [Archived] BIT NOT NULL DEFAULT 0,
    [CreatedOn] DATETIME NOT NULL,
    [CreatedBy] INT NOT NULL,
    [LastModifiedOn] DATETIME NOT NULL,
    [LastModifiedBy] INT NOT NULL,
    [TenantID] NVARCHAR(128) NOT NULL,
    [SourceAppID] INT,
    [ClientAccountID] INT,
    [AppDomainID] INT,
    [DataDomainID] INT,
    [DataSegmentID] INT,
    [ResID] NVARCHAR(128)
);

-- Indexes for fast retrieval
CREATE INDEX [IX_TenantID] ON [Rouge_Notes]([TenantID]) WHERE [Deleted] = 0;
CREATE INDEX [IX_NoteCategory] ON [Rouge_Notes]([NoteCategory]) WHERE [Deleted] = 0;
CREATE INDEX [IX_NoteType] ON [Rouge_Notes]([NoteType]) WHERE [Deleted] = 0;
CREATE INDEX [IX_Status] ON [Rouge_Notes]([Status]) WHERE [Deleted] = 0;
```

### ⚠️ Known Issue: Missing Status Column
- **PR #164** dropped the Status column from database
- PR #1504 flagged this but not yet fixed
- **Workaround:** Status field exists in entity/API but cannot persist to DB
- **Fix:** Database team must re-add Status column and run migration

---

## Constants

### NoteType Constants

**File:** `Domain/Constants/RougeNoteTypeConstants.cs`

```csharp
public static class RougeNoteTypeConstants
{
    public const string Semantic = "Semantic";      // Facts, rules, patterns
    public const string Episodic = "Episodic";      // Events, interactions, history
    public const string Procedural = "Procedural";  // Workflows, steps, guides
}
```

### NoteCategory Constants

**File:** `Domain/Constants/RougeNoteCategoryConstants.cs`

```csharp
public static class RougeNoteCategoryConstants
{
    public const string RogueAgentMemory = "RogueAgentMemory";
}
```

### Status Constants

**File:** `Domain/Constants/RougeNoteStatusConstants.cs`

```csharp
public static class RougeNoteStatusConstants
{
    public const string Active = "Active";
    public const string Archived = "Archived";
}
```

---

## Validation

### RougeNoteValidator (Fluent)

**File:** `Service/RougeNoteValidator.cs`

```csharp
public class RougeNoteValidator : AbstractValidator<CreateRougeNoteRequest>
{
    public RougeNoteValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200)
            .WithMessage("Title is required and max 200 chars");
        
        RuleFor(x => x.Note)
            .MaximumLength(10000)
            .WithMessage("Note max 10,000 chars");
        
        RuleFor(x => x.NoteType)
            .Must(x => x == RougeNoteTypeConstants.Semantic 
                    || x == RougeNoteTypeConstants.Episodic 
                    || x == RougeNoteTypeConstants.Procedural)
            .WithMessage("NoteType must be Semantic, Episodic, or Procedural");
        
        RuleFor(x => x.NoteCategory)
            .Must(x => x == RougeNoteCategoryConstants.RogueAgentMemory)
            .WithMessage("NoteCategory must be RogueAgentMemory");
        
        RuleFor(x => x.Status)
            .Must(x => x == RougeNoteStatusConstants.Active 
                    || x == RougeNoteStatusConstants.Archived)
            .WithMessage("Status must be Active or Archived");
    }
}
```

### Service Validation

**File:** `Service/RougeNoteService.cs`

```csharp
public async Task<InsertWebResponse> CreateAsync(
    CreateRougeNoteRequest request, 
    CancellationToken ct)
{
    // Validate
    var validationResult = await _validator.ValidateAsync(request, ct);
    if (!validationResult.IsValid)
        throw new ValidationException(validationResult.Errors);
    
    // Create entity
    var note = new RougeNote
    {
        Title = request.Title,
        Note = request.Note,
        NoteType = request.NoteType,
        NoteCategory = request.NoteCategory,
        Status = request.Status,
        TenantID = _tenantContext.TenantID
    };
    
    // Save
    var result = await _repository.CreateAsync(note, ct);
    return new InsertWebResponse { RougeNoteID = result.RougeNoteID, ... };
}
```

---

## API Endpoints (Quick Reference)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/rouge-notes | Create RougeNote |
| GET | /api/rouge-notes/{id} | Get by ID |
| GET | /api/rouge-notes?noteType=X | Search by type |
| GET | /api/rouge-notes?noteCategory=X | Search by category |
| GET | /api/rouge-notes?status=X | Search by status |
| PATCH | /api/rouge-notes/{id} | Update |
| DELETE | /api/rouge-notes/{id} | Soft delete |

See [API Reference](02-api-reference.md) for full request/response formats.

---

## Dependency Injection

**File:** `Infrastructure/DependencyInjection.cs`

```csharp
public static IServiceCollection AddRougeInfrastructure(
    this IServiceCollection services,
    IConfiguration config)
{
    services.AddDbContext<RougeDbContext>(options =>
        options.UseSqlServer(config.GetConnectionString("RougeDb")));
    
    services.AddScoped<IRepository<RougeNote, int>, RougeNoteRepository>();
    services.AddScoped<IRougeNoteService, RougeNoteService>();
    services.AddScoped<RougeNoteValidator>();
    
    return services;
}
```

**In Startup:**
```csharp
builder.Services.AddRougeInfrastructure(builder.Configuration);
```

---

## Multi-Tenancy

All queries automatically filtered by TenantID from JWT claim:

```csharp
public async Task<RougeNote> GetByIDAsync(int id, CancellationToken ct)
{
    return await _context.RougeNotes
        .AsNoTracking()
        .Where(x => x.TenantID == _tenantContext.TenantID && x.RougeNoteID == id)
        .FirstOrDefaultAsync(ct);
}
```

---

See [Agent Integration](03-agent-integration.md) for how agents use these endpoints.
