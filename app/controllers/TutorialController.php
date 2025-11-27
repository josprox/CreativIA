<?php

/**
 * Tutorial Controller
 * 
 * Handles tutorial generation, viewing, and management.
 */

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../services/TutorialService.php';
require_once __DIR__ . '/../services/ImageProcessingService.php';
require_once __DIR__ . '/../services/AuthService.php';

class TutorialController extends Controller
{
    private $tutorialService;
    private $imageService;
    private $authService;

    public function __construct()
    {
        $this->tutorialService = new TutorialService();
        $this->imageService = new ImageProcessingService();
        $this->authService = new AuthService();
    }

    /**
     * Show upload form
     */
    public function showUpload()
    {
        $this->requireAuth();

        $this->view('tutorial/upload', [
            'title' => 'Upload Image - CreativIA'
        ]);
    }

    /**
     * Handle image upload and tutorial generation
     */
    public function upload()
    {
        $this->requireAuth();
        $userId = $this->getUserId();

        // Check if file was uploaded
        if (!isset($_FILES['image'])) {
            $this->view('tutorial/upload', [
                'title' => 'Upload Image - CreativIA',
                'error' => 'No file uploaded'
            ]);
            return;
        }

        // Upload image
        $uploadResult = $this->imageService->uploadImage($_FILES['image'], $userId);

        if (!$uploadResult['success']) {
            $this->view('tutorial/upload', [
                'title' => 'Upload Image - CreativIA',
                'errors' => $uploadResult['errors']
            ]);
            return;
        }

        // Generate tutorial
        $tutorialResult = $this->tutorialService->generateTutorial(
            $uploadResult['image_id'],
            $userId,
            [
                'title' => $this->input('title', 'My Drawing Tutorial'),
                'description' => $this->input('description', ''),
                'is_public' => $this->input('is_public', 0)
            ]
        );

        if ($tutorialResult['success']) {
            $this->redirect('/tutorial/' . $tutorialResult['tutorial_id']);
        } else {
            $this->view('tutorial/upload', [
                'title' => 'Upload Image - CreativIA',
                'error' => $tutorialResult['error']
            ]);
        }
    }

    /**
     * View tutorial
     */
    public function view($id)
    {
        $tutorial = $this->tutorialService->getTutorial($id);

        if (!$tutorial) {
            http_response_code(404);
            echo '<h1>Tutorial not found</h1>';
            return;
        }

        // Check if user has access
        $userId = $this->getUserId();
        if (!$tutorial['is_public'] && $tutorial['user_id'] != $userId) {
            http_response_code(403);
            echo '<h1>Access denied</h1>';
            return;
        }

        $this->view('tutorial/viewer', [
            'title' => $tutorial['title'] . ' - CreativIA',
            'tutorial' => $tutorial
        ]);
    }

    /**
     * List user tutorials
     */
    public function list()
    {
        $this->requireAuth();
        $userId = $this->getUserId();

        $tutorials = $this->tutorialService->getUserTutorials($userId);

        $this->view('tutorial/list', [
            'title' => 'My Tutorials - CreativIA',
            'tutorials' => $tutorials
        ]);
    }
}
