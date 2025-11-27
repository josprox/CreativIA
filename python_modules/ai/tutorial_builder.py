"""
Tutorial Builder Module

Assembles final tutorial from generated steps.
"""

class TutorialBuilder:
    """
    Builds complete tutorial structure from steps.
    Adds metadata and organizes content.
    """
    
    def build(self, steps_data):
        """
        Build tutorial from steps
        
        Args:
            steps_data: List of step data
            
        Returns:
            dict: Complete tutorial structure
        """
        tutorial = {
            'steps': steps_data,
            'metadata': {
                'total_steps': len(steps_data),
                'difficulty': self._calculate_difficulty(len(steps_data)),
                'estimated_time': self._estimate_time(len(steps_data))
            }
        }
        
        return tutorial
    
    def _calculate_difficulty(self, step_count):
        """
        Calculate difficulty based on step count
        
        Args:
            step_count: Number of steps
            
        Returns:
            str: Difficulty level
        """
        if step_count <= 3:
            return 'beginner'
        elif step_count <= 6:
            return 'intermediate'
        else:
            return 'advanced'
    
    def _estimate_time(self, step_count):
        """
        Estimate completion time
        
        Args:
            step_count: Number of steps
            
        Returns:
            str: Estimated time
        """
        minutes = step_count * 5  # 5 minutes per step
        
        if minutes < 60:
            return f"{minutes} minutes"
        else:
            hours = minutes // 60
            remaining_minutes = minutes % 60
            if remaining_minutes > 0:
                return f"{hours}h {remaining_minutes}m"
            else:
                return f"{hours} hour{'s' if hours > 1 else ''}"
