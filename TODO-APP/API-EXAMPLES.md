### Example API Requests

This file contains example HTTP requests you can use to test the API.
You can use these with curl, PowerShell, or any HTTP client like Postman or Thunder Client.

---

## 1. Create a Todo

### curl (Mac/Linux/Git Bash):
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn NestJS",
    "description": "Complete the Todo API project"
  }'
```

### PowerShell (Windows):
```powershell
$body = @{
    title = "Learn NestJS"
    description = "Complete the Todo API project"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/todos" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

### HTTP Request (Raw):
```http
POST http://localhost:3000/todos
Content-Type: application/json

{
  "title": "Learn NestJS",
  "description": "Complete the Todo API project"
}
```

---

## 2. Get All Todos

### curl:
```bash
curl http://localhost:3000/todos
```

### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos" -Method Get
```

### HTTP Request:
```http
GET http://localhost:3000/todos
```

---

## 3. Get Completed Todos Only

### curl:
```bash
curl "http://localhost:3000/todos?completed=true"
```

### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos?completed=true" -Method Get
```

### HTTP Request:
```http
GET http://localhost:3000/todos?completed=true
```

---

## 4. Get Incomplete Todos Only

### curl:
```bash
curl "http://localhost:3000/todos?completed=false"
```

### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos?completed=false" -Method Get
```

### HTTP Request:
```http
GET http://localhost:3000/todos?completed=false
```

---

## 5. Get a Single Todo

Replace `{id}` with an actual todo ID from the create response.

### curl:
```bash
curl http://localhost:3000/todos/{id}
```

### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos/{id}" -Method Get
```

### HTTP Request:
```http
GET http://localhost:3000/todos/{id}
```

---

## 6. Update a Todo - Mark as Completed

### curl:
```bash
curl -X PATCH http://localhost:3000/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"is_completed": true}'
```

### PowerShell:
```powershell
$body = @{
    is_completed = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/todos/{id}" `
  -Method Patch `
  -Body $body `
  -ContentType "application/json"
```

### HTTP Request:
```http
PATCH http://localhost:3000/todos/{id}
Content-Type: application/json

{
  "is_completed": true
}
```

---

## 7. Update a Todo - Change Title

### curl:
```bash
curl -X PATCH http://localhost:3000/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

### PowerShell:
```powershell
$body = @{
    title = "Updated Title"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/todos/{id}" `
  -Method Patch `
  -Body $body `
  -ContentType "application/json"
```

### HTTP Request:
```http
PATCH http://localhost:3000/todos/{id}
Content-Type: application/json

{
  "title": "Updated Title"
}
```

---

## 8. Update a Todo - Multiple Fields

### curl:
```bash
curl -X PATCH http://localhost:3000/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "is_completed": false
  }'
```

### PowerShell:
```powershell
$body = @{
    title = "Buy groceries"
    description = "Milk, eggs, bread"
    is_completed = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/todos/{id}" `
  -Method Patch `
  -Body $body `
  -ContentType "application/json"
```

### HTTP Request:
```http
PATCH http://localhost:3000/todos/{id}
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "is_completed": false
}
```

---

## 9. Delete a Todo

### curl:
```bash
curl -X DELETE http://localhost:3000/todos/{id}
```

### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos/{id}" -Method Delete
```

### HTTP Request:
```http
DELETE http://localhost:3000/todos/{id}
```

---

## Testing Validation

### Invalid Request - Empty Title

This should return a 400 Bad Request error.

### curl:
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

### PowerShell:
```powershell
$body = @{
    title = ""
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/todos" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

---

### Invalid Request - Title Too Long

This should return a 400 Bad Request error.

### curl:
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "This is a very long title that exceeds the maximum length of 255 characters. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."
  }'
```

---

### Invalid Request - Extra Fields

This should return a 400 Bad Request error (forbidNonWhitelisted).

### curl:
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Valid title",
    "hacker": "This field should not be allowed"
  }'
```

---

## Quick Testing Script

### PowerShell Script to Test All Endpoints:

Save this as `test-api.ps1` and run it:

```powershell
# Test Todo API

Write-Host "1. Creating a todo..." -ForegroundColor Cyan
$createBody = @{
    title = "Test Todo"
    description = "This is a test"
} | ConvertTo-Json

$todo = Invoke-RestMethod -Uri "http://localhost:3000/todos" -Method Post -Body $createBody -ContentType "application/json"
$todoId = $todo.id
Write-Host "Created todo with ID: $todoId" -ForegroundColor Green

Write-Host "`n2. Getting all todos..." -ForegroundColor Cyan
$allTodos = Invoke-RestMethod -Uri "http://localhost:3000/todos" -Method Get
Write-Host "Total todos: $($allTodos.Count)" -ForegroundColor Green

Write-Host "`n3. Getting single todo..." -ForegroundColor Cyan
$singleTodo = Invoke-RestMethod -Uri "http://localhost:3000/todos/$todoId" -Method Get
Write-Host "Found todo: $($singleTodo.title)" -ForegroundColor Green

Write-Host "`n4. Updating todo..." -ForegroundColor Cyan
$updateBody = @{
    is_completed = $true
} | ConvertTo-Json

$updatedTodo = Invoke-RestMethod -Uri "http://localhost:3000/todos/$todoId" -Method Patch -Body $updateBody -ContentType "application/json"
Write-Host "Updated todo - Completed: $($updatedTodo.is_completed)" -ForegroundColor Green

Write-Host "`n5. Getting completed todos..." -ForegroundColor Cyan
$completedTodos = Invoke-RestMethod -Uri "http://localhost:3000/todos?completed=true" -Method Get
Write-Host "Completed todos: $($completedTodos.Count)" -ForegroundColor Green

Write-Host "`n6. Deleting todo..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:3000/todos/$todoId" -Method Delete
Write-Host "Deleted todo with ID: $todoId" -ForegroundColor Green

Write-Host "`nAll tests completed successfully!" -ForegroundColor Green
```

---

## Using VS Code REST Client Extension

If you have the REST Client extension installed in VS Code, you can create a file called `api-requests.http` and use this format:

```http
### Create a todo
POST http://localhost:3000/todos
Content-Type: application/json

{
  "title": "Learn NestJS",
  "description": "Complete the Todo API project"
}

###

### Get all todos
GET http://localhost:3000/todos

###

### Get a single todo (replace with actual ID)
GET http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000

###

### Update a todo (replace with actual ID)
PATCH http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "is_completed": true
}

###

### Delete a todo (replace with actual ID)
DELETE http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000
```

Click "Send Request" above each request to execute it.
