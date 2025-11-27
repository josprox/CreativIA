<?php

/**
 * Step Model
 * 
 * Represents an individual step in a drawing tutorial.
 * Stores step instructions and images.
 */

require_once __DIR__ . '/../core/Model.php';

class Step extends Model
{
    protected $table = 'tutorial_steps';
    protected $fillable = [
        'tutorial_id',
        'step_number',
        'title',
        'description',
        'image_path',
        'instructions'
    ];

    /**
     * Get steps for a tutorial
     * 
     * @param int $tutorialId Tutorial ID
     * @return array Array of steps
     */
    public function getByTutorial($tutorialId)
    {
        return $this->findAll(['tutorial_id' => $tutorialId], 'step_number ASC');
    }

    /**
     * Get specific step
     * 
     * @param int $tutorialId Tutorial ID
     * @param int $stepNumber Step number
     * @return array|null Step data
     */
    public function getStep($tutorialId, $stepNumber)
    {
        return $this->findOne([
            'tutorial_id' => $tutorialId,
            'step_number' => $stepNumber
        ]);
    }

    /**
     * Get next step
     * 
     * @param int $tutorialId Tutorial ID
     * @param int $currentStep Current step number
     * @return array|null Next step data
     */
    public function getNextStep($tutorialId, $currentStep)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE tutorial_id = ? AND step_number > ? 
                ORDER BY step_number ASC 
                LIMIT 1";

        $stmt = $this->query($sql, [$tutorialId, $currentStep]);
        return $stmt->fetch();
    }

    /**
     * Get previous step
     * 
     * @param int $tutorialId Tutorial ID
     * @param int $currentStep Current step number
     * @return array|null Previous step data
     */
    public function getPreviousStep($tutorialId, $currentStep)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE tutorial_id = ? AND step_number < ? 
                ORDER BY step_number DESC 
                LIMIT 1";

        $stmt = $this->query($sql, [$tutorialId, $currentStep]);
        return $stmt->fetch();
    }

    /**
     * Update step content
     * 
     * @param int $stepId Step ID
     * @param array $data Updated data
     * @return bool Success status
     */
    public function updateStep($stepId, $data)
    {
        return $this->update($stepId, $data);
    }

    /**
     * Delete step and associated files
     * * @param int $stepId Step ID
     * @return bool Success status
     */
    public function deleteStep($stepId)
    {
        $step = $this->find($stepId);

        if ($step) {
            // 1. Definimos la ruta base física de tu servidor donde está la carpeta 'public'
            // Dinámica (Si mueves el proyecto, esto se adapta solo)
            $basePath = dirname(__DIR__, 2) . '/public';

            // 2. Construimos la ruta completa
            $fullPath = $basePath . $step['image_path'];

            // 3. Verificamos y borramos usando la ruta completa
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return $this->delete($stepId);
        }

        return false;
    }
}
