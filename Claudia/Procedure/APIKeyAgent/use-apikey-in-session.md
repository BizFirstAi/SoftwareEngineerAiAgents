# Use API Key in Session

**Purpose:** How to pass API key to session manager and use it for authentication.

---

## Overview

Once you have an API key (from [check-existing-apikey.md](check-existing-apikey.md) or [create-apikey-guided.md](create-apikey-guided.md)), integrate it into your session.

---

## Step 1: Pass Key to Session Manager

### Session Manager Initialization

```csharp
// Initialize session with API key
var session = new SessionManager(
    apiKey: "sk_dev_1a2b3c4d5e6f7g8h9i0j...",
    environment: "development"
);

// Or via dependency injection
services.AddScoped<ISessionManager>(provider =>
    new SessionManager(
        apiKey: configuration["API_KEY"],
        environment: configuration["ENVIRONMENT"]
    )
);
```

### Store in Secure Context

```csharp
public class SessionContext
{
    public string UserId { get; set; }
    public string SessionId { get; set; }
    [SensitiveData] // Marked for encryption in memory
    public string ApiKey { get; set; }
    public string[] Scopes { get; set; }
    public DateTime ExpiresAt { get; set; }
    
    public bool IsApiKeyValid => 
        !string.IsNullOrEmpty(ApiKey) && 
        DateTime.UtcNow < ExpiresAt;
}
```

---

## Step 2: Add to HTTP Headers

### For HTTP Requests

**Standard pattern:**
```
Authorization: Bearer {apikey}
```

### C# Example (HttpClient)

```csharp
public class ApiClient
{
    private readonly HttpClient _client;
    private readonly string _apiKey;

    public ApiClient(ISessionManager session)
    {
        _apiKey = session.GetApiKey();
        _client = new HttpClient();
    }

    public async Task<T> GetAsync<T>(string endpoint)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.Authorization = 
            new AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _client.SendAsync(request);
        // Handle response...
        return await response.Content.ReadAsAsync<T>();
    }

    public async Task<T> PostAsync<T>(string endpoint, object data)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(
                JsonConvert.SerializeObject(data),
                Encoding.UTF8,
                "application/json"
            )
        };
        request.Headers.Authorization = 
            new AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _client.SendAsync(request);
        return await response.Content.ReadAsAsync<T>();
    }
}
```

### JavaScript Example (Fetch)

```javascript
const apiKey = sessionStorage.getItem('API_KEY'); // Or from env

const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
};

const response = await fetch('https://dev.grippingly.com/api/v1/data', {
    method: 'GET',
    headers: headers
});

const data = await response.json();
```

### Python Example (Requests)

```python
import requests

api_key = os.getenv('API_KEY')

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://dev.grippingly.com/api/v1/data',
    headers=headers
)

data = response.json()
```

---

## Step 3: Error Handling

### Handle Authentication Errors

```csharp
public async Task<ApiResponse> SafeApiCallAsync(Func<Task<ApiResponse>> apiCall)
{
    try
    {
        return await apiCall();
    }
    catch (HttpRequestException ex) when (ex.StatusCode == 401)
    {
        // 401 Unauthorized - Invalid or expired key
        logger.LogError("API Key is invalid or expired");
        
        // Strategy 1: Refresh from database
        var newKey = await session.RefreshApiKeyAsync();
        if (newKey != null)
        {
            logger.LogInfo("API key refreshed, retrying...");
            return await apiCall();
        }

        // Strategy 2: Prompt user to create new key
        throw new ApiAuthenticationException(
            "API key expired. Please create a new one.",
            needsNewKey: true
        );
    }
    catch (HttpRequestException ex) when (ex.StatusCode == 403)
    {
        // 403 Forbidden - Insufficient scopes
        logger.LogError("API key lacks required scopes");
        throw new ApiAuthorizationException(
            "Your API key doesn't have permission for this operation"
        );
    }
    catch (HttpRequestException ex) when (ex.StatusCode == 429)
    {
        // 429 Too Many Requests - Rate limited
        logger.LogWarning("API rate limit exceeded");
        throw new ApiRateLimitException("Too many requests. Please wait.");
    }
}
```

---

## Step 4: Logging (Security)

### DO Log
```csharp
logger.LogInfo($"API call: {method} {endpoint}");
logger.LogInfo($"API key scopes: {string.Join(",", scopes)}");
logger.LogInfo($"API key expires: {expiresAt}");
logger.LogInfo($"Using API key: ...{apiKey.Substring(apiKey.Length - 4)}"); // Last 4 chars only
logger.LogInfo($"Response status: {response.StatusCode}");
```

### DON'T Log
```csharp
// ❌ NEVER log full key
logger.LogInfo($"API key: {apiKey}");

// ❌ NEVER log in error messages visible to user
throw new Exception($"Auth failed with key {apiKey}");

// ❌ NEVER log request bodies containing secrets
logger.LogInfo($"Request: {request.Body}");
```

