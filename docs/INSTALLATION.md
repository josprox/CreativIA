# Guía de Instalación - CreativIA

## Requisitos del Sistema

- **PHP**: 8.0 o superior
- **Python**: 3.9 o superior
- **MySQL**: 8.0 o superior
- **Servidor Web**: Apache 2.4+ o Nginx 1.18+
- **RAM**: Mínimo 2GB
- **Espacio en Disco**: 500MB

## Instalación Paso a Paso

### 1. Configuración del Entorno

#### Windows
```bash
# Instalar XAMPP o WAMP para PHP y MySQL
# Descargar desde: https://www.apachefriends.org/

# Instalar Python
# Descargar desde: https://www.python.org/downloads/
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install php8.0 php8.0-mysql php8.0-curl php8.0-gd
sudo apt install mysql-server
sudo apt install python3.9 python3-pip
```

### 2. Configuración de Base de Datos

```bash
# Iniciar MySQL
mysql -u root -p

# Crear base de datos (o usar schema.sql)
CREATE DATABASE creativia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Importar esquema
mysql -u root -p creativia < database/schema.sql
```

### 3. Configuración de la Aplicación

```bash
# Copiar archivo de entorno
cp .env.example .env

# Editar archivo .env
nano .env
```

Actualiza los siguientes valores:
```
DB_HOST=localhost
DB_NAME=creativia
DB_USER=root
DB_PASSWORD=tu_contraseña

PYTHON_API_URL=http://localhost:5000
```

### 4. Configuración del Servicio de IA en Python

```bash
# Navegar al módulo de Python
cd python_modules

# Crear entorno virtual (recomendado)
python3 -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip3 install -r requirements.txt
```

### 5. Permisos de Archivos

```bash
# Establecer permisos adecuados para directorios de carga
chmod 755 public/uploads
chmod 755 storage/tutorials
chmod 755 storage/temp
```

### 6. Iniciar Servicios

#### Terminal 1: Servicio de IA en Python
```bash
cd python_modules/api
python3 app.py
```

#### Terminal 2: Servidor de Desarrollo PHP
```bash
cd public
php -S localhost:8000
```

Para producción, configura un host virtual de Apache o Nginx.

### 7. Verificar Instalación

Abre el navegador y navega a:
```
http://localhost:8000
```

Deberías ver la página de inicio de CreativIA.

## Despliegue en Producción

### Configuración de Apache

Crear archivo de host virtual:
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

### Servicio Python como Servicio Systemd

Crear `/etc/systemd/system/creativia-ai.service`:
```ini
[Unit]
Description=CreativIA AI Processing Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/creativia/python_modules/api
ExecStart=/path/to/venv/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Habilitar e iniciar:
```bash
sudo systemctl enable creativia-ai
sudo systemctl start creativia-ai
```

## Solución de Problemas

### Error de Conexión a Base de Datos
- Verifica que MySQL esté corriendo
- Revisa las credenciales en `.env`
- Asegúrate de que la base de datos exista

### Error de Importación de Módulo Python
- Activa el entorno virtual
- Reinstala dependencias: `pip3 install -r requirements.txt`

### Error de Subida de Archivos
- Revisa permisos de directorios
- Verifica `MAX_UPLOAD_SIZE` en `.env`
- Revisa `upload_max_filesize` y `post_max_size` en PHP

### API de Python No Responde
- Verifica si el servicio está corriendo en el puerto 5000
- Revisa configuraciones de firewall
- Revisa `PYTHON_API_URL` en `.env`

## Siguientes Pasos

- Leer [Documentación de Arquitectura](ARCHITECTURE.md)
- Revisar [Documentación de API](API.md)
- Revisar [Guía de Usuario](USER_GUIDE.md)
