<div class="viewer-container">
    <div class="tutorial-header">
        <h1><?= htmlspecialchars($tutorial['title']) ?></h1>
        <p><?= htmlspecialchars($tutorial['description']) ?></p>
        <div class="tutorial-meta">
            <span class="meta-item">👤 <?= htmlspecialchars($tutorial['username']) ?></span>
            <span class="meta-item">📊 <?= $tutorial['total_steps'] ?> pasos</span>
            <span class="meta-item difficulty-<?= $tutorial['difficulty_level'] ?>">
                <?= ucfirst($tutorial['difficulty_level']) ?>
            </span>
        </div>
    </div>

    <?php
    // --- BLOQUE DE CORRECCIÓN DE RUTAS ---
// Función auxiliar para limpiar la ruta
    function cleanPath($path)
    {
        // Buscamos donde empieza la palabra "storage"
        $pos = strpos($path, 'storage');
        if ($pos !== false) {
            // Cortamos todo lo que haya antes (el C:\Users...)
            $clean = substr($path, $pos);
            // Aseguramos que use barras normales (/) y agregamos la barra inicial
            return '/' . str_replace('\\', '/', $clean);
        }
        return $path;
    }

    // 1. Limpiamos los pasos para el PHP (miniaturas)
    foreach ($tutorial['steps'] as $key => $step) {
        $tutorial['steps'][$key]['image_path'] = cleanPath($step['image_path']);
    }
    // -------------------------------------
    ?>

    <div class="viewer-content">
        <div class="step-viewer" id="stepViewer">
            <div class="step-image-container">
                <img id="stepImage" src="" alt="Imagen del paso" class="step-image">
            </div>

            <div class="step-info">
                <h2 id="stepTitle">Paso 1</h2>
                <p id="stepDescription"></p>
                <div id="stepInstructions" class="step-instructions"></div>
            </div>
        </div>

        <div class="step-controls">
            <button class="btn btn-secondary" id="prevBtn" disabled>
                ← Anterior
            </button>
            <div class="step-indicator">
                <span id="currentStep">1</span> / <span id="totalSteps"><?= $tutorial['total_steps'] ?></span>
            </div>
            <button class="btn btn-primary" id="nextBtn">
                Siguiente →
            </button>
        </div>

        <div class="step-thumbnails" id="stepThumbnails">
            <?php foreach ($tutorial['steps'] as $index => $step): ?>
                <div class="thumbnail <?= $index === 0 ? 'active' : '' ?>" data-step="<?= $index + 1 ?>">
                    <img src="<?= htmlspecialchars($step['image_path']) ?>" alt="Paso <?= $index + 1 ?>">
                    <span class="thumbnail-number"><?= $index + 1 ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<script>
    // Pass tutorial data to JavaScript
    const tutorialData = <?= json_encode($tutorial) ?>;
</script>
<script src="/frontend/js/components/TutorialViewer.js"></script>
<script src="/frontend/js/components/StepNavigator.js"></script>