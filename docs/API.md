# Documentación de API - CreativIA

## URL Base

```
Desarrollo: http://localhost:8000/api
Producción: https://tu-dominio.com/api
```

## Autenticación

La mayoría de los endpoints requieren autenticación mediante cookies de sesión. Inicia sesión primero para obtener una sesión.

## Endpoints

### Autenticación

#### Registrar Usuario

```http
POST /api/auth/register
```

**Cuerpo de la Solicitud:**
```json
{
  "username": "string (3-50 caracteres)",
  "email": "string (email válido)",
  "password": "string (mínimo 6 caracteres)"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Registro exitoso",
  "user_id": 123
}
```

**Respuesta (400):**
```json
{
  "success": false,
  "message": "El correo electrónico ya existe"
}
```

---

#### Iniciar Sesión

```http
POST /api/auth/login
```

**Cuerpo de la Solicitud:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

#### Cerrar Sesión

```http
POST /api/auth/logout
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Cierre de sesión exitoso"
}
```

---

### Imágenes

#### Subir Imagen

```http
POST /api/images/upload
```

**Autenticación:** Requerida

**Solicitud:** `multipart/form-data`
- `image`: Archivo (JPG, PNG, GIF, máx 5MB)

**Respuesta (200):**
```json
{
  "success": true,
  "image_id": 456,
  "path": "/uploads/img_123456.jpg",
  "filename": "img_123456.jpg"
}
```

**Respuesta (400):**
```json
{
  "success": false,
  "errors": ["El tamaño del archivo excede el máximo de 5MB"]
}
```

---

### Tutoriales

#### Generar Tutorial

```http
POST /api/tutorials/generate
```

**Autenticación:** Requerida

**Cuerpo de la Solicitud:**
```json
{
  "image_id": 456,
  "title": "Mi Tutorial de Dibujo",
  "description": "Aprendiendo a dibujar un paisaje",
  "is_public": false
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "tutorial_id": 789,
  "total_steps": 5
}
```

---

#### Obtener Tutorial

```http
GET /api/tutorials/{id}
```

**Autenticación:** Requerida (a menos que sea público)

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "title": "Mi Tutorial de Dibujo",
    "description": "Aprendiendo a dibujar un paisaje",
    "total_steps": 5,
    "difficulty_level": "intermedio",
    "is_public": false,
    "steps": [
      {
        "id": 1,
        "step_number": 1,
        "title": "Paso 1: Esquema Básico",
        "description": "Comienza con las formas principales",
        "image_path": "/storage/tutorials/123/step_1.png",
        "instructions": "Dibuja primero las formas más grandes"
      }
    ]
  }
}
```

---

#### Obtener Tutoriales de Usuario

```http
GET /api/tutorials/user/{userId}
```

**Autenticación:** Requerida

**Parámetros de Consulta:**
- `limit` (opcional): Número de resultados (por defecto: 10)

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "title": "Mi Tutorial de Dibujo",
      "total_steps": 5,
      "difficulty_level": "intermedio",
      "created_at": "2024-01-15 10:30:00"
    }
  ]
}
```

---

#### Actualizar Progreso

```http
PUT /api/tutorials/{id}/progress
```

**Autenticación:** Requerida

**Cuerpo de la Solicitud:**
```json
{
  "current_step": 3,
  "completed_steps": [1, 2, 3]
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Progreso actualizado"
}
```

---

#### Compartir Tutorial

```http
POST /api/tutorials/{id}/share
```

**Autenticación:** Requerida

**Respuesta (200):**
```json
{
  "success": true,
  "message": "El tutorial es ahora público",
  "share_url": "http://localhost:8000/tutorial/789"
}
```

---

## API del Servicio de IA en Python

### URL Base

```
http://localhost:5000
```

### Verificación de Salud

```http
GET /health
```

**Respuesta (200):**
```json
{
  "status": "healthy",
  "service": "CreativIA AI Processing"
}
```

---

### Procesar Imagen

```http
POST /process
```

**Solicitud:** `multipart/form-data`
- `image`: Archivo

**Respuesta (200):**
```json
{
  "success": true,
  "steps": [
    {
      "title": "Paso 1: Esquema Básico",
      "description": "Comienza con las formas principales",
      "instructions": "Dibuja primero las formas más grandes",
      "image_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ],
  "metadata": {
    "total_steps": 5,
    "difficulty": "intermedio",
    "estimated_time": "25 minutos"
  }
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200  | Éxito |
| 400  | Solicitud Incorrecta - Entrada inválida |
| 401  | No Autorizado - Autenticación requerida |
| 403  | Prohibido - Permisos insuficientes |
| 404  | No Encontrado - El recurso no existe |
| 500  | Error Interno del Servidor |

## Límite de Velocidad (Rate Limiting)

Actualmente no hay límite de velocidad implementado. En producción, considera:
- 100 solicitudes por minuto por IP
- 1000 solicitudes por hora por usuario

## Ejemplos

### Ejemplos cURL

**Registrar:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"secret123"}'
```

**Subir Imagen:**
```bash
curl -X POST http://localhost:8000/api/images/upload \
  -F "image=@/path/to/image.jpg" \
  -b cookies.txt
```

### Ejemplos JavaScript

**Usando Fetch API:**
```javascript
// Iniciar Sesión
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

**Subir Imagen:**
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
