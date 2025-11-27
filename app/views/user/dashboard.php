<?php
// --- HELPER: Función para limpiar rutas de imagen ---
function cleanDashboardPath($path)
{
    if (empty($path))
        return '';

    // 1. Busca si es un paso generado (storage)
    $pos = strpos($path, 'storage');
    if ($pos !== false)
        return '/' . str_replace('\\', '/', substr($path, $pos));

    // 2. Busca si es la imagen original (uploads) <-- ESTO FALTABA
    $pos = strpos($path, 'uploads');
    if ($pos !== false)
        return '/' . str_replace('\\', '/', substr($path, $pos));

    return $path;
}
?>

<div class="dashboard-container">
    <div class="dashboard-header">
        <h1>Welcome back, <?= htmlspecialchars($user['username']) ?>!</h1>
        <p>Continue your drawing journey</p>
    </div>

    <div class="dashboard-actions">
        <a href="/upload" class="btn btn-primary">
            <span>📤</span> Upload New Image
        </a>
        <a href="/tutorials" class="btn btn-secondary">
            <span>📚</span> View All Tutorials
        </a>
    </div>

    <div class="dashboard-section">
        <h2>Recent Tutorials</h2>

        <?php if (empty($tutorials)): ?>
            <div class="empty-state">
                <span class="empty-icon">🎨</span>
                <p>You haven't created any tutorials yet</p>
                <a href="/upload" class="btn btn-primary">Create Your First Tutorial</a>
            </div>
        <?php else: ?>
            <div class="tutorials-grid">
                <?php foreach ($tutorials as $tutorial): ?>
                    <?php
                    // Preparamos la imagen
                    $imgSrc = cleanDashboardPath($tutorial['image_path'] ?? '');
                    ?>

                    <div class="tutorial-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border);">

                        <div
                            style="height: 160px; overflow: hidden; background: var(--bg-tertiary); position: relative; border-bottom: 1px solid var(--border);">
                            <?php if ($imgSrc): ?>
                                <img src="<?= htmlspecialchars($imgSrc) ?>" alt="<?= htmlspecialchars($tutorial['title']) ?>"
                                    style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;">
                            <?php else: ?>
                                <div
                                    style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-secondary);">
                                    <span>No Image</span>
                                </div>
                            <?php endif; ?>

                            <span class="badge badge-<?= $tutorial['difficulty_level'] ?>"
                                style="position: absolute; top: 10px; right: 10px; backdrop-filter: blur(5px); background: rgba(0,0,0,0.6);">
                                <?= ucfirst($tutorial['difficulty_level']) ?>
                            </span>
                        </div>

                        <div style="padding: var(--spacing-md); display: flex; flex-direction: column; flex-grow: 1;">

                            <div class="tutorial-card-header" style="margin-bottom: 0.5rem;">
                                <h3 style="margin: 0; font-size: 1.1rem;">
                                    <?= htmlspecialchars($tutorial['title']) ?>
                                </h3>
                            </div>

                            <p class="tutorial-card-description"
                                style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                                <?= htmlspecialchars(substr($tutorial['description'], 0, 80)) ?>
                                <?= strlen($tutorial['description']) > 80 ? '...' : '' ?>
                            </p>

                            <div class="tutorial-card-meta"
                                style="margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 0.8rem;">
                                <span>📊 <?= $tutorial['total_steps'] ?> steps</span>
                                <span><?= $tutorial['is_public'] ? '🌐 Public' : '🔒 Private' ?></span>
                            </div>

                            <div style="margin-top: 1rem;">
                                <a href="/tutorial/<?= $tutorial['id'] ?>" class="btn btn-secondary"
                                    style="width: 100%; text-align: center; display: block;">
                                    View Tutorial
                                </a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>