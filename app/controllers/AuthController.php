<?php

/**
 * Auth Controller
 * 
 * Handles user authentication: login, register, logout.
 */

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../services/AuthService.php';

class AuthController extends Controller
{
    private $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    /**
     * Show login form
     */
    public function showLogin()
    {
        // Redirect if already authenticated
        if ($this->authService->isAuthenticated()) {
            $this->redirect('/dashboard');
        }

        $this->view('auth/login', [
            'title' => 'Login - CreativIA'
        ]);
    }

    /**
     * Handle login request
     */
    public function login()
    {
        // Validate input
        $errors = $this->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!empty($errors)) {
            $this->view('auth/login', [
                'title' => 'Login - CreativIA',
                'errors' => $errors,
                'old' => $this->inputs()
            ]);
            return;
        }

        // Attempt login
        $result = $this->authService->login(
            $this->input('email'),
            $this->input('password')
        );

        if ($result['success']) {
            $this->redirect('/dashboard');
        } else {
            $this->view('auth/login', [
                'title' => 'Login - CreativIA',
                'error' => $result['message'],
                'old' => $this->inputs()
            ]);
        }
    }

    /**
     * Show registration form
     */
    public function showRegister()
    {
        // Redirect if already authenticated
        if ($this->authService->isAuthenticated()) {
            $this->redirect('/dashboard');
        }

        $this->view('auth/register', [
            'title' => 'Register - CreativIA'
        ]);
    }

    /**
     * Handle registration request
     */
    public function register()
    {
        // Validate input
        $errors = $this->validate([
            'username' => 'required|min:3|max:50',
            'email' => 'required|email',
            'password' => 'required|min:6'
        ]);

        if (!empty($errors)) {
            $this->view('auth/register', [
                'title' => 'Register - CreativIA',
                'errors' => $errors,
                'old' => $this->inputs()
            ]);
            return;
        }

        // Attempt registration
        $result = $this->authService->register([
            'username' => $this->input('username'),
            'email' => $this->input('email'),
            'password' => $this->input('password')
        ]);

        if ($result['success']) {
            // Auto-login after registration
            $this->authService->login(
                $this->input('email'),
                $this->input('password')
            );
            $this->redirect('/dashboard');
        } else {
            $this->view('auth/register', [
                'title' => 'Register - CreativIA',
                'error' => $result['message'],
                'old' => $this->inputs()
            ]);
        }
    }

    /**
     * Handle logout request
     */
    public function logout()
    {
        $this->authService->logout();
        $this->redirect('/');
    }
}
