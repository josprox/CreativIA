<?php
// --- HELPER MEJORADO: Busca en 'storage' Y en 'uploads' ---
function cleanListPath($path)
{
    if (empty($path))
        return '';

    // Intentar limpiar ruta de 'storage' (Pasos generados)
    $pos = strpos($path, 'storage');
    if ($pos !== false) {
        return '/' . str_replace('\\', '/', substr($path, $pos));
    }

    // Intentar limpiar ruta de 'uploads' (Imagen original subida)
    $pos = strpos($path, 'uploads');
    if ($pos !== false) {
        return '/' . str_replace('\\', '/', substr($path, $pos));
    }

    return $path;
}
?>

<div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">

    <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
        <div>
            <h1 class="gradient-text">Mis Tutoriales</h1>
            <p style="color: var(--text-secondary);">Gestiona tus creaciones artísticas</p>
        </div>
        <a href="/upload" class="btn btn-primary">
            + Nuevo Tutorial
        </a>
    </div>

    <?php if (empty($tutorials)): ?>
        <div class="empty-state"
            style="text-align: center; padding: 4rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎨</div>
            <h3>Aún no has creado tutoriales</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Sube tu primera imagen para empezar.</p>
            <a href="/upload" class="btn btn-primary">Comenzar ahora</a>
        </div>
    <?php else: ?>

        <div class="tutorials-grid">
            <?php foreach ($tutorials as $tutorial): ?>
                <?php $imgSrc = cleanListPath($tutorial['image_path'] ?? ''); ?>

                <div class="tutorial-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border);">

                    <div
                        style="height: 180px; overflow: hidden; background: var(--bg-tertiary); position: relative; border-bottom: 1px solid var(--border);">
                        <?php if ($imgSrc): ?>
                            <img src="<?= htmlspecialchars($imgSrc) ?>" alt="<?= htmlspecialchars($tutorial['title']) ?>"
                                style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;">
                        <?php else: ?>
                            <div
                                style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-secondary);">
                                <span>Sin Imagen</span>
                            </div>
                        <?php endif; ?>

                        <span class="badge badge-<?= $tutorial['difficulty_level'] ?>"
                            style="position: absolute; top: 10px; right: 10px; backdrop-filter: blur(5px); background: rgba(0,0,0,0.6);">
                            <?= ucfirst($tutorial['difficulty_level']) ?>
                        </span>
                    </div>

                    <div style="padding: var(--spacing-md); display: flex; flex-direction: column; flex-grow: 1;">
                        <div class="tutorial-card-header">
                            <h3 style="margin: 0; font-size: 1.1rem;"><?= htmlspecialchars($tutorial['title']) ?></h3>
                        </div>

                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
                            <?= htmlspecialchars(substr($tutorial['description'], 0, 100)) ?>...
                        </p>

                        <div class="tutorial-card-meta"
                            style="margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 0.8rem;">
                            <span>📊 <?= $tutorial['steps_count'] ?? $tutorial['total_steps'] ?? '?' ?> pasos</span>
                            <span><?= ($tutorial['is_public'] ?? 0) ? '🌐 Público' : '🔒 Privado' ?></span>
                        </div>

                        <div class="tutorial-card-actions">
                            <a href="/tutorial/<?= $tutorial['id'] ?>" class="btn btn-secondary">
                                Ver
                            </a>
                            <form action="/tutorial/delete/<?= $tutorial['id'] ?>" method="POST"
                                onsubmit="return confirm('¿Estás seguro de que quieres eliminar este tutorial? Esta acción no se puede deshacer.');"
                                style="display: inline;">
                                <button type="submit" class="btn btn-danger">
                                    Eliminar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>