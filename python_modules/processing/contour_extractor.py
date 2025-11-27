"""
Contour Extractor Module

Extracts and organizes contours from edge-detected images.
"""

import cv2
import numpy as np

class ContourExtractor:
    """
    Extracts contours from edge-detected images.
    Organizes contours hierarchically.
    """
    
    def __init__(self, min_area=100):
        """
        Initialize contour extractor
        
        Args:
            min_area: Minimum contour area to consider
        """
        self.min_area = min_area
    
    def extract(self, edges):
        """
        Extract contours from edge image
        
        Args:
            edges: Edge-detected image (numpy array)
            
        Returns:
            list: List of contours
        """
        # Find contours
        contours, hierarchy = cv2.findContours(
            edges,
            cv2.RETR_TREE,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Filter by area
        filtered_contours = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area >= self.min_area:
                filtered_contours.append(contour)
        
        # Sort by area (largest first)
        filtered_contours.sort(key=cv2.contourArea, reverse=True)
        
        return filtered_contours
    
    def get_hierarchical_contours(self, edges):
        """
        Get contours with hierarchical information
        
        Args:
            edges: Edge-detected image
            
        Returns:
            tuple: (contours, hierarchy)
        """
        contours, hierarchy = cv2.findContours(
            edges,
            cv2.RETR_TREE,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        return contours, hierarchy
    
    def get_bounding_boxes(self, contours):
        """
        Get bounding boxes for contours
        
        Args:
            contours: List of contours
            
        Returns:
            list: List of bounding boxes (x, y, w, h)
        """
        boxes = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            boxes.append((x, y, w, h))
        
        return boxes
