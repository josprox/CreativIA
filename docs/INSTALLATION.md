# Installation Guide - CreativIA

## System Requirements

- **PHP**: 8.0 or higher
- **Python**: 3.9 or higher
- **MySQL**: 8.0 or higher
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **RAM**: Minimum 2GB
- **Disk Space**: 500MB

## Step-by-Step Installation

### 1. Environment Setup

#### Windows
```bash
# Install XAMPP or WAMP for PHP and MySQL
# Download from: https://www.apachefriends.org/

# Install Python
# Download from: https://www.python.org/downloads/
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install php8.0 php8.0-mysql php8.0-curl php8.0-gd
sudo apt install mysql-server
sudo apt install python3.9 python3-pip
```

### 2. Database Configuration

```bash
# Start MySQL
mysql -u root -p

# Create database (or use schema.sql)
CREATE DATABASE creativia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema
mysql -u root -p creativia < database/schema.sql
```

### 3. Application Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

Update the following values:
```
DB_HOST=localhost
DB_NAME=creativia
DB_USER=root
DB_PASSWORD=your_password

PYTHON_API_URL=http://localhost:5000
```

### 4. Python AI Service Setup

```bash
# Navigate to Python module
cd python_modules

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. File Permissions

```bash
# Set proper permissions for upload directories
chmod 755 public/uploads
chmod 755 storage/tutorials
chmod 755 storage/temp
```

### 6. Start Services

#### Terminal 1: Python AI Service
```bash
cd python_modules/api
python app.py
```

#### Terminal 2: PHP Development Server
```bash
cd public
php -S localhost:8000
```

For production, configure Apache or Nginx virtual host.

### 7. Verify Installation

Open browser and navigate to:
```
http://localhost:8000
```

You should see the CreativIA landing page.

## Production Deployment

### Apache Configuration

Create virtual host file:
```apache
<VirtualHost *:80>
    ServerName creativia.local
    DocumentRoot "/path/to/creativia/public"
    
    <Directory "/path/to/creativia/public">
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/creativia_error.log
    CustomLog ${APACHE_LOG_DIR}/creativia_access.log combined
</VirtualHost>
```

### Python Service as Systemd Service

Create `/etc/systemd/system/creativia-ai.service`:
```ini
[Unit]
Description=CreativIA AI Processing Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/creativia/python_modules/api
ExecStart=/path/to/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable creativia-ai
sudo systemctl start creativia-ai
```

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### Python Module Import Error
- Activate virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`

### File Upload Error
- Check directory permissions
- Verify `MAX_UPLOAD_SIZE` in `.env`
- Check PHP `upload_max_filesize` and `post_max_size`

### Python API Not Responding
- Check if service is running on port 5000
- Verify firewall settings
- Check `PYTHON_API_URL` in `.env`

## Next Steps

- Read [Architecture Documentation](ARCHITECTURE.md)
- Review [API Documentation](API.md)
- Check [User Guide](USER_GUIDE.md)
