<?php

/**
 * Image Processing Service
 * 
 * Handles image upload, validation, and communication with Python AI service.
 * Follows Single Responsibility - only image processing concerns.
 */

require_once __DIR__ . '/../models/Image.php';
require_once __DIR__ . '/../config/config.php';

class ImageProcessingService
{
    private $imageModel;
    private $allowedExtensions;
    private $maxFileSize;
    private $uploadPath;

    public function __construct()
    {
        $this->imageModel = new Image();
        $this->allowedExtensions = explode(',', Config::get('ALLOWED_EXTENSIONS', 'jpg,jpeg,png,gif'));
        $this->maxFileSize = (int) Config::get('MAX_UPLOAD_SIZE', 5242880); // 5MB default
        $this->uploadPath = Config::get('UPLOAD_PATH', 'public/uploads');
    }

    /**
     * Validate uploaded image
     * 
     * @param array $file $_FILES array element
     * @return array Validation result
     */
    public function validateImage($file)
    {
        $errors = [];

        // Check if file was uploaded
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            $errors[] = 'No file uploaded';
            return ['valid' => false, 'errors' => $errors];
        }

        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            $maxMB = $this->maxFileSize / 1048576;
            $errors[] = "File size exceeds maximum of {$maxMB}MB";
        }

        // Check file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowedExtensions)) {
            $errors[] = 'Invalid file type. Allowed: ' . implode(', ', $this->allowedExtensions);
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($mimeType, $allowedMimes)) {
            $errors[] = 'Invalid file format';
        }

        // Verify it's actually an image
        if (!getimagesize($file['tmp_name'])) {
            $errors[] = 'File is not a valid image';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Upload and save image
     * 
     * @param array $file $_FILES array element
     * @param int $userId User ID
     * @return array Result with image ID and path
     */
    public function uploadImage($file, $userId)
    {
        // Validate image
        $validation = $this->validateImage($file);

        if (!$validation['valid']) {
            return [
                'success' => false,
                'errors' => $validation['errors']
            ];
        }

        // Generate unique filename
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = uniqid('img_') . '_' . time() . '.' . $extension;
        $uploadDir = BASE_PATH . '/' . $this->uploadPath;

        // Create upload directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filePath = $uploadDir . '/' . $filename;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $filePath)) {
            // Save to database
            $imageId = $this->imageModel->createFromUpload($userId, $filePath);

            if ($imageId) {
                return [
                    'success' => true,
                    'image_id' => $imageId,
                    'path' => $filePath,
                    'filename' => $filename
                ];
            }
        }

        return [
            'success' => false,
            'errors' => ['Failed to upload image']
        ];
    }

    /**
     * Send image to Python AI service for processing
     * 
     * @param string $imagePath Path to image file
     * @return array Processing result
     */
    public function processWithAI($imagePath)
    {
        $pythonApiUrl = Config::get('PYTHON_API_URL', 'http://localhost:5000');
        $timeout = (int) Config::get('PYTHON_API_TIMEOUT', 60);

        // Prepare file for upload
        $cfile = new CURLFile($imagePath);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $pythonApiUrl . '/process');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, ['image' => $cfile]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $result = json_decode($response, true);
            return [
                'success' => true,
                'data' => $result
            ];
        }

        return [
            'success' => false,
            'error' => 'AI processing failed',
            'http_code' => $httpCode
        ];
    }

    /**
     * Get image by ID
     * 
     * @param int $imageId Image ID
     * @return array|null Image data
     */
    public function getImage($imageId)
    {
        return $this->imageModel->find($imageId);
    }

    /**
     * Delete image
     * 
     * @param int $imageId Image ID
     * @param int $userId User ID (for authorization)
     * @return bool Success status
     */
    public function deleteImage($imageId, $userId)
    {
        $image = $this->imageModel->find($imageId);

        // Check ownership
        if ($image && $image['user_id'] == $userId) {
            return $this->imageModel->deleteImage($imageId);
        }

        return false;
    }
}
