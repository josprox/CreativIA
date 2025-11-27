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
            'title': 'Paso 1: Contorno Básico',
            'description': 'Comienza con las formas principales y la composición general',
            'instructions': 'Dibuja primero las formas más grandes para establecer las proporciones',
            'image_base64': image_base64
        }
    
    def _create_detail_steps(self, shapes, width, height):
        """Create intermediate steps with progressive detail"""
        steps = []
        
        # Group shapes by size
        total_shapes = len(shapes)
        
        # More granular steps: aim for ~8-12 steps depending on complexity
        # Ensure at least 3 shapes are added per step
        shapes_per_step = max(3, int(total_shapes * 0.12))
        
        # Start after the first 3 shapes (used in step 1)
        current_idx = 3
        step_number = 2
        
        while current_idx < total_shapes:
            canvas = np.ones((height, width, 3), dtype=np.uint8) * 255
            
            # Calculate end index for this step
            end_idx = min(current_idx + shapes_per_step, total_shapes)
            
            # If remaining shapes are few, just include them all
            if total_shapes - end_idx < 3:
                end_idx = total_shapes
            
            # Draw shapes up to this point
            for shape in shapes[:end_idx]:
                contour = shape['contour']
                cv2.drawContours(canvas, [contour], -1, (0, 0, 0), 2)
            
            _, buffer = cv2.imencode('.png', canvas)
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            steps.append({
                'title': f'Paso {step_number}: Agregar Detalles',
                'description': f'Añade más formas y refina el dibujo',
                'instructions': 'Concéntrate en las proporciones y las relaciones entre las formas',
                'image_base64': image_base64
            })
            
            current_idx = end_idx
            step_number += 1
            
            # Safety break to prevent infinite loops if logic fails
            if step_number > 20:
                break
        
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
            'title': 'Paso Final: Sombreado y Detalles',
            'description': 'Añade sombreado, textura y detalles finales',
            'instructions': 'Observa la luz y la sombra para dar profundidad a tu dibujo',
            'image_base64': image_base64
        }
