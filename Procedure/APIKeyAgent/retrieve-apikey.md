# Retrieve API Key

**Purpose:** Procedure to retrieve stored API keys from system storage or retrieve via API calls.

---

## Overview

API keys can be retrieved from:
1. **System storage** — Database, secure vault
2. **Secure file storage** — .env files, encrypted config
3. **API retrieval** — If user is authenticated, retrieve own keys
4. **Password manager** — User's secure storage

---

## Option 1: Retrieve from Database (Server-side)

### When to use:
- Agent has access to database
- Key was previously stored by system
- User doesn't have key but system does

### Process:

**Query:**
```sql
SELECT ApiKeyID, Name, KeyValue, Scopes, ExpiresAt, CreatedAt, Status
FROM PassportAdminDashboard.APIKeys
WHERE UserID = @UserId
  AND Status = 'Active'
  AND ExpiresAt > GETDATE()
ORDER BY CreatedAt DESC;
```

**Result schema:**
```csharp
public class ApiKeyRecord
{
    public int ApiKeyID { get; set; }
    public string Name { get; set; }
    public string KeyValue { get; set; }  // Encrypted in DB
    public string Scopes { get; set; }     // "read,write" (CSV)
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; }     // "Active" or "Revoked"
}
```

**Decryption:**
```csharp
var decryptedKey = DecryptAES(record.KeyValue, encryptionKey);
// Result: sk_dev_1a2b3c4d5e6f7g8h9i0j...
```

---

## Option 2: Retrieve via Passport Admin API

### When to use:
- User is authenticated to Passport system
- Need to fetch user's own API keys
- Want to list all active keys

### Endpoint:
```
GET https://dev.grippingly.com/api/v1/auth/api-keys
Headers:
  Authorization: Bearer {user_auth_token}
  Content-Type: application/json
```

### Response:
```json
{
  "success": true,
  "data": [
    {
      "apiKeyId": "key_abc123",
      "name": "ChatBot-Development-2026-09",
      "description": "API key for ChatBot workflow agent",
      "scopes": ["read", "write"],
      "createdAt": "2026-03-30T10:00:00Z",
      "expiresAt": "2026-12-28T23:59:59Z",
      "lastUsed": "2026-09-29T14:32:00Z",
      "status": "active",
      "ipRestrictions": null
    }
  ]
}
```

### Usage:
```csharp
var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", $"Bearer {userAuthToken}");

var response = await client.GetAsync("https://dev.grippingly.com/api/v1/auth/api-keys");
var json = await response.Content.ReadAsStringAsync();
var keys = JsonConvert.DeserializeObject<ApiKeysResponse>(json);

foreach (var key in keys.Data)
{
    Console.WriteLine($"Name: {key.Name}, Expires: {key.ExpiresAt}");
}
```

---

## Option 3: Retrieve from Environment Variables

### When to use:
- Key stored in .env file or OS environment
- Local development setup
- CI/CD pipeline

### Common locations:
```bash
# .env file (local development)
API_KEY=sk_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p

# Environment variable (Windows)
$env:API_KEY = "sk_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"

# Environment variable (Linux/Mac)
export API_KEY="sk_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"

# Azure Key Vault
az keyvault secret show --name "api-key" --vault-name "MyVault"

# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id api-key
```

### Usage in code:
```csharp
// C# - read from environment
var apiKey = Environment.GetEnvironmentVariable("API_KEY");

// Node.js - read from .env
const apiKey = process.env.API_KEY;

// Python - read from .env
import os
api_key = os.getenv("API_KEY")
```

---

## Option 4: Retrieve from Password Manager

### When to use:
- User stored key manually
- Personal/manual key management
- Not recommended for production servers

### Common password managers:
- **1Password** — `op item get "API Key"`
- **Bitwarden** — Via CLI or extension
- **LastPass** — Via CLI or extension
- **KeePass** — Manual retrieval from file
- **Apple Keychain** — `security find-generic-password`

### Example (1Password CLI):
```bash
op item get "ChatBot-Development-2026-09" --field=token
# Output: sk_dev_1a2b3c4d5e6f7g8h9i0j...
```

