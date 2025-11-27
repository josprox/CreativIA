"""
Shape Simplifier Module

Simplifies complex contours into basic geometric shapes.
"""

import cv2
import numpy as np

class ShapeSimplifier:
    """
    Simplifies contours into basic geometric shapes.
    Detects circles, rectangles, triangles, etc.
    """
    
    def __init__(self, epsilon_factor=0.02):
        """
        Initialize shape simplifier
        
        Args:
            epsilon_factor: Approximation accuracy factor
        """
        self.epsilon_factor = epsilon_factor
    
    def simplify(self, contours):
        """
        Simplify contours into basic shapes
        
        Args:
            contours: List of contours
            
        Returns:
            list: List of simplified shape data
        """
        simplified_shapes = []
        
        for contour in contours:
            # Approximate contour
            epsilon = self.epsilon_factor * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # Detect shape type
            shape_type = self._detect_shape_type(approx, contour)
            
            # Get shape properties
            properties = self._get_shape_properties(contour, approx, shape_type)
            
            simplified_shapes.append({
                'type': shape_type,
                'contour': contour,
                'approximation': approx,
                'properties': properties
            })
        
        return simplified_shapes
    
    def _detect_shape_type(self, approx, contour):
        """
        Detect geometric shape type
        
        Args:
            approx: Approximated contour
            contour: Original contour
            
        Returns:
            str: Shape type
        """
        vertices = len(approx)
        
        if vertices == 3:
            return 'triangle'
        elif vertices == 4:
            # Check if rectangle or square
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / h
            if 0.95 <= aspect_ratio <= 1.05:
                return 'square'
            else:
                return 'rectangle'
        elif vertices > 4:
            # Check if circle
            area = cv2.contourArea(contour)
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter ** 2)
                if circularity > 0.8:
                    return 'circle'
            return 'polygon'
        else:
            return 'line'
    
    def _get_shape_properties(self, contour, approx, shape_type):
        """
        Get shape properties
        
        Args:
            contour: Original contour
            approx: Approximated contour
            shape_type: Detected shape type
            
        Returns:
            dict: Shape properties
        """
        properties = {}
        
        # Common properties
        properties['area'] = cv2.contourArea(contour)
        properties['perimeter'] = cv2.arcLength(contour, True)
        
        # Bounding box
        x, y, w, h = cv2.boundingRect(contour)
        properties['bounding_box'] = {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}
        
        # Center
        M = cv2.moments(contour)
        if M['m00'] != 0:
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])
            properties['center'] = {'x': cx, 'y': cy}
        
        # Shape-specific properties
        if shape_type == 'circle':
            (x, y), radius = cv2.minEnclosingCircle(contour)
            properties['radius'] = float(radius)
            properties['circle_center'] = {'x': float(x), 'y': float(y)}
        
        return properties
