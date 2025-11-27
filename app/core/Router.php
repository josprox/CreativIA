<?php

/**
 * Router Class
 * 
 * Handles URL routing and request dispatching.
 * Supports RESTful routes and middleware.
 * Follows Open/Closed Principle - extensible via middleware.
 */

class Router
{
    private $routes = [];
    private $middleware = [];

    /**
     * Add GET route
     * 
     * @param string $path URL path
     * @param string $handler Controller@method
     */
    public function get($path, $handler)
    {
        $this->addRoute('GET', $path, $handler);
    }

    /**
     * Add POST route
     * 
     * @param string $path URL path
     * @param string $handler Controller@method
     */
    public function post($path, $handler)
    {
        $this->addRoute('POST', $path, $handler);
    }

    /**
     * Add PUT route
     * 
     * @param string $path URL path
     * @param string $handler Controller@method
     */
    public function put($path, $handler)
    {
        $this->addRoute('PUT', $path, $handler);
    }

    /**
     * Add DELETE route
     * 
     * @param string $path URL path
     * @param string $handler Controller@method
     */
    public function delete($path, $handler)
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    /**
     * Add route to routes array
     * 
     * @param string $method HTTP method
     * @param string $path URL path
     * @param string $handler Controller@method
     */
    private function addRoute($method, $path, $handler)
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    /**
     * Add middleware
     * 
     * @param callable $middleware Middleware function
     */
    public function addMiddleware($middleware)
    {
        $this->middleware[] = $middleware;
    }

    /**
     * Dispatch request to appropriate controller
     */
    public function dispatch()
    {
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Remove trailing slash
        $requestUri = rtrim($requestUri, '/');
        if (empty($requestUri)) {
            $requestUri = '/';
        }

        // Find matching route
        foreach ($this->routes as $route) {
            $pattern = $this->convertToRegex($route['path']);

            if ($route['method'] === $requestMethod && preg_match($pattern, $requestUri, $matches)) {

                // --- INICIO DE LA CORRECCIÓN ---
                // Creamos un array limpio SOLO con los argumentos nombrados.
                // Ignoramos cualquier índice numérico para evitar conflictos en PHP 8.
                $params = [];
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = $value;
                    }
                }
                // --- FIN DE LA CORRECCIÓN ---

                // Execute middleware
                foreach ($this->middleware as $middleware) {
                    $result = call_user_func($middleware);
                    if ($result === false) {
                        return; // Middleware blocked request
                    }
                }

                // Call controller method
                $this->callHandler($route['handler'], $params);
                return;
            }
        }

        // No route found - 404
        $this->notFound();
    }

    /**
     * Convert route path to regex pattern
     * 
     * @param string $path Route path
     * @return string Regex pattern
     */
    private function convertToRegex($path)
    {
        // Convert {param} to named capture groups
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    /**
     * Call controller handler
     * 
     * @param string $handler Controller@method
     * @param array $params Route parameters
     */
    private function callHandler($handler, $params = [])
    {
        list($controllerName, $method) = explode('@', $handler);

        $controllerFile = __DIR__ . "/../controllers/{$controllerName}.php";

        if (!file_exists($controllerFile)) {
            throw new Exception("Controller not found: {$controllerName}");
        }

        require_once $controllerFile;

        if (!class_exists($controllerName)) {
            throw new Exception("Controller class not found: {$controllerName}");
        }

        $controller = new $controllerName();

        if (!method_exists($controller, $method)) {
            throw new Exception("Method not found: {$controllerName}@{$method}");
        }

        // Call controller method with parameters
        call_user_func_array([$controller, $method], $params);
    }

    /**
     * Handle 404 Not Found
     */
    private function notFound()
    {
        http_response_code(404);
        echo '<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <a href="/">Go to Home</a>
</body>
</html>';
    }
}
