<?php

/**
 * Image Model
 * 
 * Represents an uploaded image.
 * Stores image metadata and file information.
 */

require_once __DIR__ . '/../core/Model.php';

class Image extends Model
{
    protected $table = 'images';
    protected $fillable = [
        'user_id',
        'filename',
        'original_path',
        'file_size',
        'mime_type',
        'width',
        'height'
    ];

    /**
     * Create image record with metadata
     * 
     * @param int $userId User ID
     * @param string $filePath Path to uploaded file
     * @return int|bool Image ID or false
     */
    public function createFromUpload($userId, $filePath)
    {
        // Get image info
        $imageInfo = getimagesize($filePath);
        $fileInfo = pathinfo($filePath);

        $data = [
            'user_id' => $userId,
            'filename' => $fileInfo['basename'],
            'original_path' => $filePath,
            'file_size' => filesize($filePath),
            'mime_type' => $imageInfo['mime'],
            'width' => $imageInfo[0],
            'height' => $imageInfo[1]
        ];

        return $this->create($data);
    }

    /**
     * Get images by user
     * 
     * @param int $userId User ID
     * @param int $limit Limit results
     * @return array Array of images
     */
    public function getByUser($userId, $limit = null)
    {
        return $this->findAll(['user_id' => $userId], 'uploaded_at DESC', $limit);
    }

    /**
     * Get image with user info
     * 
     * @param int $imageId Image ID
     * @return array|null Image data with user info
     */
    public function getWithUser($imageId)
    {
        $sql = "SELECT i.*, u.username, u.email 
                FROM {$this->table} i 
                JOIN users u ON i.user_id = u.id 
                WHERE i.id = ?";

        $stmt = $this->query($sql, [$imageId]);
        return $stmt->fetch();
    }

    /**
     * Delete image and file
     * 
     * @param int $imageId Image ID
     * @return bool Success status
     */
    public function deleteImage($imageId)
    {
        $image = $this->find($imageId);

        if ($image) {
            // Delete file
            if (file_exists($image['original_path'])) {
                unlink($image['original_path']);
            }

            // Delete record
            return $this->delete($imageId);
        }

        return false;
    }
}
