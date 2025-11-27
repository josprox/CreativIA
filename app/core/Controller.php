<?php

/**
 * Base Controller Class
 * 
 * Provides common functionality for all controllers.
 * Handles view rendering, JSON responses, and request validation.
 * Follows Single Responsibility - only handles HTTP request/response.
 */

abstract class Controller
{
    /**
     * Render a view
     * 
     * @param string $view View name (e.g., 'home/index')
     * @param array $data Data to pass to view
     * @param string $layout Layout file (default: 'main')
     */
    protected function view($view, $data = [], $layout = 'main')
    {
        // Extract data to variables
        extract($data);

        // Start output buffering
        ob_start();

        // Include the view file
        $viewFile = __DIR__ . "/../views/{$view}.php";

        if (file_exists($viewFile)) {
            require $viewFile;
        } else {
            throw new Exception("View not found: {$view}");
        }

        // Get view content
        $content = ob_get_clean();

        // Include layout if specified
        if ($layout) {
            $layoutFile = __DIR__ . "/../views/layouts/{$layout}.php";

            if (file_exists($layoutFile)) {
                require $layoutFile;
            } else {
                echo $content;
            }
        } else {
            echo $content;
        }
    }

    /**
     * Return JSON response
     * 
     * @param mixed $data Data to encode
     * @param int $statusCode HTTP status code
     */
    protected function json($data, $statusCode = 200)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * Return success JSON response
     * 
     * @param mixed $data Response data
     * @param string $message Success message
     */
    protected function jsonSuccess($data = null, $message = 'Success')
    {
        $this->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
    }

    /**
     * Return error JSON response
     * 
     * @param string $message Error message
     * @param int $statusCode HTTP status code
     * @param array $errors Validation errors
     */
    protected function jsonError($message, $statusCode = 400, $errors = [])
    {
        $this->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $statusCode);
    }

    /**
     * Redirect to URL
     * 
     * @param string $url URL to redirect to
     */
    protected function redirect($url)
    {
        header("Location: $url");
        exit;
    }

    /**
     * Get request input
     * 
     * @param string $key Input key
     * @param mixed $default Default value
     * @return mixed Input value
     */
    protected function input($key, $default = null)
    {
        return $_POST[$key] ?? $_GET[$key] ?? $default;
    }

    /**
     * Get all request inputs
     * 
     * @return array All inputs
     */
    protected function inputs()
    {
        return array_merge($_GET, $_POST);
    }

    /**
     * Validate request inputs
     * 
     * @param array $rules Validation rules
     * @return array Validation errors (empty if valid)
     */
    protected function validate($rules)
    {
        $errors = [];

        foreach ($rules as $field => $ruleSet) {
            $value = $this->input($field);
            $ruleArray = explode('|', $ruleSet);

            foreach ($ruleArray as $rule) {
                // Required validation
                if ($rule === 'required' && empty($value)) {
                    $errors[$field][] = ucfirst($field) . ' is required';
                }

                // Email validation
                if ($rule === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field][] = ucfirst($field) . ' must be a valid email';
                }

                // Min length validation
                if (strpos($rule, 'min:') === 0) {
                    $min = (int) substr($rule, 4);
                    if (strlen($value) < $min) {
                        $errors[$field][] = ucfirst($field) . " must be at least {$min} characters";
                    }
                }

                // Max length validation
                if (strpos($rule, 'max:') === 0) {
                    $max = (int) substr($rule, 4);
                    if (strlen($value) > $max) {
                        $errors[$field][] = ucfirst($field) . " must not exceed {$max} characters";
                    }
                }

                // Numeric validation
                if ($rule === 'numeric' && !is_numeric($value)) {
                    $errors[$field][] = ucfirst($field) . ' must be numeric';
                }
            }
        }

        return $errors;
    }

    /**
     * Check if user is authenticated
     * 
     * @return bool Authentication status
     */
    protected function isAuthenticated()
    {
        return isset($_SESSION['user_id']);
    }

    /**
     * Get authenticated user ID
     * 
     * @return int|null User ID or null
     */
    protected function getUserId()
    {
        return $_SESSION['user_id'] ?? null;
    }

    /**
     * Require authentication (redirect if not authenticated)
     */
    protected function requireAuth()
    {
        if (!$this->isAuthenticated()) {
            $this->redirect('/login');
        }
    }
}
