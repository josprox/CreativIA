"""
Flask API for AI Image Processing

Exposes endpoints for image processing and tutorial generation.
"""

from flask import Flask, request, jsonify
import os
import sys
import base64
from werkzeug.utils import secure_filename

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from processing.edge_detector import EdgeDetector
from processing.contour_extractor import ContourExtractor
from processing.shape_simplifier import ShapeSimplifier
from ai.step_generator import StepGenerator
from ai.tutorial_builder import TutorialBuilder

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize processors
edge_detector = EdgeDetector()
contour_extractor = ContourExtractor()
shape_simplifier = ShapeSimplifier()
step_generator = StepGenerator()
tutorial_builder = TutorialBuilder()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'CreativIA AI Processing'})

@app.route('/process', methods=['POST'])
def process_image():
    """
    Process uploaded image and generate tutorial steps
    
    Expected: multipart/form-data with 'image' file
    Returns: JSON with tutorial steps
    """
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join('/tmp', filename)
        file.save(temp_path)
        
        # Process image through pipeline
        # 1. Edge detection
        edges = edge_detector.detect(temp_path)
        
        # 2. Extract contours
        contours = contour_extractor.extract(edges)
        
        # 3. Simplify shapes
        simplified_shapes = shape_simplifier.simplify(contours)
        
        # 4. Generate steps
        steps_data = step_generator.generate(temp_path, simplified_shapes)
        
        # 5. Build tutorial
        tutorial = tutorial_builder.build(steps_data)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'steps': tutorial['steps'],
            'metadata': tutorial['metadata']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/status/<job_id>', methods=['GET'])
def check_status(job_id):
    """Check processing status (for async processing)"""
    # Placeholder for async processing status
    return jsonify({'status': 'completed', 'job_id': job_id})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
