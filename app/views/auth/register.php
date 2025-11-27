<div class="auth-container">
    <div class="auth-card">
        <div class="auth-header">
            <h1>Crear Cuenta</h1>
            <p>Únete a CreativIA y comienza a aprender a dibujar</p>
        </div>

        <?php if (isset($error)): ?>
            <div class="alert alert-error">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="/register" class="auth-form">
            <div class="form-group">
                <label for="username">Nombre de Usuario</label>
                <input type="text" id="username" name="username" class="form-control"
                    value="<?= htmlspecialchars($old['username'] ?? '') ?>" required>
                <?php if (isset($errors['username'])): ?>
                    <span class="form-error"><?= $errors['username'][0] ?></span>
                <?php endif; ?>
            </div>

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

            <button type="submit" class="btn btn-primary btn-block">Crear Cuenta</button>
        </form>

        <div class="auth-footer">
            <p>¿Ya tienes una cuenta? <a href="/login">Inicia sesión aquí</a></p>
        </div>
    </div>
</div>