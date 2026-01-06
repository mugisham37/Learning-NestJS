# Todo API - NestJS Learning Project

A simple but complete Todo API built with NestJS and PostgreSQL. This project is designed to teach NestJS fundamentals through hands-on implementation.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Key Concepts Explained](#key-concepts-explained)
- [Common Issues](#common-issues)

## ✨ Features

- Create, Read, Update, and Delete todos (CRUD operations)
- Filter todos by completion status
- Input validation with detailed error messages
- PostgreSQL database with TypeORM
- RESTful API design
- Comprehensive code comments for learning

## 🛠 Technology Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **TypeORM** - Database ORM for TypeScript
- **class-validator** - Validation library
- **class-transformer** - Object transformation

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)

To verify your installations:

```bash
node --version
npm --version
psql --version
```

## 🚀 Installation

1. **Clone or navigate to the project directory:**

```bash
cd TODO-APP
```

2. **Install dependencies:**

```bash
npm install
```

This will install all the packages listed in `package.json`, including:
- NestJS core packages
- TypeORM and PostgreSQL driver
- Validation libraries
- TypeScript and development tools

## 🗄 Database Setup

### Step 1: Start PostgreSQL

Make sure PostgreSQL is running on your system.

**Windows:**
- PostgreSQL should start automatically as a service
- Or use: `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`

**Mac (using Homebrew):**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo service postgresql start
```

### Step 2: Create the Database

Open a terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE todo_db;
```

Verify it was created:

```sql
\l
```

You should see `todo_db` in the list. Exit psql:

```sql
\q
```

### Step 3: Configure Environment Variables

The project includes a `.env` file with default settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=todo_db
PORT=3000
NODE_ENV=development
```

**Update these values** to match your PostgreSQL setup:
- If your PostgreSQL password is different, update `DB_PASSWORD`
- If you're using a different database name, update `DB_DATABASE`

### Step 4: Verify Database Connection

The application will automatically create the `todos` table when it starts (thanks to `synchronize: true` in TypeORM configuration).

**⚠️ Important:** `synchronize: true` is only for development. In production, always use migrations!

## 🏃‍♂️ Running the Application

### Development Mode (with auto-reload)

```bash
npm run start:dev
```

This starts the server with hot-reload enabled. The server will automatically restart when you make code changes.

You should see output like:

```
[Nest] 12345  - 01/06/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/06/2026, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/06/2026, 10:30:01 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 12345  - 01/06/2026, 10:30:01 AM     LOG [InstanceLoader] TodosModule dependencies initialized
Application is running on: http://localhost:3000
```

### Production Mode

```bash
# Build the application
npm run build

# Start the built application
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

This starts the server in debug mode, allowing you to attach a debugger.

## 📡 API Endpoints

### Base URL

```
http://localhost:3000
```

### 1. Create a Todo

**POST** `/todos`

Create a new todo item.

**Request Body:**

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, and coffee"
}
```

- `title` (required): String, max 255 characters
- `description` (optional): String, any length

**Response:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, and coffee",
  "is_completed": false,
  "created_at": "2026-01-06T10:30:00.000Z",
  "updated_at": "2026-01-06T10:30:00.000Z"
}
```

**Example with curl:**

```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread, and coffee"}'
```

**Example with PowerShell:**

```powershell
$body = @{
    title = "Buy groceries"
    description = "Milk, eggs, bread, and coffee"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/todos" -Method Post -Body $body -ContentType "application/json"
```

---

### 2. Get All Todos

**GET** `/todos`

Retrieve all todos.

**Response:** `200 OK`

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread, and coffee",
    "is_completed": false,
    "created_at": "2026-01-06T10:30:00.000Z",
    "updated_at": "2026-01-06T10:30:00.000Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "title": "Finish homework",
    "description": null,
    "is_completed": true,
    "created_at": "2026-01-06T11:00:00.000Z",
    "updated_at": "2026-01-06T11:30:00.000Z"
  }
]
```

**Example with curl:**

```bash
curl http://localhost:3000/todos
```

**Example with PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos" -Method Get
```

