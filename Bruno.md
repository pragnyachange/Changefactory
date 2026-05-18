# Bruno API Client

## Introduction

Bruno is an offline API client (i.e., no connection to cloud and stored locally on a folder). It is used to:

- Send HTTP requests (GET, POST, PUT, DELETE, etc.)
- Test APIs
- Organize API collections
- Debug responses

## Environments

Use environments when the same request should work against different setups, i.e., when the request is the same but the server changes.

## Using Bruno

### Creating Requests

- Right-click on the Test folder → new request + configure

### Parameters

Parameters: Use when API wants extra values in the URL for:

- Filtering
- Searching
- Pagination
- Sorting

Can be either used directly in the URL, e.g., GET /users?page=2&limit=20&role=admin (page, limit, role), or put them in the parameter field (? in URL means parameters).

### Headers

Headers: When API expects metadata about the request (for example, Authorization, Content-Type, Accept, etc.)

- Added using Name and Value, e.g.:
  - Authorization: Bearer {{token}}
  - Content-Type: application/json
  - Accept: application/json

Not used for filtering; more for example if API says to send a token or needs an API key.

### Auth

Auth: When the API uses a recognized authentication scheme.

Bruno supports auth at the request level or collection level, so if every request in a collection uses the same auth, setting it at collection level can save time.

The API docs explicitly say "Authentication"; you see terms like Bearer, API Key, Basic, OAuth2. You want Bruno to manage the auth cleanly instead of manually typing headers every time.

### Example

Instead of manually writing:

Authorization: Bearer abc123

You can often set Bearer Token in Bruno's Auth tab.

### Practical Advice

- For a quick one-off test, a manual header is fine.
- For repeated use, the Auth tab is cleaner.

## Variables

Bruno has several variable types. The useful practical split is:

1. **Environment variables**  
   For values reused across many requests and changed by environment.  
   Example: baseUrl, apiKey.

2. **Request variables**  
   For values scoped to just one request. Bruno says these are created in the request's Vars tab and used with {{varName}}.  
   Example:  
   userId = 123  
   status = active

3. **Runtime variables**  
   For values captured while requests run, such as storing a token from one response and reusing it later. Bruno docs show bru.setVar("token", res.body.token) and then using {{token}} later.

4. **Process environment variables**  
   For sensitive values stored in a .env file at the root of the Bruno collection. Bruno recommends these for secrets like API keys and passwords.

### When to Use Vars

Use variables whenever a value might:

- Be reused
- Change later
- Be secret
- Be returned by another request

Example setup:

- Environment: baseUrl = https://api.example.com
- Request var: userId = 42

Request:  
GET {{baseUrl}}/users/{{userId}}

## Body

Use the Body when you are sending actual data to the server.

Most common with:

- POST
- PUT
- PATCH

Example JSON body:

```json
{
  "name": "Emma",
  "email": "emma@example.com"
}
```

Bruno's starter guide includes building requests with data and JSON bodies to interact with APIs.

Use body when:

- Creating a record
- Updating a record
- Submitting form data
- Sending JSON payloads

Do not use body when:

- The API expects URL filters or search terms as query params

## Scripts

Use Scripts when the request needs logic before or after sending.

Bruno's docs say scripting lets you customize requests, and the req object can read or modify the request URL, method, headers, and body before execution.

There are two big uses:

1. **Pre-request script**  
   Runs before the request is sent.  
   Use it to:  
   - Set or modify headers  
   - Build values dynamically  
   - Create timestamps  
   - Inject tokens  
   - Generate random test data  

   Example:  

   ```javascript
   const token = bru.getVar("token");
   req.setHeader("Authorization", `Bearer ${token}`);
   ```

   Bruno documents bru.getVar() and req.setHeader() for this kind of flow.

2. **Post-response / test script**  
   Runs after the response returns.  
   Use it to:  
   - Extract values from responses  
   - Store tokens for later requests  
   - Validate the response  
   - Automate flows  

   Example:  

   ```javascript
   bru.setVar("token", res.body.token);
   ```

   Bruno documents this exact pattern for capturing a token into a runtime variable.

### Also Useful

Bruno supports dynamic variables using faker-style random data with syntax like {{$randomData}}, which can be used in body, auth, params, and other fields.

## Summary



- Environment → "This value changes between local/staging/prod."
- Params → "This value belongs in the URL after ?."
- Headers → "This is metadata like auth or content type."
- Auth → "The API uses a standard auth method."
- Vars → "I want this value reusable, changeable, or hidden."
- Body → "I'm sending actual data."
- Script → "I need logic, automation, or value extraction."

### Login + Protected Request Example

**Request 1: Login**

- Method: POST {{baseUrl}}/login
- Headers: Content-Type: application/json
- Body:

```json
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

- Post-response script:

```javascript
bru.setVar("token", res.body.token);
```


