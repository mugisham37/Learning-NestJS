# API Examples

## Base URL
`http://localhost:3000`

---

## Endpoints

### 1. Create Todo
**Method:** `POST`  
**URL:** `/todos`  
**Body:**
```json
{
  "title": "Learn NestJS",
  "description": "Complete the Todo API project"
}
```

---

### 2. Get All Todos
**Method:** `GET`  
**URL:** `/todos`

---

### 3. Get Completed Todos
**Method:** `GET`  
**URL:** `/todos?completed=true`

---

### 4. Get Incomplete Todos
**Method:** `GET`  
**URL:** `/todos?completed=false`

---

### 5. Get Single Todo
**Method:** `GET`  
**URL:** `/todos/{id}`  
*Replace `{id}` with actual todo ID*

---

### 6. Update Todo (Mark Complete)
**Method:** `PATCH`  
**URL:** `/todos/{id}`  
**Body:**
```json
{
  "is_completed": true
}
```

---

### 7. Update Todo (Change Title)
**Method:** `PATCH`  
**URL:** `/todos/{id}`  
**Body:**
```json
{
  "title": "Updated Title"
}
```

---

### 8. Update Todo (Multiple Fields)
**Method:** `PATCH`  
**URL:** `/todos/{id}`  
**Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "is_completed": false
}
```

---

### 9. Delete Todo
**Method:** `DELETE`  
**URL:** `/todos/{id}`

---

## Quick Test (PowerShell)

```powershell
# Create
$todo = Invoke-RestMethod -Uri "http://localhost:3000/todos" -Method Post -ContentType "application/json" -Body '{"title":"Test","description":"Test"}'
$id = $todo.id

# Get all
Invoke-RestMethod -Uri "http://localhost:3000/todos" -Method Get

# Get one
Invoke-RestMethod -Uri "http://localhost:3000/todos/$id" -Method Get

# Update
Invoke-RestMethod -Uri "http://localhost:3000/todos/$id" -Method Patch -ContentType "application/json" -Body '{"is_completed":true}'

# Delete
Invoke-RestMethod -Uri "http://localhost:3000/todos/$id" -Method Delete
```