---

### 3. Get All Todos (Filtered)

**GET** `/todos?completed=true` or `/todos?completed=false`

Retrieve todos filtered by completion status.

**Query Parameters:**
- `completed` (optional): `true` or `false`

**Examples:**

Get only completed todos:
```bash
curl http://localhost:3000/todos?completed=true
```

Get only incomplete todos:
```bash
curl http://localhost:3000/todos?completed=false
```

**PowerShell:**

```powershell
# Get completed todos
Invoke-RestMethod -Uri "http://localhost:3000/todos?completed=true" -Method Get

# Get incomplete todos
Invoke-RestMethod -Uri "http://localhost:3000/todos?completed=false" -Method Get
```

---

### 4. Get a Single Todo

**GET** `/todos/:id`

Retrieve a specific todo by its ID.

**Response:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, and coffee",
  "is_completed": false,
  "created_at": "2026-01-06T10:30:00.000Z",
  "updated_at": "2026-01-06T10:30:00.000Z"
}
```

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Todo with ID \"invalid-id\" not found",
  "error": "Not Found"
}
```

**Example with curl:**

```bash
curl http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000
```

**Example with PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000" -Method Get
```

---

### 5. Update a Todo

**PATCH** `/todos/:id`

Update a todo (partial update - only send fields you want to change).

**Request Body** (all fields optional):

```json
{
  "title": "Buy groceries and snacks",
  "description": "Updated description",
  "is_completed": true
}
```

**Response:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy groceries and snacks",
  "description": "Updated description",
  "is_completed": true,
  "created_at": "2026-01-06T10:30:00.000Z",
  "updated_at": "2026-01-06T12:00:00.000Z"
}
```

**Example with curl:**

```bash
# Mark a todo as completed
curl -X PATCH http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"is_completed": true}'
```

**Example with PowerShell:**

```powershell
$body = @{
    is_completed = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000" -Method Patch -Body $body -ContentType "application/json"
```

---

### 6. Delete a Todo

**DELETE** `/todos/:id`

Delete a todo by its ID.

**Response:** `204 No Content`

(No response body - the status code indicates success)

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Todo with ID \"invalid-id\" not found",
  "error": "Not Found"
}
```

**Example with curl:**

```bash
curl -X DELETE http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000
```

**Example with PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000" -Method Delete
```

---

### Error Responses

#### Validation Error (400 Bad Request)

When you send invalid data:

```json
{
  "statusCode": 400,
  "message": [
    "Title is required",
    "Title must not exceed 255 characters"
  ],
  "error": "Bad Request"
}
```

#### Not Found Error (404 Not Found)

When a todo doesn't exist:

```json
{
  "statusCode": 404,
  "message": "Todo with ID \"invalid-id\" not found",
  "error": "Not Found"
}
```

#### Server Error (500 Internal Server Error)

When something goes wrong on the server:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## 📁 Project Structure

```
src/
├── app.module.ts           # Root module - imports all feature modules
├── main.ts                 # Application entry point - bootstraps NestJS
└── todos/                  # Todos feature module
    ├── todos.module.ts     # Todos module configuration
    ├── todos.controller.ts # HTTP request handlers (routes)
    ├── todos.service.ts    # Business logic layer
    ├── todo.entity.ts      # Database entity (table definition)
    └── dto/                # Data Transfer Objects
        ├── create-todo.dto.ts  # Validation for creating todos
        └── update-todo.dto.ts  # Validation for updating todos
```

### File Purposes

| File | Purpose | Key Concepts |
|------|---------|--------------|
| `main.ts` | Bootstraps the application, starts the HTTP server | Application initialization, ValidationPipe |
| `app.module.ts` | Root module, configures database and imports feature modules | Module composition, TypeORM configuration |
| `todos.module.ts` | Todos feature module, wires together controller, service, and entity | Module organization, dependency registration |
| `todos.controller.ts` | Handles HTTP requests, defines API routes | Controllers, route decorators, HTTP methods |
| `todos.service.ts` | Contains business logic, interacts with database | Services, dependency injection, repository pattern |
| `todo.entity.ts` | Defines database table structure | Entities, TypeORM decorators, database schema |
| `create-todo.dto.ts` | Defines and validates data for creating todos | DTOs, validation decorators |
| `update-todo.dto.ts` | Defines and validates data for updating todos | DTOs, partial validation |

