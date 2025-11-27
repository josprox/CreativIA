# Architecture Documentation - CreativIA

## System Overview

CreativIA is built using a **3-tier architecture** with clear separation between presentation, business logic, and data access layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend Layer (JavaScript)                │
│  - ImageUploader Component                              │
│  - TutorialViewer Component                             │
│  - StepNavigator Component                              │
│  - API Service (Fetch/AJAX)                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Backend Layer (PHP MVC)                       │
│  ┌─────────────────────────────────────────────┐        │
│  │          Controllers                        │        │
│  │  - AuthController                           │        │
│  │  - TutorialController                       │        │
│  │  - UserController                           │        │
│  └──────────────┬──────────────────────────────┘        │
│                 │                                        │
│  ┌──────────────▼──────────────────────────────┐        │
│  │          Services (Business Logic)          │        │
│  │  - AuthService                              │        │
│  │  - ImageProcessingService ◄─────────┐       │        │
│  │  - TutorialService                  │       │        │
│  └──────────────┬──────────────────────┼───────┘        │
│                 │                      │                │
│  ┌──────────────▼──────────────────┐   │                │
│  │      Repositories               │   │                │
│  │  - UserRepository               │   │                │
│  │  - TutorialRepository           │   │                │
│  │  - ImageRepository              │   │                │
│  └──────────────┬──────────────────┘   │                │
└─────────────────┼────────────────────────────────────────┘
                  │                      │
                  ▼                      │
┌─────────────────────────────────┐      │
│      Database (MySQL)           │      │
│  - users                        │      │
│  - images                       │      │
│  - tutorials                    │      │
│  - tutorial_steps               │      │
│  - user_progress                │      │
└─────────────────────────────────┘      │
                                         │
                                         ▼
                        ┌────────────────────────────────┐
                        │  Python AI Service (Flask)     │
                        │  ┌──────────────────────────┐  │
                        │  │  Processing Pipeline     │  │
                        │  │  1. EdgeDetector         │  │
                        │  │  2. ContourExtractor     │  │
                        │  │  3. ShapeSimplifier      │  │
                        │  │  4. StepGenerator        │  │
                        │  │  5. TutorialBuilder      │  │
                        │  └──────────────────────────┘  │
                        └────────────────────────────────┘
```

## Design Patterns

### 1. MVC (Model-View-Controller)

**Purpose**: Separate concerns between data, presentation, and control logic.

- **Models**: Represent domain entities (User, Image, Tutorial, Step)
- **Views**: HTML templates for rendering
- **Controllers**: Handle HTTP requests and coordinate between models and views

### 2. Repository Pattern

**Purpose**: Abstract data access logic from business logic.

```php
UserRepository
  ├── find($id)
  ├── findAll()
  ├── create($data)
  └── update($id, $data)
```

### 3. Service Layer

**Purpose**: Encapsulate business logic separate from controllers.

```php
TutorialService
  ├── generateTutorial()
  ├── getTutorial()
  └── shareTutorial()
```

### 4. Dependency Injection

**Purpose**: Achieve loose coupling and testability.

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

## SOLID Principles Application

### Single Responsibility Principle (SRP)

Each class has one reason to change:
- `EdgeDetector` - Only edge detection
- `AuthService` - Only authentication
- `TutorialController` - Only tutorial HTTP handling

### Open/Closed Principle (OCP)

System is open for extension, closed for modification:
- Middleware can be added to Router without modifying Router class
- New services can be added without changing existing code

### Liskov Substitution Principle (LSP)

All models extend base `Model` class and can be used interchangeably where base model is expected.

### Interface Segregation Principle (ISP)

Classes don't depend on methods they don't use. Each service has focused interface.

### Dependency Inversion Principle (DIP)

High-level modules don't depend on low-level modules:
- Controllers depend on Services (abstraction)
- Services depend on Repositories (abstraction)

## Data Flow

### Tutorial Generation Flow

```
1. User uploads image via frontend
   ↓
2. ImageUploader sends to PHP backend
   ↓
3. ImageProcessingService validates and stores
   ↓
4. ImageProcessingService calls Python AI API
   ↓
5. Python processes image through pipeline:
   - Edge detection
   - Contour extraction
   - Shape simplification
   - Step generation
   ↓
6. Python returns step data to PHP
   ↓
7. TutorialService saves tutorial and steps to database
   ↓
8. User redirected to tutorial viewer
   ↓
9. TutorialViewer loads and displays steps
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. AuthController validates input
   ↓
3. AuthService verifies credentials
   ↓
4. Password verified with bcrypt
   ↓
5. Session created with user ID
   ↓
6. User redirected to dashboard
```

### Authorization

- Session-based authentication
- User ownership checks in services
- Public/private tutorial access control

### Input Validation

- Client-side validation (JavaScript)
- Server-side validation (PHP)
- File type and size validation
- SQL injection prevention (prepared statements)

## Scalability Considerations

### Horizontal Scaling

- **PHP Backend**: Stateless design allows multiple instances behind load balancer
- **Python AI Service**: Can run multiple instances for parallel processing
- **Database**: Can implement read replicas for query scaling

### Caching Strategy

- Session data in Redis (future enhancement)
- Tutorial metadata caching
- Static asset CDN

### Asynchronous Processing

- Image processing can be moved to queue (RabbitMQ/Redis)
- Background job processing for long-running tasks

## Technology Decisions

### Why Custom PHP MVC?

✅ **Pros**:
- Full control over architecture
- No framework overhead
- Educational value
- Easy to understand and modify

❌ **Cons**:
- Missing some framework features
- More manual work

### Why Separate Python Service?

✅ **Pros**:
- Python excels at AI/ML
- Independent scaling
- Technology specialization
- Microservice architecture

### Why Vanilla JavaScript?

✅ **Pros**:
- No build step required
- Smaller bundle size
- Better performance
- Easier to understand

## Future Enhancements

1. **API Authentication**: JWT tokens for API access
2. **Real-time Processing**: WebSocket for progress updates
3. **Advanced AI**: Deep learning models for better step generation
4. **Caching Layer**: Redis for performance
5. **Queue System**: Async job processing
6. **Testing**: Unit and integration tests
7. **CI/CD**: Automated deployment pipeline

## Maintenance

### Code Organization

- Follow PSR-12 coding standards for PHP
- PEP 8 for Python
- ESLint for JavaScript

### Version Control

- Feature branch workflow
- Pull request reviews
- Semantic versioning

### Monitoring

- Error logging
- Performance metrics
- User analytics
