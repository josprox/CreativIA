<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?? 'CreativIA' ?></title>
    <link rel="stylesheet" href="/frontend/css/main.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>

    <nav class="navbar">
        <div class="container">
            <div class="nav-brand">
                <a href="/">
                    <span class="logo-icon">🎨</span>
                    <span class="logo-text">CreativIA</span>
                </a>
            </div>

            <button class="menu-toggle" id="mobile-menu">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </button>

            <div class="nav-menu">
                <?php if (isset($_SESSION['user_id'])): ?>
                    <a href="/dashboard" class="nav-link">Panel</a>
                    <a href="/upload" class="nav-link">Subir</a>
                    <a href="/tutorials" class="nav-link">Mis Tutoriales</a>
                    <a href="/logout" class="nav-link">Cerrar Sesión</a>
                <?php else: ?>
                    <a href="/login" class="nav-link">Iniciar Sesión</a>
                    <a href="/register" class="nav-link btn-primary">Empezar</a>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <main class="main-content">
        <?= $content ?>
    </main>

    <script>
        const menuToggle = document.getElementById('mobile-menu');
        const navMenu = document.querySelector('.nav-menu');

        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active');
            navMenu.classList.toggle('active');
        });
    </script>
</body>
</html>