<?php

/**
 * Application Entry Point
 * 
 * Initializes the application, loads configuration,
 * sets up error handling, and dispatches requests.
 */

// Start session
session_start();

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define base path
define('BASE_PATH', dirname(__DIR__));

// Load configuration
require_once BASE_PATH . '/app/config/config.php';
Config::load();

// Load core classes
require_once BASE_PATH . '/app/core/Database.php';
require_once BASE_PATH . '/app/core/Model.php';
require_once BASE_PATH . '/app/core/Controller.php';
require_once BASE_PATH . '/app/core/Router.php';

// Initialize router
$router = new Router();

// Define routes
// Home routes
$router->get('/', 'HomeController@index');

// Auth routes
$router->get('/login', 'AuthController@showLogin');
$router->post('/login', 'AuthController@login');
$router->get('/register', 'AuthController@showRegister');
$router->post('/register', 'AuthController@register');
$router->get('/logout', 'AuthController@logout');

// Tutorial routes
$router->get('/upload', 'TutorialController@showUpload');
$router->post('/upload', 'TutorialController@upload');
$router->get('/tutorial/{id}', 'TutorialController@show');
$router->get('/tutorials', 'TutorialController@list');

// User routes
$router->get('/dashboard', 'UserController@dashboard');
$router->get('/profile', 'UserController@profile');

// API routes (loaded separately)
if (strpos($_SERVER['REQUEST_URI'], '/api/') === 0) {
    require_once BASE_PATH . '/backend/api/routes.php';
    exit;
}

// Dispatch request
try {
    $router->dispatch();
} catch (Exception $e) {
    // Error handling
    if (Config::get('APP_DEBUG') === 'true') {
        echo '<h1>Error</h1>';
        echo '<p>' . $e->getMessage() . '</p>';
        echo '<pre>' . $e->getTraceAsString() . '</pre>';
    } else {
        http_response_code(500);
        echo '<h1>500 - Internal Server Error</h1>';
        echo '<p>Something went wrong. Please try again later.</p>';
    }
}
