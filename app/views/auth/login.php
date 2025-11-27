<div class="auth-container">
    <div class="auth-card">
        <div class="auth-header">
            <h1>Bienvenido de Nuevo</h1>
            <p>Inicia sesión para continuar creando tutoriales increíbles</p>
        </div>

        <?php if (isset($error)): ?>
            <div class="alert alert-error">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="/login" class="auth-form">
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" class="form-control"
                    value="<?= htmlspecialchars($old['email'] ?? '') ?>" required>
                <?php if (isset($errors['email'])): ?>
                    <span class="form-error"><?= $errors['email'][0] ?></span>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" class="form-control" required>
                <?php if (isset($errors['password'])): ?>
                    <span class="form-error"><?= $errors['password'][0] ?></span>
                <?php endif; ?>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Iniciar Sesión</button>
        </form>

        <div class="auth-footer">
            <p>¿No tienes una cuenta? <a href="/register">Regístrate aquí</a></p>
        </div>
    </div>
</div>