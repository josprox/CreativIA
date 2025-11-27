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
                    <div class="tutorial-card">
                        <div class="tutorial-card-header">
                            <h3><?= htmlspecialchars($tutorial['title']) ?></h3>
                            <span class="badge badge-<?= $tutorial['difficulty_level'] ?>">
                                <?= ucfirst($tutorial['difficulty_level']) ?>
                            </span>
                        </div>
                        <p class="tutorial-card-description">
                            <?= htmlspecialchars(substr($tutorial['description'], 0, 100)) ?>
                            <?= strlen($tutorial['description']) > 100 ? '...' : '' ?>
                        </p>
                        <div class="tutorial-card-meta">
                            <span>📊 <?= $tutorial['total_steps'] ?> steps</span>
                            <span><?= $tutorial['is_public'] ? '🌐 Public' : '🔒 Private' ?></span>
                        </div>
                        <div class="tutorial-card-actions">
                            <a href="/tutorial/<?= $tutorial['id'] ?>" class="btn btn-sm btn-primary">
                                View Tutorial
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>