## 🎓 Key Concepts Explained

### What is a Module?

A module is a class decorated with `@Module()`. It organizes related code (controllers, services, entities) into cohesive blocks.

**Why modules?**
- Organization: Keep related code together
- Encapsulation: Hide implementation details
- Reusability: Import modules into other modules
- Scalability: Large apps = many feature modules

**Example:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Todo])],  // Modules this module depends on
  controllers: [TodosController],                // HTTP request handlers
  providers: [TodosService],                     // Injectable services
  exports: [TodosService],                       // What other modules can use
})
export class TodosModule {}
```

### What is a Controller?

A controller handles HTTP requests and returns responses. It's decorated with `@Controller()` and contains methods decorated with `@Get()`, `@Post()`, etc.

**Controller's job:**
- Receive HTTP requests
- Extract data from request (body, params, query)
- Call service methods
- Return HTTP responses

**Example:**
```typescript
@Controller('todos')  // Base route: /todos
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Post()  // POST /todos
  async create(@Body() createTodoDto: CreateTodoDto) {
    return await this.todosService.create(createTodoDto);
  }

  @Get(':id')  // GET /todos/:id
  async findOne(@Param('id') id: string) {
    return await this.todosService.findOne(id);
  }
}
```

### What is a Service?

A service contains business logic. It's decorated with `@Injectable()` and can be injected into controllers or other services.

**Service's responsibility:**
- Business logic and data manipulation
- Database operations (through repositories)
- Complex calculations or processing
- Reusable functionality

**Why separate services from controllers?**
- Single Responsibility Principle
- Testability (test logic without HTTP)
- Reusability (use in multiple controllers)

**Example:**
```typescript
@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create(createTodoDto);
    return await this.todoRepository.save(todo);
  }
}
```

### What is Dependency Injection?

Dependency Injection (DI) is a design pattern where classes receive their dependencies through constructors instead of creating them.

**Without DI:**
```typescript
class TodosController {
  private todosService = new TodosService();  // ❌ Hard to test, tightly coupled
}
```

**With DI:**
```typescript
class TodosController {
  constructor(private todosService: TodosService) {}  // ✅ NestJS injects it
}
```

**How does NestJS know what to inject?**
1. `TodosModule` lists `TodosService` in its `providers` array
2. NestJS creates a `TodosService` instance
3. When creating `TodosController`, NestJS sees it needs `TodosService`
4. NestJS injects the `TodosService` instance automatically

**Benefits:**
- Easier testing (inject mock services)
- Loose coupling (controller doesn't know how service is created)
- Lifecycle management (NestJS handles singleton pattern)

### What are Decorators?

Decorators are special functions that add metadata to classes, methods, or parameters. They start with `@`.

**Common decorators:**

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@Module()` | Define a module | `@Module({ controllers: [TodosController] })` |
| `@Injectable()` | Make a class injectable | `@Injectable() class TodosService {}` |
| `@Controller('route')` | Define a controller with base route | `@Controller('todos')` |
| `@Get()` | Define a GET route | `@Get(':id')` handles `GET /todos/:id` |
| `@Post()` | Define a POST route | `@Post()` handles `POST /todos` |
| `@Body()` | Extract request body | `create(@Body() dto: CreateTodoDto)` |
| `@Param('key')` | Extract route parameter | `findOne(@Param('id') id: string)` |
| `@Query('key')` | Extract query parameter | `findAll(@Query('completed') completed?: boolean)` |

### What is a DTO?

DTO = Data Transfer Object. It's a class that defines the shape and validation rules for data.