---

## Step 5: Monitor Key Usage

### Track Usage

```csharp
public class ApiKeyUsageTracker
{
    public async Task LogApiCallAsync(
        string apiKey,
        string method,
        string endpoint,
        HttpStatusCode statusCode,
        long durationMs)
    {
        await database.InsertAsync(new ApiCallLog
        {
            ApiKeyLastFourChars = apiKey.Substring(apiKey.Length - 4),
            Method = method,
            Endpoint = endpoint,
            StatusCode = statusCode,
            DurationMs = durationMs,
            TimestampUtc = DateTime.UtcNow
        });
    }
}
```

### Set Alerts

Alert if:
- ❌ 401 errors exceed 5 in 5 minutes (key may be invalid)
- ❌ 403 errors indicate insufficient scopes
- ❌ 429 errors indicate rate limiting
- ⚠️ API calls spike suddenly (unusual activity)
- ⏰ Key expiring in 7 days (rotation reminder)

---

## Step 6: Handle Expiration

### Pre-expiration Refresh

```csharp
public async Task<bool> RefreshExpiredKeyAsync(string userId)
{
    var key = await database.GetApiKeyAsync(userId);
    
    // If expiring in < 7 days, suggest refresh
    var daysUntilExpiry = (key.ExpiresAt - DateTime.UtcNow).TotalDays;
    
    if (daysUntilExpiry < 7)
    {
        logger.LogWarning($"API key expiring in {daysUntilExpiry} days");
        await notifications.SendAsync(
            userId,
            "Your API key expires soon. Please create a new one."
        );
        return false; // Don't auto-refresh, user should create new
    }
    
    return true; // Key still valid
}
```

### Rotation Schedule

**Recommended rotation:**
- Development keys: 30 days
- Production keys: 90 days
- High-security: 14 days

**Process:**
1. Create new key (using [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md))
2. Update session/config with new key
3. Test new key works
4. Revoke old key (using [revoke-apikey.md](revoke-apikey.md))

---

## Step 7: Graceful Fallback

### If Key is Missing

```csharp
public async Task<IActionResult> ExecuteWithFallbackAsync(
    Func<Task<IActionResult>> apiOperation)
{
    try
    {
        return await apiOperation();
    }
    catch (InvalidOperationException ex) when (ex.Message.Contains("API key"))
    {
        // Redirect to create key
        return RedirectToAction("CreateApiKey");
    }
    catch (HttpRequestException ex) when (ex.StatusCode == 401)
    {
        // Key invalid - prompt to create new
        return Unauthorized(new { 
            message = "API key invalid. Please create a new one.",
            redirectUrl = "/api-key/create"
        });
    }
}
```

---

## Step 8: Session Cleanup

### On Session End

```csharp
public void OnSessionEnd(SessionContext session)
{
    // Clear API key from memory
    Array.Clear(session.ApiKey.ToCharArray(), 0, session.ApiKey.Length);
    session.ApiKey = null;
    
    // Log session end (without key details)
    logger.LogInfo($"Session {session.SessionId} ended");
    
    // Close resources
    session.Dispose();
}
```

---

## Complete Example: Authenticated Session

```csharp
public class AuthenticatedSession : IDisposable
{
    private readonly string _apiKey;
    private readonly DateTime _expiresAt;
    private readonly HttpClient _client;
    private readonly ILogger _logger;

    public AuthenticatedSession(string apiKey, DateTime expiresAt)
    {
        _apiKey = apiKey ?? throw new ArgumentNullException(nameof(apiKey));
        _expiresAt = expiresAt;
        _client = new HttpClient();
        _logger = LoggerFactory.CreateLogger<AuthenticatedSession>();
        
        ValidateKey();
    }

    private void ValidateKey()
    {
        if (!_apiKey.StartsWith("sk_"))
            throw new ArgumentException("Invalid API key format");

        if (DateTime.UtcNow > _expiresAt)
            throw new InvalidOperationException("API key is expired");
    }

    public async Task<T> GetAsync<T>(string endpoint)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.Authorization = 
            new AuthenticationHeaderValue("Bearer", _apiKey);

        try
        {
            var response = await _client.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"API call failed: {response.StatusCode}");
                response.EnsureSuccessStatusCode();
            }

            var content = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<T>(content);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == 401)
        {
            throw new ApiAuthenticationException("API key invalid or expired", ex);
        }
    }

    public void Dispose()
    {
        _client?.Dispose();
        _logger?.LogInfo("Session disposed");
    }
}
```

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/revoked key | Check [check-existing-apikey.md](check-existing-apikey.md) |
| 403 Forbidden | Insufficient scopes | Create new key with required scopes |
| 429 Too Many Requests | Rate limited | Wait 1 minute, implement backoff |
| Connection timeout | Network issue | Retry with exponential backoff |
| Key not in session | Key wasn't set | Call [retrieve-apikey.md](retrieve-apikey.md) first |