---

## Step 1: Validate Key Freshness

After retrieval, validate key:

```csharp
public class ApiKeyValidator
{
    public ValidationResult Validate(string apiKey, DateTime expiresAt)
    {
        // Check format
        if (!apiKey.StartsWith("sk_"))
            return ValidationResult.Invalid("Wrong format");

        // Check expiration
        if (DateTime.UtcNow > expiresAt)
            return ValidationResult.Expired($"Expired on {expiresAt}");

        // Check length (should be ~50 chars)
        if (apiKey.Length < 40)
            return ValidationResult.Invalid("Key too short");

        return ValidationResult.Valid();
    }
}
```

---

## Step 2: Check Key Status

Make test API call:

```csharp
public async Task<KeyStatus> CheckKeyStatusAsync(string apiKey)
{
    var client = new HttpClient();
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

    try
    {
        var response = await client.GetAsync(
            "https://dev.grippingly.com/api/v1/auth/validate");

        if (response.IsSuccessStatusCode)
        {
            return new KeyStatus
            {
                Valid = true,
                Status = "Active",
                Scopes = response.Headers.GetValues("X-API-Scopes")
            };
        }
        else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            return new KeyStatus { Valid = false, Status = "Revoked or Expired" };
        }
        else if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            return new KeyStatus { Valid = false, Status = "Insufficient Scopes" };
        }
    }
    catch (Exception ex)
    {
        return new KeyStatus { Valid = false, Status = $"Error: {ex.Message}" };
    }
}
```

---

## Step 3: Handle Expired/Revoked Keys

| Scenario | Action |
|----------|--------|
| Key not found | Suggest user create new key via [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md) |
| Key expired | Suggest create new key with longer expiration |
| Key revoked | Suggest create new key immediately |
| Invalid format | Check key was copied correctly |
| Rate limited | Wait 1 minute before retrying |

---

## Error Handling

```csharp
try
{
    var apiKey = RetrieveApiKey(userId);
    
    if (string.IsNullOrEmpty(apiKey))
    {
        logger.LogWarning($"No API key found for user {userId}");
        // Redirect to create new key
        return RedirectTo(APIKeyQuestionnaire);
    }

    var isValid = await ValidateKeyAsync(apiKey);
    
    if (!isValid)
    {
        logger.LogWarning($"API key validation failed for user {userId}");
        // Refresh or create new key
        return RedirectTo(APIKeyQuestionnaire);
    }

    return apiKey;
}
catch (Exception ex)
{
    logger.LogError(ex, "Failed to retrieve API key");
    return null;
}
```

---

## Security Considerations

🔐 **DO:**
- Decrypt keys from database using secure key management
- Use HTTPS for all API calls
- Log only last 4 characters of key
- Validate key immediately after retrieval
- Set timeout for key operations

🚫 **DON'T:**
- Log full API key
- Store unencrypted keys in logs
- Cache key in memory longer than needed
- Pass key through unencrypted channels
- Expose key in error messages

---

## Example: Complete Retrieval Flow

```csharp
public async Task<string> GetActiveApiKeyAsync(int userId)
{
    // Step 1: Try database first
    var dbKey = await database.GetActiveApiKeyAsync(userId);
    if (dbKey != null)
    {
        logger.LogInfo($"Key retrieved from DB (expires: {dbKey.ExpiresAt})");
        return dbKey.Value;
    }

    // Step 2: Try environment
    var envKey = Environment.GetEnvironmentVariable("API_KEY");
    if (!string.IsNullOrEmpty(envKey))
    {
        logger.LogInfo("Key retrieved from environment");
        return envKey;
    }

    // Step 3: Try API
    try
    {
        var apiKey = await RetrieveViaApiAsync(userAuthToken);
        if (!string.IsNullOrEmpty(apiKey))
        {
            logger.LogInfo("Key retrieved via API");
            return apiKey;
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Failed to retrieve via API");
    }

    // Step 4: No key found
    logger.LogError($"No API key available for user {userId}");
    throw new InvalidOperationException("No active API key found");
}
```