**Why use DTOs?**
1. **Type safety:** TypeScript knows what properties to expect
2. **Validation:** Ensure data quality with decorators
3. **Documentation:** DTOs serve as a contract for API consumers
4. **Security:** Only defined properties can be set (prevents mass assignment)

**Example:**
```typescript
export class CreateTodoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

When a request comes in, NestJS:
1. Transforms the JSON to a `CreateTodoDto` instance
2. Runs all validation decorators
3. Returns 400 if validation fails
4. Passes the validated DTO to your controller if validation succeeds

### What is an Entity?

An entity is a class that represents a database table. It's decorated with `@Entity()`.

**Example:**
```typescript
@Entity('todos')  // Table name
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @CreateDateColumn()
  created_at: Date;
}
```

TypeORM uses this metadata to:
- Create the database table (when `synchronize: true`)
- Map database rows to TypeScript objects
- Generate SQL queries from your method calls

### What is a Repository?

A repository provides methods to interact with a database table. TypeORM gives you `Repository<Entity>` for each entity.

**Common repository methods:**

| Method | Purpose | SQL Equivalent |
|--------|---------|----------------|
| `repository.create(data)` | Create entity instance (doesn't save) | - |
| `repository.save(entity)` | Insert or update | `INSERT INTO ... ` or `UPDATE ...` |
| `repository.find()` | Get all records | `SELECT * FROM ...` |
| `repository.findOne({ where: { id } })` | Get one record | `SELECT * FROM ... WHERE id = ...` |
| `repository.update(id, data)` | Update by ID | `UPDATE ... SET ... WHERE id = ...` |
| `repository.remove(entity)` | Delete a record | `DELETE FROM ... WHERE id = ...` |

**Example:**
```typescript
@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async findAll(): Promise<Todo[]> {
    return await this.todoRepository.find();
  }
}
```

### Async/Await

`async`/`await` makes asynchronous code look synchronous.

**Why async?**
- Database operations take time (I/O)
- `async` marks a function as asynchronous - it returns a Promise
- `await` pauses execution until the Promise resolves
- Keeps the app responsive while waiting

**Example:**
```typescript
async function getTodo(id: string): Promise<Todo> {
  const todo = await this.todoRepository.findOne({ where: { id } });
  // Code here waits for the database query to complete
  return todo;
}
```

**What happens if you forget `await`?**
```typescript
// ❌ Wrong - returns a Promise, not a Todo
const todo = this.todoRepository.findOne({ where: { id } });
console.log(todo.title);  // Error: todo is a Promise, not a Todo object

