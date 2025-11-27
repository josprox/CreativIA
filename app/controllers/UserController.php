<?php

/**
 * User Controller
 * 
 * Handles user dashboard and profile management.
 */

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../services/TutorialService.php';
require_once __DIR__ . '/../services/AuthService.php';

class UserController extends Controller
{
    private $tutorialService;
    private $authService;

    public function __construct()
    {
        $this->tutorialService = new TutorialService();
        $this->authService = new AuthService();
    }

    /**
     * Show user dashboard
     */
    public function dashboard()
    {
        $this->requireAuth();
        $userId = $this->getUserId();

        // Get user tutorials
        $tutorials = $this->tutorialService->getUserTutorials($userId, 10);

        // Get user data
        $user = $this->authService->getCurrentUser();

        $this->view('user/dashboard', [
            'title' => 'Dashboard - CreativIA',
            'user' => $user,
            'tutorials' => $tutorials
        ]);
    }

    /**
     * Show user profile
     */
    public function profile()
    {
        $this->requireAuth();

        $user = $this->authService->getCurrentUser();

        $this->view('user/profile', [
            'title' => 'Profile - CreativIA',
            'user' => $user
        ]);
    }
}
