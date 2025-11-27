# API Documentation - CreativIA

## Base URL

```
Development: http://localhost:8000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication via session cookies. Login first to obtain a session.

## Endpoints

### Authentication

#### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "user_id": 123
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

#### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

#### Logout

```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Images

#### Upload Image

```http
POST /api/images/upload
```

**Authentication:** Required

**Request:** `multipart/form-data`
- `image`: File (JPG, PNG, GIF, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "image_id": 456,
  "path": "/uploads/img_123456.jpg",
  "filename": "img_123456.jpg"
}
```

**Response (400):**
```json
{
  "success": false,
  "errors": ["File size exceeds maximum of 5MB"]
}
```

---

### Tutorials

#### Generate Tutorial

```http
POST /api/tutorials/generate
```

**Authentication:** Required

**Request Body:**
```json
{
  "image_id": 456,
  "title": "My Drawing Tutorial",
  "description": "Learning to draw a landscape",
  "is_public": false
}
```

**Response (200):**
```json
{
  "success": true,
  "tutorial_id": 789,
  "total_steps": 5
}
```

---

#### Get Tutorial

```http
GET /api/tutorials/{id}
```

**Authentication:** Required (unless public)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "title": "My Drawing Tutorial",
    "description": "Learning to draw a landscape",
    "total_steps": 5,
    "difficulty_level": "intermediate",
    "is_public": false,
    "steps": [
      {
        "id": 1,
        "step_number": 1,
        "title": "Step 1: Basic Outline",
        "description": "Start with main shapes",
        "image_path": "/storage/tutorials/123/step_1.png",
        "instructions": "Draw the largest shapes first"
      }
    ]
  }
}
```

---

#### Get User Tutorials

```http
GET /api/tutorials/user/{userId}
```

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of results (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "title": "My Drawing Tutorial",
      "total_steps": 5,
      "difficulty_level": "intermediate",
      "created_at": "2024-01-15 10:30:00"
    }
  ]
}
```

---

#### Update Progress

```http
PUT /api/tutorials/{id}/progress
```

**Authentication:** Required

**Request Body:**
```json
{
  "current_step": 3,
  "completed_steps": [1, 2, 3]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Progress updated"
}
```

---

#### Share Tutorial

```http
POST /api/tutorials/{id}/share
```

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Tutorial is now public",
  "share_url": "http://localhost:8000/tutorial/789"
}
```

---

## Python AI Service API

### Base URL

```
http://localhost:5000
```

### Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "service": "CreativIA AI Processing"
}
```

---

### Process Image

```http
POST /process
```

**Request:** `multipart/form-data`
- `image`: File

**Response (200):**
```json
{
  "success": true,
  "steps": [
    {
      "title": "Step 1: Basic Outline",
      "description": "Start with main shapes",
      "instructions": "Draw the largest shapes first",
      "image_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ],
  "metadata": {
    "total_steps": 5,
    "difficulty": "intermediate",
    "estimated_time": "25 minutes"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |

## Rate Limiting

Currently no rate limiting implemented. In production, consider:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Examples

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"secret123"}'
```

**Upload Image:**
```bash
curl -X POST http://localhost:8000/api/images/upload \
  -F "image=@/path/to/image.jpg" \
  -b cookies.txt
```

### JavaScript Examples

**Using Fetch API:**
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'secret123'
  })
});

const data = await response.json();
console.log(data);
```

**Upload Image:**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```