// ✅ Correct - waits for Promise to resolve
const todo = await this.todoRepository.findOne({ where: { id } });
console.log(todo.title);  // Works!
```

### HTTP Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH (default) |
| 201 | Created | Successful POST (default for @Post()) |
| 204 | No Content | Successful DELETE with no response body |
| 400 | Bad Request | Validation failed, invalid input |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Unexpected error on server |

NestJS automatically returns:
- 200 for GET, PATCH
- 201 for POST
- 404 when you throw `NotFoundException`
- 400 when validation fails
- 500 for unhandled errors

### Synchronize vs Migrations

**`synchronize: true` (development only):**
- TypeORM automatically creates/updates tables on app startup
- Compares entities to database schema
- Easy for development
- ⚠️ **DANGER in production:** Can cause data loss!

**Migrations (production):**
- Version-controlled SQL scripts
- Track schema changes over time
- Can be reviewed, tested, and rolled back
- Required for production applications

For this learning project, `synchronize: true` is fine. But remember: real apps use migrations.

## 🐛 Common Issues

### Issue: "database \"todo_db\" does not exist"

**Solution:** Create the database in PostgreSQL:

```bash
psql -U postgres
CREATE DATABASE todo_db;
\q
```

### Issue: "password authentication failed for user \"postgres\""

**Solution:** Update the password in [.env](.env):

```env
DB_PASSWORD=your_actual_password
```

### Issue: "Port 3000 is already in use"

**Solution:** Either:
1. Stop the other process using port 3000
2. Change the port in [src/main.ts](src/main.ts):

```typescript
await app.listen(3001);  // Use a different port
```

### Issue: "Cannot find module '@nestjs/common'"

**Solution:** Install dependencies:

```bash
npm install
```

### Issue: "relation \"todos\" does not exist"

**Solution:** Make sure `synchronize: true` in [app.module.ts](src/app.module.ts) and restart the app. TypeORM will create the table automatically.

### Issue: Validation not working

**Solution:** Ensure `ValidationPipe` is configured in [src/main.ts](src/main.ts):

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

### Issue: Can't connect to database

**Checklist:**
1. Is PostgreSQL running? `psql --version`
2. Does the database exist? `psql -U postgres -l`
3. Are credentials correct in `.env`?
4. Is the database server accessible? `psql -U postgres -d todo_db`

## 📚 Learning Checklist

Use this checklist to verify you understand the key concepts:

### NestJS Fundamentals

- [ ] What is a module and why does NestJS use them?
- [ ] What does the `@Module()` decorator do?
- [ ] What is a controller's job?
- [ ] How does `@Controller('todos')` work?
- [ ] How do route decorators (`@Get()`, `@Post()`) map to HTTP?
- [ ] Why separate services from controllers?
- [ ] What is a service's responsibility?
- [ ] What does `constructor(private todosService: TodosService)` do?
- [ ] Why don't we use `new TodosService()`?
- [ ] How does NestJS know what to inject?
- [ ] What is a decorator?
- [ ] Explain `@Body()`, `@Param()`, `@Query()`
- [ ] What is a DTO and why use them?
- [ ] How does `class-validator` work with DTOs?

### Database & TypeORM

- [ ] What is an entity?
- [ ] How does `@Entity()` relate to a database table?
- [ ] What do `@Column()`, `@PrimaryGeneratedColumn()` do?
- [ ] What is a repository?
- [ ] How do you get a repository in NestJS?
- [ ] What methods does a repository provide?
- [ ] How do you insert a record?
- [ ] How do you find all records?
- [ ] How do you find by ID?
- [ ] How do you update a record?
- [ ] How do you delete a record?
- [ ] What does `synchronize: true` do?
- [ ] Why is it dangerous in production?
- [ ] What are migrations?

### HTTP & REST

- [ ] What's the difference between POST, GET, PATCH, PUT, DELETE?
- [ ] When do you use each HTTP method?
- [ ] What do 200, 201, 204, 400, 404, 500 mean?
- [ ] When does your API return each status code?
- [ ] What is a request body?
- [ ] What is a query parameter?
- [ ] What is a route parameter?
- [ ] How do you access each in NestJS?

### General Programming

- [ ] What does `async` do?
- [ ] What does `await` do?
- [ ] What happens if you forget `await`?
- [ ] What happens when your service throws an error?
- [ ] How does NestJS handle exceptions?
- [ ] What is `NotFoundException`?
- [ ] Why use UUID for IDs?
- [ ] What are the tradeoffs of UUID vs auto-increment?

## 🎯 Next Steps

Once you've completed and understood this project:

1. **Add a new field:** Try adding a `priority` field with values 'low', 'medium', 'high'
2. **Add sorting:** Implement sorting todos by created_at or title
3. **Add pagination:** Limit the number of todos returned
4. **Add testing:** Write unit tests for the service and e2e tests for the API
5. **Add migrations:** Replace `synchronize: true` with proper migrations
6. **Add logging:** Use NestJS's built-in logger
7. **Add documentation:** Use Swagger/OpenAPI to document your API

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [class-validator Documentation](https://github.com/typestack/class-validator)
- [REST API Best Practices](https://restfulapi.net/)

## 🤝 Questions?

If you get stuck, review:
1. The code comments in each file - they explain everything
2. This README
3. The NestJS documentation
4. The error messages (they're usually helpful!)

Remember: The goal is not just to make it work, but to **understand every line of code**.

---

**Happy learning! 🚀**
