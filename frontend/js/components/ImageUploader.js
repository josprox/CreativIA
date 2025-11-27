/**
 * Image Uploader Component
 * 
 * Handles drag-and-drop file upload with preview.
 */

(function() {
    'use strict';

    const uploadZone = document.getElementById('uploadZone');
    const imageInput = document.getElementById('imageInput');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const removeImage = document.getElementById('removeImage');
    const uploadForm = document.getElementById('uploadForm');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (!uploadZone) return;

    // Click to upload
    uploadZone.addEventListener('click', () => {
        imageInput.click();
    });

    // File input change
    imageInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            imageInput.files = e.dataTransfer.files;
            handleFile(file);
        }
    });

    // Remove image
    if (removeImage) {
        removeImage.addEventListener('click', (e) => {
            e.stopPropagation();
            imageInput.value = '';
            uploadPreview.style.display = 'none';
            uploadZone.querySelector('.upload-placeholder').style.display = 'block';
        });
    }

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            if (!imageInput.files.length) {
                e.preventDefault();
                alert('Please select an image');
                return;
            }

            // Show progress
            uploadProgress.style.display = 'block';
            document.getElementById('submitBtn').disabled = true;
        });
    }

    function handleFile(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadPreview.style.display = 'block';
            uploadZone.querySelector('.upload-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
})();
