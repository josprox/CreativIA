<?php

/**
 * Tutorial Service
 * 
 * Orchestrates tutorial generation and management.
 * Coordinates between image processing and tutorial creation.
 */

require_once __DIR__ . '/../models/Tutorial.php';
require_once __DIR__ . '/../models/Step.php';
require_once __DIR__ . '/ImageProcessingService.php';

class TutorialService
{
    private $tutorialModel;
    private $stepModel;
    private $imageService;
    private $storagePath;

    public function __construct()
    {
        $this->tutorialModel = new Tutorial();
        $this->stepModel = new Step();
        $this->imageService = new ImageProcessingService();
        $this->storagePath = Config::get('TUTORIALS_PATH', 'storage/tutorials');
    }

    /**
     * Generate tutorial from image
     * 
     * @param int $imageId Image ID
     * @param int $userId User ID
     * @param array $options Tutorial options (title, description, etc.)
     * @return array Result with tutorial ID
     */
    public function generateTutorial($imageId, $userId, $options = [])
    {
        // Get image
        $image = $this->imageService->getImage($imageId);

        if (!$image || $image['user_id'] != $userId) {
            return [
                'success' => false,
                'error' => 'Image not found or unauthorized'
            ];
        }

        // Process image with AI
        $aiResult = $this->imageService->processWithAI($image['original_path']);

        if (!$aiResult['success']) {
            return [
                'success' => false,
                'error' => 'AI processing failed'
            ];
        }

        // Extract steps from AI result
        $stepsData = $aiResult['data']['steps'] ?? [];

        if (empty($stepsData)) {
            return [
                'success' => false,
                'error' => 'No steps generated'
            ];
        }

        // Save step images to storage
        $processedSteps = $this->saveStepImages($stepsData, $userId);

        // Create tutorial
        $tutorialData = [
            'user_id' => $userId,
            'image_id' => $imageId,
            'title' => $options['title'] ?? 'Drawing Tutorial',
            'description' => $options['description'] ?? 'AI-generated drawing tutorial',
            'difficulty_level' => $this->calculateDifficulty(count($stepsData)),
            'is_public' => $options['is_public'] ?? 0
        ];

        $tutorialId = $this->tutorialModel->createWithSteps($tutorialData, $processedSteps);

        if ($tutorialId) {
            return [
                'success' => true,
                'tutorial_id' => $tutorialId,
                'total_steps' => count($processedSteps)
            ];
        }

        return [
            'success' => false,
            'error' => 'Failed to create tutorial'
        ];
    }

    /**
     * Save step images to storage
     * 
     * @param array $stepsData Steps data from AI
     * @param int $userId User ID
     * @return array Processed steps with saved image paths
     */
    private function saveStepImages($stepsData, $userId)
    {
        $processedSteps = [];

        // 1. Definimos la ruta relativa (para la URL pública)
        // Ejemplo: storage/tutorials/1
        $relativeDir = $this->storagePath . '/' . $userId;

        // 2. Definimos la ruta absoluta física (donde PHP guardará el archivo)
        // Agregamos '/public/' para apuntar a la carpeta correcta
        $storageDir = BASE_PATH . '/public/' . $relativeDir;

        // Create user storage directory if not exists
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, true);
        }

        foreach ($stepsData as $index => $step) {
            // Decode base64 image if provided
            if (isset($step['image_base64'])) {
                $imageData = base64_decode($step['image_base64']);
                $filename = 'step_' . ($index + 1) . '_' . time() . '.png';

                // Ruta para GUARDAR el archivo (Disco duro)
                $absoluteFilePath = $storageDir . '/' . $filename;

                // Ruta para la BASE DE DATOS (URL Web)
                // Le agregamos la barra inicial '/' para que sea absoluta desde la web
                $webPath = '/' . $relativeDir . '/' . $filename;

                file_put_contents($absoluteFilePath, $imageData);
            } else {
                // Si ya venía una ruta, intentamos limpiarla o usarla tal cual
                $webPath = $step['image_path'] ?? '';
            }

            $processedSteps[] = [
                'title' => $step['title'] ?? "Step " . ($index + 1),
                'description' => $step['description'] ?? '',
                // IMPORTANTE: Ahora guardamos la ruta web limpia, no la de C:\Users...
                'image_path' => $webPath,
                'instructions' => $step['instructions'] ?? ''
            ];
        }

        return $processedSteps;
    }

    /**
     * Calculate difficulty based on number of steps
     * 
     * @param int $stepCount Number of steps
     * @return string Difficulty level
     */
    private function calculateDifficulty($stepCount)
    {
        if ($stepCount <= 5) {
            return 'beginner';
        } elseif ($stepCount <= 10) {
            return 'intermediate';
        } else {
            return 'advanced';
        }
    }

    /**
     * Get tutorial with all details
     * 
     * @param int $tutorialId Tutorial ID
     * @return array|null Tutorial data
     */
    public function getTutorial($tutorialId)
    {
        return $this->tutorialModel->getWithDetails($tutorialId);
    }

    /**
     * Get user tutorials
     * 
     * @param int $userId User ID
     * @param int $limit Limit results
     * @return array Array of tutorials
     */
    public function getUserTutorials($userId, $limit = null)
    {
        return $this->tutorialModel->getByUser($userId, $limit);
    }

    /**
     * Share tutorial (make public)
     * 
     * @param int $tutorialId Tutorial ID
     * @param int $userId User ID (for authorization)
     * @return bool Success status
     */
    public function shareTutorial($tutorialId, $userId)
    {
        $tutorial = $this->tutorialModel->find($tutorialId);

        if ($tutorial && $tutorial['user_id'] == $userId) {
            return $this->tutorialModel->setPublic($tutorialId, true);
        }

        return false;
    }

    /**
     * Delete tutorial
     * 
     * @param int $tutorialId Tutorial ID
     * @param int $userId User ID (for authorization)
     * @return bool Success status
     */
    public function deleteTutorial($tutorialId, $userId)
    {
        $tutorial = $this->tutorialModel->find($tutorialId);

        if ($tutorial && $tutorial['user_id'] == $userId) {
            // Delete all steps
            $steps = $this->stepModel->getByTutorial($tutorialId);
            foreach ($steps as $step) {
                $this->stepModel->deleteStep($step['id']);
            }

            // Delete tutorial
            return $this->tutorialModel->delete($tutorialId);
        }

        return false;
    }

    /**
     * Search public tutorials
     * 
     * @param string $query Search query
     * @param int $limit Limit results
     * @return array Array of tutorials
     */
    public function searchTutorials($query, $limit = 20)
    {
        return $this->tutorialModel->search($query, $limit);
    }
}
