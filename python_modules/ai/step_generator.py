"""
Step Generator Module

Generates progressive drawing steps from analyzed shapes.
Core AI logic for tutorial creation.
"""

import cv2
import numpy as np
import base64

class StepGenerator:
    """
    Generates step-by-step drawing instructions.
    Creates progressive layers from basic to detailed.
    """
    
    def __init__(self):
        self.steps = []
    
    def generate(self, original_image_path, simplified_shapes):
        """
        Generate tutorial steps from simplified shapes
        
        Args:
            original_image_path: Path to original image
            simplified_shapes: List of simplified shape data
            
        Returns:
            list: List of step data
        """
        # Read original image
        original = cv2.imread(original_image_path)
        height, width = original.shape[:2]
        
        steps = []
        
        # Step 1: Basic outline (largest shapes)
        step1 = self._create_basic_outline_step(simplified_shapes, width, height)
        steps.append(step1)
        
        # Step 2-N: Progressive detail addition
        detail_steps = self._create_detail_steps(simplified_shapes, width, height)
        steps.extend(detail_steps)
        
        # Final step: Add shading/details guidance
        final_step = self._create_final_step(original, simplified_shapes)
        steps.append(final_step)
        
        return steps
    
    def _create_basic_outline_step(self, shapes, width, height):
        """Create first step with basic outline"""
        # Create blank canvas
        canvas = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Draw only the largest shapes (top 3)
        for shape in shapes[:3]:
            contour = shape['contour']
            cv2.drawContours(canvas, [contour], -1, (0, 0, 0), 2)
        
        # Convert to base64
        _, buffer = cv2.imencode('.png', canvas)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            'title': 'Step 1: Basic Outline',
            'description': 'Start with the main shapes and overall composition',
            'instructions': 'Draw the largest shapes first to establish proportions',
            'image_base64': image_base64
        }
    
    def _create_detail_steps(self, shapes, width, height):
        """Create intermediate steps with progressive detail"""
        steps = []
        
        # Group shapes by size
        total_shapes = len(shapes)
        shapes_per_step = max(3, total_shapes // 4)
        
        for i in range(1, min(5, total_shapes // shapes_per_step)):
            canvas = np.ones((height, width, 3), dtype=np.uint8) * 255
            
            # Draw shapes up to this step
            end_idx = min((i + 1) * shapes_per_step, total_shapes)
            for shape in shapes[:end_idx]:
                contour = shape['contour']
                cv2.drawContours(canvas, [contour], -1, (0, 0, 0), 2)
            
            _, buffer = cv2.imencode('.png', canvas)
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            steps.append({
                'title': f'Step {i + 1}: Add Details',
                'description': f'Add more shapes and refine the drawing',
                'instructions': 'Focus on proportions and relationships between shapes',
                'image_base64': image_base64
            })
        
        return steps
    
    def _create_final_step(self, original, shapes):
        """Create final step with shading guidance"""
        # Convert to grayscale for shading reference
        gray = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
        
        # Apply edge-preserving filter
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Convert back to BGR for consistency
        final = cv2.cvtColor(filtered, cv2.COLOR_GRAY2BGR)
        
        _, buffer = cv2.imencode('.png', final)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            'title': 'Final Step: Shading and Details',
            'description': 'Add shading, texture, and final details',
            'instructions': 'Observe light and shadow to add depth to your drawing',
            'image_base64': image_base64
        }
