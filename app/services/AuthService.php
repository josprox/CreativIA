<?php

/**
 * Authentication Service
 * 
 * Handles user authentication and authorization logic.
 * Follows Single Responsibility Principle - only authentication concerns.
 */

require_once __DIR__ . '/../models/User.php';

class AuthService
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Register a new user
     * 
     * @param array $data User registration data
     * @return array Result with success status and message
     */
    public function register($data)
    {
        // Validate unique email
        if ($this->userModel->emailExists($data['email'])) {
            return [
                'success' => false,
                'message' => 'Email already exists'
            ];
        }

        // Validate unique username
        if ($this->userModel->usernameExists($data['username'])) {
            return [
                'success' => false,
                'message' => 'Username already exists'
            ];
        }

        // Create user
        $userId = $this->userModel->createUser($data);

        if ($userId) {
            return [
                'success' => true,
                'message' => 'Registration successful',
                'user_id' => $userId
            ];
        }

        return [
            'success' => false,
            'message' => 'Registration failed'
        ];
    }

    /**
     * Authenticate user
     * 
     * @param string $email User email
     * @param string $password User password
     * @return array Result with success status and user data
     */
    public function login($email, $password)
    {
        $user = $this->userModel->verifyCredentials($email, $password);

        if ($user) {
            // Set session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];

            return [
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email']
                ]
            ];
        }

        return [
            'success' => false,
            'message' => 'Invalid credentials'
        ];
    }

    /**
     * Logout user
     */
    public function logout()
    {
        session_destroy();
        return [
            'success' => true,
            'message' => 'Logout successful'
        ];
    }

    /**
     * Check if user is authenticated
     * 
     * @return bool Authentication status
     */
    public function isAuthenticated()
    {
        return isset($_SESSION['user_id']);
    }

    /**
     * Get current user ID
     * 
     * @return int|null User ID or null
     */
    public function getCurrentUserId()
    {
        return $_SESSION['user_id'] ?? null;
    }

    /**
     * Get current user data
     * 
     * @return array|null User data or null
     */
    public function getCurrentUser()
    {
        $userId = $this->getCurrentUserId();

        if ($userId) {
            return $this->userModel->find($userId);
        }

        return null;
    }
}
