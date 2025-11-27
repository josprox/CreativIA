# CreativIA - AI Drawing Tutorial Generator

![CreativIA](https://img.shields.io/badge/AI-Powered-blueviolet) ![PHP](https://img.shields.io/badge/PHP-8.0+-blue) ![Python](https://img.shields.io/badge/Python-3.9+-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎨 Overview

CreativIA is a professional web application that transforms any image into a step-by-step drawing tutorial using AI and computer vision. Built with clean architecture, SOLID principles, and modern web technologies.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Advanced computer vision breaks down images into drawable components
- 📊 **Progressive Learning** - Step-by-step tutorials from basic shapes to final details
- 🎯 **Personalized Tutorials** - Generate custom tutorials from any image
- 💾 **Progress Tracking** - Save and resume your learning journey
- 🌐 **Share Tutorials** - Make your tutorials public to help others learn
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode

## 🏗️ Architecture

CreativIA follows a **3-tier architecture** with strict separation of concerns:

```
┌─────────────────────────────────────┐
│   Frontend (JavaScript/HTML/CSS)   │
├─────────────────────────────────────┤
│   Backend (PHP MVC + REST API)     │
├─────────────────────────────────────┤
│   AI Processing (Python Service)   │
└─────────────────────────────────────┘
```

### Technology Stack

- **Backend**: PHP 8.0+ (Custom MVC Framework)
- **Frontend**: Vanilla JavaScript (ES6+), Modern CSS
- **AI Module**: Python 3.9+ (Flask, OpenCV, NumPy)
- **Database**: MySQL 8.0+

## 📁 Project Structure

```
creativia/
├── app/                    # PHP Application
│   ├── controllers/        # Request handlers
│   ├── models/            # Domain models
│   ├── views/             # HTML templates
│   ├── services/          # Business logic
│   ├── repositories/      # Data access
│   └── core/              # MVC framework
├── frontend/              # Frontend assets
│   ├── js/                # JavaScript modules
│   └── css/               # Stylesheets
├── python_modules/        # Python AI service
│   ├── api/               # Flask API
│   ├── processing/        # Image processing
│   └── ai/                # AI logic
├── public/                # Web root
├── database/              # Database schema
└── docs/                  # Documentation
```

## 🚀 Quick Start

### Prerequisites

- PHP 8.0 or higher
- Python 3.9 or higher
- MySQL 8.0 or higher
- Apache/Nginx web server

### Installation

1. **Clone the repository**
   ```bash
   cd "c:/Users/joss/Desktop/creativia posible entrega"
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Install Python dependencies**
   ```bash
   cd python_modules
   pip install -r requirements.txt
   ```

5. **Start Python AI service**
   ```bash
   cd python_modules/api
   python app.py
   ```

6. **Start PHP development server**
   ```bash
   cd public
   php -S localhost:8000
   ```

7. **Open browser**
   ```
   http://localhost:8000
   ```

## 📖 Usage

1. **Register** - Create a new account
2. **Upload** - Upload an image you want to learn to draw
3. **Generate** - AI processes the image and creates tutorial steps
4. **Learn** - Follow the step-by-step instructions
5. **Share** - Make your tutorial public to help others

## 🏛️ Design Principles

### Clean Code
- Clear, descriptive naming conventions
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Comprehensive error handling

### SOLID Principles
- **S**ingle Responsibility - Each class has one job
- **O**pen/Closed - Extensible via middleware and services
- **L**iskov Substitution - Proper inheritance hierarchies
- **I**nterface Segregation - Focused interfaces
- **D**ependency Inversion - Depend on abstractions

### Architecture Patterns
- **MVC** - Strict separation of concerns
- **Repository Pattern** - Data access abstraction
- **Service Layer** - Business logic encapsulation
- **Dependency Injection** - Loose coupling

## 🔒 Security

- Password hashing with bcrypt
- Prepared statements (SQL injection prevention)
- File upload validation
- MIME type verification
- Session management
- CSRF protection ready

## 📚 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and architecture patterns.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- OpenCV for computer vision capabilities
- Flask for the Python API framework
- The open-source community

---

**Built with ❤️ and AI**
