# Documentación de Arquitectura - CreativIA

## Visión General del Sistema

CreativIA está construido usando una **arquitectura de 3 capas** con una clara separación entre presentación, lógica de negocio y capas de acceso a datos.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Navegador del Usuario                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Capa Frontend (JavaScript)                 │
│  - Componente ImageUploader                             │
│  - Componente TutorialViewer                            │
│  - Componente StepNavigator                             │
│  - Servicio API (Fetch/AJAX)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Capa Backend (PHP MVC)                        │
│  ┌─────────────────────────────────────────────┐        │
│  │          Controladores                      │        │
│  │  - AuthController                           │        │
│  │  - TutorialController                       │        │
│  │  - UserController                           │        │
│  └──────────────┬──────────────────────────────┘        │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────┐        │
│  │          Servicios (Lógica de Negocio)      │        │
│  │  - AuthService                              │        │
│  │  - ImageProcessingService ◄─────────┐       │        │
│  │  - TutorialService                  │       │        │
│  └──────────────┬──────────────────────┼───────┘        │
│                 │                      │                │
│  ┌──────────────▼──────────────────┐   │                │
│  │      Repositorios               │   │                │
│  │  - UserRepository               │   │                │
│  │  - TutorialRepository           │   │                │
│  │  - ImageRepository              │   │                │
│  └──────────────┬──────────────────┘   │                │
46: └─────────────────┼────────────────────────────────────────┘
                  │                      │
                  ▼                      │
┌─────────────────────────────────┐      │
│      Base de Datos (MySQL)      │      │
│  - users                        │      │
│  - images                       │      │
│  - tutorials                    │      │
│  - tutorial_steps               │      │
│  - user_progress                │      │
└─────────────────────────────────┘      │
                                         │
                                         ▼
                        ┌────────────────────────────────┐
                        │  Servicio IA Python (Flask)    │
                        │  ┌──────────────────────────┐  │
                        │  │  Pipeline de Procesamiento│  │
                        │  │  1. EdgeDetector         │  │
                        │  │  2. ContourExtractor     │  │
                        │  │  3. ShapeSimplifier      │  │
                        │  │  4. StepGenerator        │  │
                        │  │  5. TutorialBuilder      │  │
                        │  └──────────────────────────┘  │
                        └────────────────────────────────┘
```

## Patrones de Diseño

### 1. MVC (Modelo-Vista-Controlador)

**Propósito**: Separar preocupaciones entre datos, presentación y lógica de control.

- **Modelos**: Representan entidades del dominio (User, Image, Tutorial, Step)
- **Vistas**: Plantillas HTML para renderizado
- **Controladores**: Manejan solicitudes HTTP y coordinan entre modelos y vistas

### 2. Patrón Repositorio

**Propósito**: Abstraer la lógica de acceso a datos de la lógica de negocio.

```php
UserRepository
  ├── find($id)
  ├── findAll()
  ├── create($data)
  └── update($id, $data)
```

### 3. Capa de Servicio

**Propósito**: Encapsular la lógica de negocio separada de los controladores.

```php
TutorialService
  ├── generateTutorial()
  ├── getTutorial()
  └── shareTutorial()
```

### 4. Inyección de Dependencias

**Propósito**: Lograr bajo acoplamiento y testabilidad.

```php
class TutorialService {
    private $tutorialModel;
    private $imageService;
    
    public function __construct() {
        $this->tutorialModel = new Tutorial();
        $this->imageService = new ImageProcessingService();
    }
}
```

## Aplicación de Principios SOLID

### Principio de Responsabilidad Única (SRP)

Cada clase tiene una razón para cambiar:
- `EdgeDetector` - Solo detección de bordes
- `AuthService` - Solo autenticación
- `TutorialController` - Solo manejo HTTP de tutoriales

### Principio Abierto/Cerrado (OCP)

El sistema está abierto para extensión, cerrado para modificación:
- Middleware puede ser añadido al Router sin modificar la clase Router
- Nuevos servicios pueden ser añadidos sin cambiar código existente

### Principio de Sustitución de Liskov (LSP)

Todos los modelos extienden la clase base `Model` y pueden ser usados intercambiablemente donde se espera el modelo base.

### Principio de Segregación de Interfaz (ISP)

Las clases no dependen de métodos que no usan. Cada servicio tiene una interfaz enfocada.

### Principio de Inversión de Dependencias (DIP)

Los módulos de alto nivel no dependen de módulos de bajo nivel:
- Controladores dependen de Servicios (abstracción)
- Servicios dependen de Repositorios (abstracción)

## Flujo de Datos

### Flujo de Generación de Tutorial

```
1. Usuario sube imagen vía frontend
   ↓
