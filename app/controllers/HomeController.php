<?php

/**
 * Home Controller
 * 
 * Handles home page and landing page requests.
 */

require_once __DIR__ . '/../core/Controller.php';

class HomeController extends Controller
{
    /**
     * Display home page
     */
    public function index()
    {
        $this->view('home/index', [
            'title' => 'CreativIA - AI Drawing Tutorial Generator'
        ]);
    }
}
