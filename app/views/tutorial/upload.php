<div class="upload-container">
    <div class="upload-card">
        <div class="upload-header">
            <h1>Upload Your Image</h1>
            <p>Upload an image to generate a step-by-step drawing tutorial</p>
        </div>

        <?php if (isset($error)): ?>
            <div class="alert alert-error">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <?php if (isset($errors)): ?>
            <div class="alert alert-error">
                <ul>
                    <?php foreach ($errors as $error): ?>
                        <li><?= htmlspecialchars($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <form method="POST" action="/upload" enctype="multipart/form-data" class="upload-form" id="uploadForm">
            <div class="form-group">
                <label for="title">Tutorial Title</label>
                <input type="text" id="title" name="title" class="form-control" placeholder="My Drawing Tutorial">
            </div>

            <div class="form-group">
                <label for="description">Description (Optional)</label>
                <textarea id="description" name="description" class="form-control" rows="3"
                    placeholder="Describe what you want to learn..."></textarea>
            </div>

            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="is_public" value="1">
                    <span>Make this tutorial public</span>
                </label>
            </div>

            <div class="upload-zone" id="uploadZone">
                <input type="file" id="imageInput" name="image" accept="image/*" required hidden>
                <div class="upload-placeholder">
                    <span class="upload-icon">📁</span>
                    <p class="upload-text">Drag & drop your image here or click to browse</p>
                    <p class="upload-hint">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
                </div>
                <div class="upload-preview" id="uploadPreview" style="display: none;">
                    <img id="previewImage" src="" alt="Preview">
                    <button type="button" class="btn-remove" id="removeImage">✕</button>
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" id="submitBtn">
                Generate Tutorial
            </button>

            <div class="upload-progress" id="uploadProgress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <p class="progress-text" id="progressText">Processing image...</p>
            </div>
        </form>
    </div>
</div>

<script src="/frontend/js/components/ImageUploader.js"></script>