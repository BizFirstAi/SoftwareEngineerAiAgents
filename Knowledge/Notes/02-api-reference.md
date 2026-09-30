# Rouge API Reference

REST endpoints for storing and retrieving RougeNotes. All endpoints require JWT bearer token with TenantID claim.

## Base URL
```
https://[api-host]/api/rouge-notes
```

## Authentication
Header: `Authorization: Bearer [JWT token]`  
TenantID extracted from JWT claims for isolation.

---

## CREATE: Store a Memory

### POST /api/rouge-notes

Store a new RougeNote (Semantic, Episodic, or Procedural).

**Request:**
```json
{
  "title": "Name of the memory",
  "note": "Full content/definition/workflow",
  "noteType": "Semantic|Episodic|Procedural",
  "noteCategory": "RogueAgentMemory",
  "status": "Active|Archived"
}
```

**Response:** `201 Created`
```json
{
  "status": 201,
  "message": "RougeNote created successfully",
  "data": {
    "rougeNoteID": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Naming Convention: Identifiers",
    "noteType": "Semantic",
    "noteCategory": "RogueAgentMemory",
    "status": "Active",
    "createdOn": "2026-09-29T10:30:00Z",
    "tenantID": "tenant-123"
  }
}
```

**Examples:**

**Semantic Memory:**
```json
{
  "title": "Naming Convention: Identifiers",
  "note": "Use 'ID' (uppercase), never 'Id'. Apply everywhere: variables, parameters, tuple members, DB columns.",
  "noteType": "Semantic",
  "noteCategory": "RogueAgentMemory",
  "status": "Active"
}
```

**Episodic Memory:**
```json
{
  "title": "User Prefers Bundled PRs",
  "note": "During refactor of AppStudio, user chose one bundled PR over many small ones. Avoid splitting this type of change.",
  "noteType": "Episodic",
  "noteCategory": "RogueAgentMemory",
  "status": "Active"
}
```

**Procedural Memory:**
```json
{
  "title": ".NET Build Procedure",
  "note": "Always build incrementally: dotnet build -m:2. Never clean/rebuild. Cap MSBuild to 2 to avoid memory issues.",
  "noteType": "Procedural",
  "noteCategory": "RogueAgentMemory",
  "status": "Active"
}
```

---

## READ: Retrieve Memories

### GET /api/rouge-notes/{id}
Get a specific RougeNote by ID.

**Response:** `200 OK`
```json
{
  "rougeNoteID": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Naming Convention: Identifiers",
  "note": "Use 'ID' (uppercase)...",
  "noteType": "Semantic",
  "noteCategory": "RogueAgentMemory",
  "status": "Active",
  "createdOn": "2026-09-29T10:30:00Z",
  "createdBy": "user-456",
  "lastModifiedOn": "2026-09-29T11:00:00Z",
  "lastModifiedBy": "user-456"
}
```

---

## SEARCH: Filter Memories

### GET /api/rouge-notes?noteType=Semantic&status=Active

**Query Parameters:**
| Parameter | Type | Required | Example |
|-----------|------|----------|---------|
| noteType | string | No | Semantic, Episodic, Procedural |
| noteCategory | string | No | RogueAgentMemory |
| status | string | No | Active, Archived |
| skip | int | No | 0 |
| take | int | No | 50 |

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "RougeNotes retrieved successfully",
  "data": [
    {
      "rougeNoteID": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Naming Convention: Identifiers",
      "noteType": "Semantic",
      "noteCategory": "RogueAgentMemory",
      "status": "Active",
      "createdOn": "2026-09-29T10:30:00Z"
    },
    {
      "rougeNoteID": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Database Constraints",
      "noteType": "Semantic",
      "noteCategory": "RogueAgentMemory",
      "status": "Active",
      "createdOn": "2026-09-29T10:35:00Z"
    }
  ],
  "totalCount": 2
}
```

**Common Queries:**

Get all active agent memories:
```
GET /api/rouge-notes?noteCategory=RogueAgentMemory&status=Active
```

Get all Semantic memories (facts/rules):
```
GET /api/rouge-notes?noteType=Semantic&status=Active
```

Get all Procedural memories (workflows):
```
GET /api/rouge-notes?noteType=Procedural&status=Active
```

Get all Episodic memories (user preferences):
```
GET /api/rouge-notes?noteType=Episodic&status=Active
```

---

## UPDATE: Modify a Memory

### PATCH /api/rouge-notes/{id}

Partially update a RougeNote.

**Request:**
```json
{
  "title": "Updated title",
  "note": "Updated content",
  "status": "Archived"
}
```

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "RougeNote updated successfully",
  "data": {
    "rougeNoteID": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated title",
    "status": "Archived",
    "lastModifiedOn": "2026-09-29T12:00:00Z"
  }
}
```

---

## DELETE: Soft Delete a Memory

### DELETE /api/rouge-notes/{id}

Soft delete a RougeNote (marks Deleted=true, doesn't remove record).

**Response:** `200 OK`
```json
{
  "status": 200,
  "message": "RougeNote deleted successfully"
}
```

---

## Error Responses

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid NoteType/Status | `"NoteType must be Semantic, Episodic, or Procedural"` |
| 401 | Missing/invalid JWT | `"Unauthorized"` |
| 404 | Note not found | `"RougeNote not found"` |
| 409 | Duplicate title in tenant | `"RougeNote with this title already exists"` |

---

See [Agent Integration](03-agent-integration.md) for how agents use these endpoints.
