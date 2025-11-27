"""
Edge Detector Module

Detects edges in images using Canny algorithm with adaptive thresholding.
"""

import cv2
import numpy as np

class EdgeDetector:
    """
    Detects edges in images using computer vision techniques.
    Follows Single Responsibility Principle.
    """
    
    def __init__(self, low_threshold=50, high_threshold=150):
        """
        Initialize edge detector
        
        Args:
            low_threshold: Lower threshold for Canny
            high_threshold: Upper threshold for Canny
        """
        self.low_threshold = low_threshold
        self.high_threshold = high_threshold
    
    def detect(self, image_path):
        """
        Detect edges in image
        
        Args:
            image_path: Path to image file
            
        Returns:
            numpy.ndarray: Edge-detected image
        """
        # Read image
        image = cv2.imread(image_path)
        
        if image is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply Canny edge detection
        edges = cv2.Canny(blurred, self.low_threshold, self.high_threshold)
        
        return edges
    
    def detect_adaptive(self, image_path):
        """
        Detect edges with adaptive thresholding
        
        Args:
            image_path: Path to image file
            
        Returns:
            numpy.ndarray: Edge-detected image
        """
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate adaptive thresholds based on image statistics
        median = np.median(gray)
        low = int(max(0, 0.7 * median))
        high = int(min(255, 1.3 * median))
        
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, low, high)
        
        return edges