2. ImageUploader envía a backend PHP
   ↓
3. ImageProcessingService valida y almacena
   ↓
4. ImageProcessingService llama a API de IA en Python
   ↓
5. Python procesa imagen a través del pipeline:
   - Detección de bordes
   - Extracción de contornos
   - Simplificación de formas
   - Generación de pasos
   ↓
6. Python retorna datos de pasos a PHP
   ↓
7. TutorialService guarda tutorial y pasos en base de datos
   ↓
8. Usuario redirigido al visor de tutorial
   ↓
9. TutorialViewer carga y muestra pasos
```

## Arquitectura de Seguridad

### Flujo de Autenticación

```
1. Usuario envía credenciales
   ↓
2. AuthController valida entrada
   ↓
3. AuthService verifica credenciales
   ↓
4. Contraseña verificada con bcrypt
   ↓
5. Sesión creada con ID de usuario
   ↓
6. Usuario redirigido al panel de control
```

### Autorización

- Autenticación basada en sesiones
- Verificaciones de propiedad de usuario en servicios
- Control de acceso a tutoriales públicos/privados

### Validación de Entrada

- Validación del lado del cliente (JavaScript)
- Validación del lado del servidor (PHP)
- Validación de tipo y tamaño de archivo
- Prevención de inyección SQL (sentencias preparadas)

## Consideraciones de Escalabilidad

### Escalado Horizontal

- **Backend PHP**: Diseño sin estado permite múltiples instancias detrás de balanceador de carga
- **Servicio IA Python**: Puede correr múltiples instancias para procesamiento paralelo
- **Base de Datos**: Puede implementar réplicas de lectura para escalado de consultas

### Estrategia de Caché

- Datos de sesión en Redis (mejora futura)
- Caché de metadatos de tutoriales
- CDN para activos estáticos

### Procesamiento Asíncrono

- Procesamiento de imágenes puede moverse a cola (RabbitMQ/Redis)
- Procesamiento de trabajos en segundo plano para tareas largas

## Decisiones Tecnológicas

### ¿Por qué MVC Personalizado en PHP?

✅ **Pros**:
- Control total sobre la arquitectura
- Sin sobrecarga de framework
- Valor educativo
- Fácil de entender y modificar

❌ **Contras**:
- Faltan algunas características de framework
- Más trabajo manual

### ¿Por qué Servicio Python Separado?

✅ **Pros**:
- Python sobresale en IA/ML
- Escalado independiente
- Especialización tecnológica
- Arquitectura de microservicios

### ¿Por qué JavaScript Vanilla?

✅ **Pros**:
- No requiere paso de compilación
- Tamaño de paquete más pequeño
- Mejor rendimiento
- Más fácil de entender

## Mejoras Futuras

1. **Autenticación API**: Tokens JWT para acceso API
2. **Procesamiento en Tiempo Real**: WebSocket para actualizaciones de progreso
3. **IA Avanzada**: Modelos de aprendizaje profundo para mejor generación de pasos
4. **Capa de Caché**: Redis para rendimiento
5. **Sistema de Colas**: Procesamiento de trabajos asíncrono
6. **Pruebas**: Pruebas unitarias y de integración
7. **CI/CD**: Pipeline de despliegue automatizado

## Mantenimiento

### Organización de Código

- Seguir estándares de codificación PSR-12 para PHP
- PEP 8 para Python
- ESLint para JavaScript

### Control de Versiones

- Flujo de trabajo con ramas de características
- Revisiones de pull requests
- Versionado semántico

### Monitoreo

- Registro de errores
- Métricas de rendimiento
- Analíticas de usuario
