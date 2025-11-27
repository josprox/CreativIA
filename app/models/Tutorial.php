<?php

/**
 * Tutorial Model
 * 
 * Represents a drawing tutorial generated from an image.
 * Manages tutorial metadata and relationships with steps.
 */

require_once __DIR__ . '/../core/Model.php';

class Tutorial extends Model
{
    protected $table = 'tutorials';
    protected $fillable = [
        'user_id',
        'image_id',
        'title',
        'description',
        'total_steps',
        'difficulty_level',
        'is_public'
    ];

    /**
     * Create tutorial with steps
     * 
     * @param array $tutorialData Tutorial data
     * @param array $steps Array of step data
     * @return int|bool Tutorial ID or false
     */
    public function createWithSteps($tutorialData, $steps)
    {
        $tutorialData['total_steps'] = count($steps);
        $tutorialId = $this->create($tutorialData);

        if ($tutorialId) {
            require_once __DIR__ . '/Step.php';
            $stepModel = new Step();

            foreach ($steps as $index => $stepData) {
                $stepData['tutorial_id'] = $tutorialId;
                $stepData['step_number'] = $index + 1;
                $stepModel->create($stepData);
            }
        }

        return $tutorialId;
    }

    /**
     * Get tutorial with all steps
     * 
     * @param int $tutorialId Tutorial ID
     * @return array|null Tutorial with steps
     */
    public function getWithSteps($tutorialId)
    {
        $tutorial = $this->find($tutorialId);

        if ($tutorial) {
            require_once __DIR__ . '/Step.php';
            $stepModel = new Step();
            $tutorial['steps'] = $stepModel->getByTutorial($tutorialId);
        }

        return $tutorial;
    }

    /**
     * Get tutorials by user
     * 
     * @param int $userId User ID
     * @param int $limit Limit results
     * @return array Array of tutorials
     */
    public function getByUser($userId, $limit = null)
    {
        $sql = "SELECT t.*, i.original_path as image_path 
                FROM {$this->table} t 
                LEFT JOIN images i ON t.image_id = i.id 
                WHERE t.user_id = ? 
                ORDER BY t.created_at DESC";

        if ($limit) {
            $sql .= " LIMIT " . (int) $limit;
        }

        $stmt = $this->query($sql, [$userId]);
        return $stmt->fetchAll();
    }

    /**
     * Get public tutorials
     * 
     * @param int $limit Limit results
     * @return array Array of public tutorials
     */
    public function getPublic($limit = null)
    {
        $sql = "SELECT t.*, i.original_path as image_path 
                FROM {$this->table} t 
                LEFT JOIN images i ON t.image_id = i.id 
                WHERE t.is_public = 1 
                ORDER BY t.created_at DESC";

        if ($limit) {
            $sql .= " LIMIT " . (int) $limit;
        }

        $stmt = $this->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * Get tutorial with image and user info
     * 
     * @param int $tutorialId Tutorial ID
     * @return array|null Tutorial with related data
     */
    public function getWithDetails($tutorialId)
    {
        $sql = "SELECT t.*, i.filename, i.original_path, u.username 
                FROM {$this->table} t 
                JOIN images i ON t.image_id = i.id 
                JOIN users u ON t.user_id = u.id 
                WHERE t.id = ?";

        $stmt = $this->query($sql, [$tutorialId]);
        $tutorial = $stmt->fetch();

        if ($tutorial) {
            require_once __DIR__ . '/Step.php';
            $stepModel = new Step();
            $tutorial['steps'] = $stepModel->getByTutorial($tutorialId);
        }

        return $tutorial;
    }

    /**
     * Update tutorial visibility
     * 
     * @param int $tutorialId Tutorial ID
     * @param bool $isPublic Public status
     * @return bool Success status
     */
    public function setPublic($tutorialId, $isPublic)
    {
        return $this->update($tutorialId, ['is_public' => $isPublic ? 1 : 0]);
    }

    /**
     * Search tutorials by title
     * 
     * @param string $query Search query
     * @param int $limit Limit results
     * @return array Array of tutorials
     */
    public function search($query, $limit = 20)
    {
        $sql = "SELECT t.*, i.original_path as image_path 
                FROM {$this->table} t 
                LEFT JOIN images i ON t.image_id = i.id 
                WHERE (t.title LIKE ? OR t.description LIKE ?) 
                AND t.is_public = 1 
                ORDER BY t.created_at DESC 
                LIMIT ?";

        $searchTerm = "%{$query}%";
        $stmt = $this->query($sql, [$searchTerm, $searchTerm, $limit]);
        return $stmt->fetchAll();
    }
}
