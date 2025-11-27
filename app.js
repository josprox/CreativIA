// Global variables
let originalImage = null;
let imageData = null;
let tutorialSteps = [];
let currentStepIndex = 0;
let originalCanvas, tutorialCanvas, finalCanvas;
let originalCtx, tutorialCtx, finalCtx;
let edgeContours = []; // Store detected and simplified contours
let opencvReady = false; // Track OpenCV.js initialization

// OpenCV.js ready callback
function onOpenCvReady() {
    console.log('OpenCV.js script loaded, waiting for runtime initialization...');
    if (typeof cv !== 'undefined') {
        cv['onRuntimeInitialized'] = () => {
            console.log('OpenCV.js runtime initialized successfully');
            opencvReady = true;
        };
    } else {
        // If cv is not available yet, check periodically
        const checkInterval = setInterval(() => {
            if (typeof cv !== 'undefined') {
                cv['onRuntimeInitialized'] = () => {
                    console.log('OpenCV.js runtime initialized successfully');
                    opencvReady = true;
                };
                clearInterval(checkInterval);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!opencvReady) {
                console.warn('OpenCV.js initialization timeout');
            }
        }, 10000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    originalCanvas = document.getElementById('originalCanvas');
    tutorialCanvas = document.getElementById('tutorialCanvas');
    finalCanvas = document.getElementById('finalCanvas');
    originalCtx = originalCanvas.getContext('2d');
    tutorialCtx = tutorialCanvas.getContext('2d');
    finalCtx = finalCanvas.getContext('2d');

    setupEventListeners();
    await tf.ready();
    initializeTensorFlow();
    
    // Wait for OpenCV.js to be ready (with timeout)
    await waitForOpenCV();
});

// Wait for OpenCV.js to be ready
async function waitForOpenCV(maxWait = 15000) {
    const startTime = Date.now();
    while (!opencvReady && (Date.now() - startTime) < maxWait) {
        if (typeof cv !== 'undefined' && cv.Mat && cv.Mat.prototype) {
            opencvReady = true;
            console.log('OpenCV.js detected and ready');
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!opencvReady) {
        console.warn('OpenCV.js not loaded within timeout, will use TensorFlow.js fallback');
    }
}

// Setup event listeners
function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadSection = document.getElementById('uploadSection');

    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });

    uploadSection.addEventListener('dragleave', () => {
        uploadSection.classList.remove('dragover');
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    });
}

// No model loading needed - we'll use TensorFlow.js operations directly
function initializeTensorFlow() {
    console.log('TensorFlow.js ready for edge detection');
    return true;
}

// Handle file selection
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
    }

    hideError();
    showLoading();

    try {
        const imageUrl = URL.createObjectURL(file);
        originalImage = new Image();
        
        originalImage.onload = async () => {
            await processImage();
            URL.revokeObjectURL(imageUrl);
        };

        originalImage.onerror = () => {
            showError('Failed to load image. Please try another file.');
            hideLoading();
        };

        originalImage.src = imageUrl;
    } catch (error) {
        console.error('Error loading image:', error);
        showError('Error processing image: ' + error.message);
        hideLoading();
    }
}

// Process the uploaded image
async function processImage() {
    try {
        console.log('=== Starting image processing ===');
        
        // Validate original image
        if (!originalImage) {
            throw new Error('Original image is not loaded');
        }
        
        // Set canvas dimensions
        const maxWidth = 800;
        const maxHeight = 600;
        let width = originalImage.width;
        let height = originalImage.height;
        
        console.log('Original image dimensions:', width, 'x', height);

        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
        }

        // Ensure width and height are integers (TensorFlow.js requires integer dimensions)
        width = Math.round(width);
        height = Math.round(height);
        
        console.log('Canvas dimensions:', width, 'x', height);

        originalCanvas.width = width;
        originalCanvas.height = height;
        tutorialCanvas.width = width;
        tutorialCanvas.height = height;
        finalCanvas.width = width;
        finalCanvas.height = height;

        // Draw original image (Layer 1: RGB)
        try {
            originalCtx.drawImage(originalImage, 0, 0, width, height);
            imageData = originalCtx.getImageData(0, 0, width, height);
            console.log('Layer 1 (RGB): Image drawn to canvas, imageData size:', imageData.data.length);
        } catch (error) {
            console.error('Fatal Error: Failed to draw image to canvas:', error);
            throw new Error('Failed to process image: ' + error.message);
        }

        // Process through layered pipeline
        console.log('=== Starting Layered Image Processing Pipeline ===');
        let binaryImageData = null;
        let contours = null;
        
        try {
            // Use OpenCV.js if available, otherwise fall back to TensorFlow.js
            if (opencvReady && typeof cv !== 'undefined' && cv.Mat && cv.Mat.prototype) {
                console.log('Using OpenCV.js for layered processing...');
                try {
                    const processed = await processLayeredImageOpenCV(imageData, width, height);
                    binaryImageData = processed.binary;
                    contours = processed.contours; // Direct contours from OpenCV
                    console.log('OpenCV.js layered processing complete, found', contours.length, 'contours');
                } catch (opencvError) {
                    console.warn('OpenCV.js processing failed, falling back:', opencvError);
                    // Fallback: extract edges and contours using TensorFlow.js
                    const edges = await detectEdges(imageData, width, height);
                    contours = extractContours(edges, width, height);
                    console.log('TensorFlow.js fallback: found', contours.length, 'contours');
                }
            } else {
                console.log('OpenCV.js not available, using TensorFlow.js fallback...');
                // Fallback to TensorFlow.js edge detection
                const edges = await detectEdges(imageData, width, height);
                contours = extractContours(edges, width, height);
                console.log('TensorFlow.js: found', contours.length, 'contours');
            }
        } catch (error) {
            console.error('Fatal Error: Layered processing failed:', error);
            console.error('Error stack:', error.stack);
            // Fallback to TensorFlow.js
            console.log('Falling back to TensorFlow.js edge detection...');
            try {
                const edges = await detectEdges(imageData, width, height);
                contours = extractContours(edges, width, height);
                console.log('Fallback: found', contours.length, 'contours');
            } catch (fallbackError) {
                throw new Error('Image processing failed: ' + error.message);
            }
        }
        
        // Validate we have contours
        if (!contours || contours.length === 0) {
            throw new Error('No contours extracted from image');
        }
        
        // Fill gaps in contours to complete broken segments
        // Note: Morphological closing in OpenCV already handles most gaps
        // This additional gap filling helps with larger breaks
        console.log('Filling remaining contour gaps...');
        try {
            const beforeGapFilling = contours.length;
            contours = fillContourGaps(contours, width, height, 10); // Increased max gap distance
            console.log('After gap filling:', contours.length, 'contours (was', beforeGapFilling + ')');
        } catch (error) {
            console.error('Fatal Error: Gap filling failed:', error);
            console.error('Error stack:', error.stack);
            // Continue without gap filling if it fails
        }
        
        // Simplify contours
        console.log('Simplifying contours...');
        try {
            edgeContours = simplifyContours(contours);
            console.log('Simplified to', edgeContours.length, 'contours');
        } catch (error) {
            console.error('Fatal Error: Contour simplification failed:', error);
            console.error('Error stack:', error.stack);
            throw new Error('Contour simplification failed: ' + error.message);
        }
        
        // Filter out background and frame contours
        console.log('Filtering background and frame contours...');
        try {
            edgeContours = filterBackgroundAndFrame(edgeContours, width, height);
            console.log('After filtering:', edgeContours.length, 'contours remaining');
        } catch (error) {
            console.error('Fatal Error: Background filtering failed:', error);
            console.error('Error stack:', error.stack);
            throw new Error('Background filtering failed: ' + error.message);
        }
        
        // Sort contours by size (largest first)
        try {
            edgeContours.sort((a, b) => b.length - a.length);
            console.log('Contours sorted by size');
        } catch (error) {
            console.error('Fatal Error: Contour sorting failed:', error);
            console.error('Error stack:', error.stack);
            throw new Error('Contour sorting failed: ' + error.message);
        }
        
        // Generate tutorial steps from contours
        console.log('Generating tutorial steps...');
        try {
            tutorialSteps = generateTutorialStepsFromContours(edgeContours, width, height);
            console.log('Generated', tutorialSteps.length, 'tutorial steps');
            
            if (!tutorialSteps || tutorialSteps.length === 0) {
                throw new Error('No tutorial steps were generated');
            }
        } catch (error) {
            console.error('Fatal Error: Tutorial step generation failed:', error);
            console.error('Error stack:', error.stack);
            throw new Error('Tutorial generation failed: ' + error.message);
        }
        
        // Display first step
        try {
            currentStepIndex = 0;
            displayStep(0);
            console.log('First step displayed');
        } catch (error) {
            console.error('Fatal Error: Failed to display step:', error);
            console.error('Error stack:', error.stack);
            throw new Error('Failed to display tutorial: ' + error.message);
        }
        
        hideLoading();
        document.getElementById('previewSection').style.display = 'block';
        console.log('=== Image processing complete ===');
    } catch (error) {
        console.error('=== FATAL ERROR in processImage ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        
        // Ensure loading is hidden
        try {
            hideLoading();
        } catch (e) {
            console.error('Failed to hide loading indicator:', e);
        }
        
        // Show error to user
        try {
            const errorMessage = error.message || 'An unknown error occurred while processing the image. Please try again.';
            showError('Error analyzing image: ' + errorMessage + ' (Check console for details)');
        } catch (e) {
            console.error('Failed to show error message:', e);
            // Last resort: alert
            alert('Error processing image: ' + (error.message || 'Unknown error'));
        }
    }
}

// Layered Image Processing Pipeline using OpenCV.js
// Layer 1: RGB -> Layer 2: Grayscale -> Layer 3: Binary (Otsu/Adaptive Threshold)
async function processLayeredImageOpenCV(imageData, width, height) {
    return new Promise((resolve, reject) => {
        try {
            console.log('Layer 1 (RGB): Processing original color image...');
            
            // Layer 1: RGB - Create OpenCV Mat from ImageData
            const src = cv.matFromImageData(imageData);
            
            // Layer 2: Grayscale - Convert RGB to Grayscale
            console.log('Layer 2 (Grayscale): Converting to grayscale...');
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            // Layer 3: Use multiple Canny edge detection levels to capture different detail levels
            // This captures both strong outlines and subtle details (shading, inner lines)
            console.log('Layer 3: Applying multi-level Canny edge detection...');
            
            const mean = cv.mean(gray);
            
            // Level 1: Strong edges (main outlines) - higher threshold
            const strongLow = Math.max(50, mean[0] * 0.7);
            const strongHigh = Math.max(150, mean[0] * 2.0);
            const strongEdges = new cv.Mat();
            cv.Canny(gray, strongEdges, strongLow, strongHigh, 3, false);
            console.log('Strong edge thresholds:', strongLow, strongHigh);
            
            // Level 2: Medium edges (important details) - medium threshold
            const mediumLow = Math.max(30, mean[0] * 0.5);
            const mediumHigh = Math.max(100, mean[0] * 1.5);
            const mediumEdges = new cv.Mat();
            cv.Canny(gray, mediumEdges, mediumLow, mediumHigh, 3, false);
            console.log('Medium edge thresholds:', mediumLow, mediumHigh);
            
            // Level 3: Subtle edges (shading, inner details) - lower threshold for more details
            const subtleLow = Math.max(15, mean[0] * 0.25);
            const subtleHigh = Math.max(50, mean[0] * 0.9);
            const subtleEdges = new cv.Mat();
            cv.Canny(gray, subtleEdges, subtleLow, subtleHigh, 3, false);
            console.log('Subtle edge thresholds:', subtleLow, subtleHigh);
            
            // Level 4: Very subtle edges (fine shading, texture) - even lower threshold
            const verySubtleLow = Math.max(10, mean[0] * 0.2);
            const verySubtleHigh = Math.max(40, mean[0] * 0.7);
            const verySubtleEdges = new cv.Mat();
            cv.Canny(gray, verySubtleEdges, verySubtleLow, verySubtleHigh, 3, false);
            console.log('Very subtle edge thresholds:', verySubtleLow, verySubtleHigh);
            
            // Extract contours from all levels
            console.log('Extracting contours from multiple detail levels...');
            const strongContours = extractContoursOpenCV(strongEdges, width, height);
            const mediumContours = extractContoursOpenCV(mediumEdges, width, height);
            const subtleContours = extractContoursOpenCV(subtleEdges, width, height);
            const verySubtleContours = extractContoursOpenCV(verySubtleEdges, width, height);
            
            console.log('Strong contours (outlines):', strongContours.length);
            console.log('Medium contours (details):', mediumContours.length);
            console.log('Subtle contours (shading):', subtleContours.length);
            console.log('Very subtle contours (fine details):', verySubtleContours.length);
            
            // REVISED MERGING: Include ALL contours from all levels, only filter true duplicates
            // This ensures we capture ALL essential elements initially
            const mergedContours = [];
            const contourSignatures = new Set(); // Use more robust signature for duplicate detection
            
            // Helper function to create a robust signature for a contour
            function getContourSignature(contour) {
                if (!contour || contour.length === 0) return null;
                // Use first point, middle point, last point, and length for signature
                const mid = Math.floor(contour.length / 2);
                return `${contour.length}_${contour[0][0]}_${contour[0][1]}_${contour[mid][0]}_${contour[mid][1]}_${contour[contour.length-1][0]}_${contour[contour.length-1][1]}`;
            }
            
            // Helper function to check if two contours are essentially the same
            function areContoursSimilar(c1, c2, threshold = 20) {
                if (!c1 || !c2 || c1.length === 0 || c2.length === 0) return false;
                if (Math.abs(c1.length - c2.length) > Math.max(c1.length, c2.length) * 0.3) return false;
                
                // Check start points
                const startDist = Math.sqrt(
                    Math.pow(c1[0][0] - c2[0][0], 2) + 
                    Math.pow(c1[0][1] - c2[0][1], 2)
                );
                if (startDist > threshold) return false;
                
                // Check if they follow similar paths
                const samplePoints = Math.min(5, Math.min(c1.length, c2.length));
                let totalDist = 0;
                for (let i = 0; i < samplePoints; i++) {
                    const idx1 = Math.floor((c1.length - 1) * i / (samplePoints - 1));
                    const idx2 = Math.floor((c2.length - 1) * i / (samplePoints - 1));
                    const dist = Math.sqrt(
                        Math.pow(c1[idx1][0] - c2[idx2][0], 2) + 
                        Math.pow(c1[idx1][1] - c2[idx2][1], 2)
                    );
                    totalDist += dist;
                }
                const avgDist = totalDist / samplePoints;
                
                return avgDist < threshold;
            }
            
            // Add ALL contours from all levels, filtering only true duplicates
            const allLevelContours = [
                ...strongContours.map(c => ({ contour: c, level: 'strong' })),
                ...mediumContours.map(c => ({ contour: c, level: 'medium' })),
                ...subtleContours.map(c => ({ contour: c, level: 'subtle' })),
                ...verySubtleContours.map(c => ({ contour: c, level: 'verySubtle' }))
            ];
            
            // Sort by level priority (strong first, then medium, then subtle)
            const levelPriority = { strong: 0, medium: 1, subtle: 2, verySubtle: 3 };
            allLevelContours.sort((a, b) => levelPriority[a.level] - levelPriority[b.level]);
            
            // Add contours, avoiding only true duplicates
            for (const { contour, level } of allLevelContours) {
                if (!contour || contour.length < 5) continue;
                
                const signature = getContourSignature(contour);
                if (!signature) continue;
                
                // Check if we already have a very similar contour (more lenient threshold)
                // Only filter true duplicates, not similar but distinct contours
                let isDuplicate = false;
                for (const existing of mergedContours) {
                    if (areContoursSimilar(contour, existing, 10)) { // Lower threshold - only very similar
                        isDuplicate = true;
                        break;
                    }
                }
                
                if (!isDuplicate) {
                    mergedContours.push(contour);
                    contourSignatures.add(signature);
                }
            }
            
            contours = mergedContours;
            console.log('Total merged contours (all detail levels, comprehensive):', contours.length);
            
            // Clean up
            strongEdges.delete();
            mediumEdges.delete();
            subtleEdges.delete();
            verySubtleEdges.delete();
            
            // Create binary image data for display (using strong edges as representative)
            const binaryImageData = new ImageData(
                new Uint8ClampedArray(width * height * 4),
                width,
                height
            );
            // Fill with white background
            for (let i = 0; i < binaryImageData.data.length; i += 4) {
                binaryImageData.data[i] = 255;     // R
                binaryImageData.data[i + 1] = 255; // G
                binaryImageData.data[i + 2] = 255; // B
                binaryImageData.data[i + 3] = 255; // A
            }
            
            // Clean up OpenCV Mats
            src.delete();
            gray.delete();
            
            console.log('Layered processing complete. Contours extracted:', contours.length);
            
            resolve({
                binary: binaryImageData,
                contours: contours,
                edges: null // Not using edge array anymore, using contours directly
            });
        } catch (error) {
            console.error('OpenCV.js processing error:', error);
            reject(error);
        }
    });
}

// Extract contours directly from binary image using OpenCV findContours
// REVISED: Use CHAIN_APPROX_NONE to preserve ALL points for complete detail
// Use both RETR_EXTERNAL and RETR_TREE to capture complete structure
function extractContoursOpenCV(binaryMat, width, height) {
    const allContours = [];
    
    // Method 1: Get external contours (main outlines) - these are essential
    const externalContours = new cv.MatVector();
    const externalHierarchy = new cv.Mat();
    cv.findContours(binaryMat, externalContours, externalHierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);
    
    console.log('External contours found:', externalContours.size());
    
    // Extract all external contours - these are the main structure
    for (let i = 0; i < externalContours.size(); i++) {
        const contour = externalContours.get(i);
        const points = [];
        
        for (let j = 0; j < contour.rows; j++) {
            const point = contour.intPtr(j);
            points.push([point[0], point[1]]);
        }
        
        // Keep ALL external contours - they are essential outlines
        if (points.length >= 5) {
            allContours.push(points);
        }
        
        contour.delete();
    }
    
    externalContours.delete();
    externalHierarchy.delete();
    
    // Method 2: Get all contours with hierarchy (internal details)
    const treeContours = new cv.MatVector();
    const treeHierarchy = new cv.Mat();
    cv.findContours(binaryMat, treeContours, treeHierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_NONE);
    
    console.log('Tree contours found:', treeContours.size());
    
    // Extract internal contours that represent important details
    for (let i = 0; i < treeContours.size(); i++) {
        const contour = treeContours.get(i);
        const points = [];
        
        for (let j = 0; j < contour.rows; j++) {
            const point = contour.intPtr(j);
            points.push([point[0], point[1]]);
        }
        
        if (points.length >= 5) {
            // Get hierarchy information
            const h = treeHierarchy.intPtr(i);
            const parentIdx = h[3];
            const isExternal = parentIdx === -1;
            
            // Calculate properties
            let minX = width, maxX = 0, minY = height, maxY = 0;
            points.forEach(([x, y]) => {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            });
            const bboxArea = (maxX - minX) * (maxY - minY);
            const canvasArea = width * height;
            const areaRatio = bboxArea / canvasArea;
            
            // Keep internal contours that represent meaningful details
            // VERY PERMISSIVE: Keep all internal contours that might be essential details
            if (!isExternal) {
                // Keep internal contours - lower thresholds to capture more details
                // Only filter out very tiny noise (less than 0.2% of canvas AND very short)
                if (areaRatio > 0.002 || points.length > 8) {
                    // Check if this is a true duplicate of an external contour we already have
                    let isDuplicate = false;
                    for (const existing of allContours) {
                        if (existing.length > 0 && points.length > 0) {
                            const dist = Math.sqrt(
                                Math.pow(existing[0][0] - points[0][0], 2) + 
                                Math.pow(existing[0][1] - points[0][1], 2)
                            );
                            // Only consider duplicate if very close AND nearly identical length
                            if (dist < 3 && Math.abs(existing.length - points.length) < 2) {
                                isDuplicate = true;
                                break;
                            }
                        }
                    }
                    
                    if (!isDuplicate) {
                        allContours.push(points);
                    }
                }
            }
        }
        
        contour.delete();
    }
    
    treeContours.delete();
    treeHierarchy.delete();
    
    console.log('Total extracted contours:', allContours.length);
    return allContours;
}

// Edge detection using TensorFlow.js Sobel filter (fallback)
async function detectEdges(imageData, width, height) {
    // Convert image data to grayscale tensor
    const data = imageData.data;
    const grayscale = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        // Convert to grayscale using luminance formula
        grayscale[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
    }
    
    // Create tensor from grayscale data
    // Expand to 4D: [batch, height, width, channels] for conv2d
    const tensor = tf.tensor2d(grayscale, [height, width]);
    const tensor4d = tensor.expandDims(2).expandDims(0); // [1, height, width, 1]
    
    // Apply Gaussian blur to reduce noise (using convolution)
    // Filter shape for conv2d: [filterHeight, filterWidth, inChannels, outChannels]
    const gaussianKernel = tf.tensor4d([
        [[[1]], [[4]], [[6]], [[4]], [[1]]],
        [[[4]], [[16]], [[24]], [[16]], [[4]]],
        [[[6]], [[24]], [[36]], [[24]], [[6]]],
        [[[4]], [[16]], [[24]], [[16]], [[4]]],
        [[[1]], [[4]], [[6]], [[4]], [[1]]]
    ], [5, 5, 1, 1]).div(256); // Normalize: [5, 5, 1, 1]
    
    const blurred = tf.conv2d(tensor4d, gaussianKernel, 1, 'same'); // [1, height, width, 1]
    
    // Sobel operators for edge detection
    // Filter shape: [filterHeight, filterWidth, inChannels, outChannels]
    const sobelX = tf.tensor4d([
        [[[-1]], [[0]], [[1]]],
        [[[-2]], [[0]], [[2]]],
        [[[-1]], [[0]], [[1]]]
    ], [3, 3, 1, 1]);
    
    const sobelY = tf.tensor4d([
        [[[-1]], [[-2]], [[-1]]],
        [[[0]], [[0]], [[0]]],
        [[[1]], [[2]], [[1]]]
    ], [3, 3, 1, 1]);
    
    // Apply Sobel filters
    const gx = tf.conv2d(blurred, sobelX, 1, 'same'); // [1, height, width, 1]
    const gy = tf.conv2d(blurred, sobelY, 1, 'same'); // [1, height, width, 1]
    
    // Calculate gradient magnitude
    // Squeeze to remove batch and channel dimensions for operations
    const gxSqueezed = gx.squeeze([0, 3]); // [height, width]
    const gySqueezed = gy.squeeze([0, 3]); // [height, width]
    const magnitude = tf.sqrt(tf.add(tf.square(gxSqueezed), tf.square(gySqueezed)));
    
    // Normalize and apply Canny-like hysteresis thresholding for better edge quality
    const maxVal = tf.max(magnitude);
    const normalized = tf.div(magnitude, maxVal);
    
    // Canny-like dual threshold: high threshold for strong edges, low for weak edges
    const highThreshold = 0.15; // Strong edges
    const lowThreshold = 0.08;  // Weak edges (connected to strong edges)
    
    const strongEdges = tf.greater(normalized, highThreshold);
    const weakEdges = tf.greater(normalized, lowThreshold);
    
    // Get edge data for hysteresis processing
    const strongData = await strongEdges.data();
    const weakData = await weakEdges.data();
    const normData = await normalized.data();
    
    // Apply hysteresis: keep strong edges and weak edges connected to strong edges
    const edgeData = new Array(width * height);
    const visited = new Array(width * height).fill(false);
    
    // First pass: mark all strong edges
    for (let i = 0; i < width * height; i++) {
        edgeData[i] = strongData[i] > 0;
        if (edgeData[i]) visited[i] = true;
    }
    
    // Second pass: connect weak edges to strong edges (8-connected)
    const neighbors = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    function getIndex(x, y) {
        return y * width + x;
    }
    
    function isValid(x, y) {
        return x >= 0 && x < width && y >= 0 && y < height;
    }
    
    // Flood fill from strong edges to connected weak edges
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = getIndex(x, y);
            if (edgeData[idx] && !visited[idx]) {
                // This is a strong edge, flood fill to connected weak edges
                const stack = [[x, y]];
                while (stack.length > 0) {
                    const [cx, cy] = stack.pop();
                    const cidx = getIndex(cx, cy);
                    
                    if (visited[cidx]) continue;
                    visited[cidx] = true;
                    
                    // Check neighbors
                    for (const [dx, dy] of neighbors) {
                        const nx = cx + dx;
                        const ny = cy + dy;
                        const nidx = getIndex(nx, ny);
                        
                        if (isValid(nx, ny) && !visited[nidx]) {
                            // If it's a weak edge connected to strong edge, keep it
                            if (weakData[nidx] > 0 && normData[nidx] > lowThreshold) {
                                edgeData[nidx] = true;
                                stack.push([nx, ny]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Clean up tensors
    tensor.dispose();
    tensor4d.dispose();
    gaussianKernel.dispose();
    blurred.dispose();
    sobelX.dispose();
    sobelY.dispose();
    gx.dispose();
    gy.dispose();
    gxSqueezed.dispose();
    gySqueezed.dispose();
    magnitude.dispose();
    maxVal.dispose();
    normalized.dispose();
    strongEdges.dispose();
    weakEdges.dispose();
    
    // Return boolean array
    return edgeData;
}

// Extract contours from edge map using connected components
function extractContours(edges, width, height) {
    const visited = new Array(width * height).fill(false);
    const contours = [];
    
    // 8-connected neighbors
    const neighbors = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    function getIndex(x, y) {
        return y * width + x;
    }
    
    function isValid(x, y) {
        return x >= 0 && x < width && y >= 0 && y < height;
    }
    
    // Find connected edge pixels
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = getIndex(x, y);
            
            if (edges[idx] && !visited[idx]) {
                // Found a new contour, trace it
                const contour = [];
                const stack = [[x, y]];
                
                while (stack.length > 0) {
                    const [cx, cy] = stack.pop();
                    const cidx = getIndex(cx, cy);
                    
                    if (visited[cidx] || !edges[cidx]) continue;
                    
                    visited[cidx] = true;
                    contour.push([cx, cy]);
                    
                    // Add neighbors to stack
                    for (const [dx, dy] of neighbors) {
                        const nx = cx + dx;
                        const ny = cy + dy;
                        const nidx = getIndex(nx, ny);
                        
                        if (isValid(nx, ny) && edges[nidx] && !visited[nidx]) {
                            stack.push([nx, ny]);
                        }
                    }
                }
                
                // Only keep contours with minimum length
                if (contour.length >= 15) { // Increased minimum length
                    contours.push(contour);
                }
            }
        }
    }
    
    return contours;
}

// Fill gaps in contours by connecting nearby endpoints
function fillContourGaps(contours, width, height, maxGapDistance = 8) {
    if (contours.length === 0) return contours;
    
    // Find all contour endpoints
    const endpoints = [];
    contours.forEach((contour, idx) => {
        if (contour.length < 2) return;
        const start = contour[0];
        const end = contour[contour.length - 1];
        
        // Check if contour is closed (start and end are close)
        const dist = Math.sqrt(Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2));
        const isClosed = dist < 5;
        
        if (!isClosed) {
            endpoints.push({ point: start, contourIdx: idx, isStart: true });
            endpoints.push({ point: end, contourIdx: idx, isEnd: true });
        }
    });
    
    // Group endpoints that are close together
    const merged = new Set();
    const connections = [];
    
    for (let i = 0; i < endpoints.length; i++) {
        if (merged.has(i)) continue;
        
        const ep1 = endpoints[i];
        const group = [i];
        
        for (let j = i + 1; j < endpoints.length; j++) {
            if (merged.has(j)) continue;
            if (ep1.contourIdx === endpoints[j].contourIdx) continue; // Same contour
            
            const ep2 = endpoints[j];
            const dist = Math.sqrt(
                Math.pow(ep1.point[0] - ep2.point[0], 2) + 
                Math.pow(ep1.point[1] - ep2.point[1], 2)
            );
            
            if (dist <= maxGapDistance) {
                group.push(j);
                merged.add(j);
            }
        }
        
        if (group.length > 1) {
            connections.push(group);
            group.forEach(idx => merged.add(idx));
        }
    }
    
    // Merge connected contours
    const contourGroups = new Map();
    connections.forEach((group, groupIdx) => {
        const contourIndices = new Set();
        group.forEach(epIdx => {
            contourIndices.add(endpoints[epIdx].contourIdx);
        });
        
        if (contourIndices.size > 1) {
            const key = Array.from(contourIndices).sort().join(',');
            if (!contourGroups.has(key)) {
                contourGroups.set(key, Array.from(contourIndices));
            }
        }
    });
    
    // Merge contours in each group by connecting endpoints
    const mergedContours = [];
    const usedIndices = new Set();
    
    contourGroups.forEach(indices => {
        if (indices.length < 2) return;
        
        // Get all contour segments to merge with their original indices
        const segments = indices.map(idx => ({ contour: contours[idx], origIdx: idx }))
            .filter(item => item.contour && item.contour.length > 0);
        if (segments.length < 2) return;
        
        // Start with first segment
        const merged = [...segments[0].contour];
        const remaining = segments.slice(1);
        usedIndices.add(segments[0].origIdx);
        
        while (remaining.length > 0) {
            const lastPoint = merged[merged.length - 1];
            
            let bestIdx = -1;
            let bestDist = Infinity;
            let shouldReverse = false;
            
            // Find the closest endpoint from remaining segments
            for (let i = 0; i < remaining.length; i++) {
                const seg = remaining[i].contour;
                if (!seg || seg.length === 0) continue;
                
                const distToStart = Math.sqrt(
                    Math.pow(lastPoint[0] - seg[0][0], 2) + 
                    Math.pow(lastPoint[1] - seg[0][1], 2)
                );
                const distToEnd = Math.sqrt(
                    Math.pow(lastPoint[0] - seg[seg.length - 1][0], 2) + 
                    Math.pow(lastPoint[1] - seg[seg.length - 1][1], 2)
                );
                
                if (distToStart < bestDist && distToStart <= maxGapDistance) {
                    bestDist = distToStart;
                    bestIdx = i;
                    shouldReverse = false;
                }
                if (distToEnd < bestDist && distToEnd <= maxGapDistance) {
                    bestDist = distToEnd;
                    bestIdx = i;
                    shouldReverse = true;
                }
            }
            
            if (bestIdx >= 0 && bestDist <= maxGapDistance) {
                const segToAdd = remaining[bestIdx].contour;
                const nextPoint = shouldReverse ? segToAdd[0] : segToAdd[segToAdd.length - 1];
                
                // Bridge the gap with intermediate points
                if (bestDist > 1) {
                    const steps = Math.max(2, Math.ceil(bestDist / 2));
                    for (let s = 1; s <= steps; s++) {
                        const t = s / (steps + 1);
                        merged.push([
                            Math.round(lastPoint[0] + (nextPoint[0] - lastPoint[0]) * t),
                            Math.round(lastPoint[1] + (nextPoint[1] - lastPoint[1]) * t)
                        ]);
                    }
                }
                
                // Add the segment (reversed if needed)
                if (shouldReverse) {
                    merged.push(...segToAdd.slice().reverse());
                } else {
                    merged.push(...segToAdd);
                }
                
                usedIndices.add(remaining[bestIdx].origIdx);
                remaining.splice(bestIdx, 1);
            } else {
                // Can't connect more, stop
                break;
            }
        }
        
        if (merged.length > 0) {
            mergedContours.push(merged);
        }
    });
    
    // Add unmerged contours
    contours.forEach((contour, idx) => {
        if (!usedIndices.has(idx)) {
            mergedContours.push(contour);
        }
    });
    
    return mergedContours.length > 0 ? mergedContours : contours;
}

// Calculate contour quality score (higher = better)
function scoreContourQuality(contour, width, height) {
    if (!contour || contour.length < 3) return 0;
    
    // Calculate bounding box
    let minX = width, maxX = 0, minY = height, maxY = 0;
    contour.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });
    
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    const bboxArea = bboxWidth * bboxHeight;
    
    // Check if contour is closed (start and end points are close)
    const start = contour[0];
    const end = contour[contour.length - 1];
    const closureDist = Math.sqrt(Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2));
    const isClosed = closureDist < 8;
    
    // Calculate approximate area using shoelace formula (for closed contours)
    let area = 0;
    if (isClosed && contour.length >= 3) {
        for (let i = 0; i < contour.length; i++) {
            const j = (i + 1) % contour.length;
            area += contour[i][0] * contour[j][1];
            area -= contour[j][0] * contour[i][1];
        }
        area = Math.abs(area) / 2;
    }
    
    // Calculate compactness (how well the contour fills its bounding box)
    const compactness = area > 0 ? area / bboxArea : 0;
    
    // Calculate aspect ratio
    const aspectRatio = bboxWidth > 0 && bboxHeight > 0 ? 
        Math.max(bboxWidth / bboxHeight, bboxHeight / bboxWidth) : Infinity;
    
    // Score components
    let score = 0;
    
    // Length score (longer contours are generally better, but not too long)
    const lengthScore = Math.min(contour.length / 100, 1.0) * 0.2;
    score += lengthScore;
    
    // Closure score (closed contours are preferred)
    score += isClosed ? 0.3 : 0.1;
    
    // Compactness score (well-filled shapes are better)
    score += Math.min(compactness * 2, 1.0) * 0.2;
    
    // Area score (reasonable size)
    const canvasArea = width * height;
    const areaRatio = area / canvasArea;
    if (areaRatio > 0.001 && areaRatio < 0.5) {
        score += 0.2;
    }
    
    // Aspect ratio penalty (very elongated shapes are less likely to be objects)
    if (aspectRatio > 10) {
        score *= 0.5; // Penalize very elongated shapes
    }
    
    return score;
}

// Check if a contour is a construction/auxiliary line that should be removed
function isConstructionLine(contour, allContours, width, height) {
    if (!contour || contour.length < 5) return false;
    
    const start = contour[0];
    const end = contour[contour.length - 1];
    
    // Calculate line properties
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate bounding box
    let minX = width, maxX = 0, minY = height, maxY = 0;
    contour.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    const bboxArea = bboxWidth * bboxHeight;
    const bboxPerimeter = 2 * (bboxWidth + bboxHeight);
    
    // Check if it's a nearly straight line (low curvature) - construction lines are very straight
    let totalCurvature = 0;
    let maxCurvature = 0;
    let straightSegmentCount = 0;
    
    for (let i = 1; i < contour.length - 1; i++) {
        const [x1, y1] = contour[i - 1];
        const [x2, y2] = contour[i];
        const [x3, y3] = contour[i + 1];
        
        const v1x = x2 - x1;
        const v1y = y2 - y1;
        const v2x = x3 - x2;
        const v2y = y3 - y2;
        
        const cross = v1x * v2y - v1y * v2x;
        const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
        
        if (len1 > 0 && len2 > 0) {
            const curvature = Math.abs(cross) / (len1 * len2);
            totalCurvature += curvature;
            maxCurvature = Math.max(maxCurvature, curvature);
            
            // Count how many segments are nearly straight
            if (curvature < 0.05) {
                straightSegmentCount++;
            }
        }
    }
    
    const avgCurvature = totalCurvature / Math.max(1, contour.length - 2);
    const straightRatio = straightSegmentCount / Math.max(1, contour.length - 2);
    
    // REJECTION CRITERIA for construction lines:
    
    // 1. Very straight lines (low curvature) that span significant distance
    if (avgCurvature < 0.06 && length > Math.min(width, height) * 0.2) {
        return true; // Construction line
    }
    
    // 2. Lines that are mostly straight segments (>80% straight)
    if (straightRatio > 0.8 && length > 30) {
        return true; // Construction line
    }
    
    // 3. Open lines (not closed) with high length-to-area ratio (geometric construction lines)
    const closureDist = Math.sqrt(Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2));
    const isClosed = closureDist < 10;
    
    if (!isClosed) {
        // If length is much greater than bounding box perimeter, it's a construction line
        if (length > bboxPerimeter * 1.3 && avgCurvature < 0.1) {
            return true; // Construction line
        }
        
        // Very long open lines with low curvature
        if (length > Math.min(width, height) * 0.3 && avgCurvature < 0.08) {
            return true; // Construction line
        }
    }
    
    // 4. Diagonal/geometric lines that cut across the image
    if (length > Math.min(width, height) * 0.25) {
        const angle = Math.abs(Math.atan2(dy, dx));
        const isDiagonal = (angle > Math.PI / 6 && angle < 5 * Math.PI / 6) || 
                          (angle > 7 * Math.PI / 6 && angle < 11 * Math.PI / 6);
        const isHorizontal = angle < Math.PI / 12 || angle > 11 * Math.PI / 12;
        const isVertical = angle > 5 * Math.PI / 12 && angle < 7 * Math.PI / 12;
        
        // Diagonal or geometric lines with low curvature are construction lines
        if ((isDiagonal || isHorizontal || isVertical) && avgCurvature < 0.1) {
            return true; // Construction line
        }
    }
    
    // 5. Lines that intersect many other contours (crossing construction lines)
    if (length > 40 && avgCurvature < 0.12) {
        let intersectionCount = 0;
        const linePoints = new Set();
        // Sample points along the line
        for (let i = 0; i < contour.length; i += Math.max(1, Math.floor(contour.length / 10))) {
            const [x, y] = contour[i];
            linePoints.add(`${Math.floor(x)},${Math.floor(y)}`);
        }
        
        // Check intersections with other contours
        for (const otherContour of allContours) {
            if (otherContour === contour) continue;
            for (const [x, y] of otherContour) {
                const key = `${Math.floor(x)},${Math.floor(y)}`;
                if (linePoints.has(key)) {
                    intersectionCount++;
                    if (intersectionCount > 2) {
                        return true; // Construction line crossing multiple contours
                    }
                }
            }
        }
    }
    
    return false; // Not a construction line - keep it
}

// Validate contour represents a valid outline (not noise or artifact)
function isValidOutline(contour, width, height) {
    if (!contour || contour.length < 10) return false;
    
    // Check if contour has reasonable shape
    let minX = width, maxX = 0, minY = height, maxY = 0;
    contour.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });
    
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    
    // Reject contours that are too thin (likely noise)
    if (bboxWidth < 3 && bboxHeight < 3) return false;
    
    // Reject contours that are extremely elongated in one dimension
    if (bboxWidth > 0 && bboxHeight > 0) {
        const aspectRatio = Math.max(bboxWidth / bboxHeight, bboxHeight / bboxWidth);
        if (aspectRatio > 20) return false; // Too elongated
    }
    
    // Check closure - valid outlines should be closed or nearly closed
    const start = contour[0];
    const end = contour[contour.length - 1];
    const closureDist = Math.sqrt(Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2));
    const contourLength = contour.length;
    
    // For closed contours, check if they form a reasonable shape
    if (closureDist < 15) {
        // Calculate approximate area
        let area = 0;
        for (let i = 0; i < contour.length; i++) {
            const j = (i + 1) % contour.length;
            area += contour[i][0] * contour[j][1];
            area -= contour[j][0] * contour[i][1];
        }
        area = Math.abs(area) / 2;
        
        // Reject very small closed shapes (likely noise)
        if (area < 50) return false;
    }
    
    return true;
}

// Filter out background and frame contours with enhanced quality filtering
function filterBackgroundAndFrame(contours, width, height) {
    const canvasArea = width * height;
    const minArea = canvasArea * 0.005; // Minimum area threshold (0.5% of canvas)
    const maxArea = canvasArea * 0.80; // Maximum area threshold (80% of canvas)
    const frameThreshold = 5; // Pixels tolerance for frame detection
    const minLength = 8; // Lower minimum - preserve more details
    
    // Score all contours
    const scoredContours = contours.map((contour, idx) => ({
        contour,
        index: idx,
        score: scoreContourQuality(contour, width, height)
    }));
    
    // Filter contours
    const filtered = scoredContours.filter(({ contour, score }) => {
        if (!contour || contour.length < minLength) return false;
        
        // Calculate bounding box
        let minX = width, maxX = 0, minY = height, maxY = 0;
        contour.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        });
        
        const bboxWidth = maxX - minX;
        const bboxHeight = maxY - minY;
        const bboxArea = bboxWidth * bboxHeight;
        
        // Filter out contours that are too large (background)
        if (bboxArea > maxArea) {
            return false;
        }
        
        // MINIMAL filtering - preserve ALL essential elements
        // Only filter out extremely low quality or clearly invalid contours
        if (score < 0.10) {
            return false; // Only reject very poor quality
        }
        
        // Keep small contours - they might be essential details
        if (bboxArea < minArea && score < 0.20) {
            return false; // Only reject if both small AND low quality
        }
        
        // Filter out contours that match canvas bounds (frame/border)
        const matchesTop = minY <= frameThreshold;
        const matchesBottom = maxY >= height - frameThreshold;
        const matchesLeft = minX <= frameThreshold;
        const matchesRight = maxX >= width - frameThreshold;
        
        // If contour spans most of canvas bounds, it's likely a frame
        if ((matchesTop && matchesBottom && bboxWidth > width * 0.8) ||
            (matchesLeft && matchesRight && bboxHeight > height * 0.8) ||
            (matchesTop && matchesLeft && matchesRight && bboxHeight < 10) ||
            (matchesBottom && matchesLeft && matchesRight && bboxHeight < 10) ||
            (matchesLeft && matchesTop && matchesBottom && bboxWidth < 10) ||
            (matchesRight && matchesTop && matchesBottom && bboxWidth < 10)) {
            return false;
        }
        
        // Additional check: if contour is a large rectangle matching canvas bounds
        if (matchesTop && matchesBottom && matchesLeft && matchesRight &&
            bboxWidth > width * 0.9 && bboxHeight > height * 0.9) {
            return false;
        }
        
        return true;
    });
    
    // Remove diagonal/crossing lines and invalid outlines
    let finalContours = filtered.filter(({ contour }) => {
        // Validate it's a valid outline
        if (!isValidOutline(contour, width, height)) {
            return false;
        }
        // Check for construction/auxiliary lines (to remove)
        if (isConstructionLine(contour, filtered.map(f => f.contour), width, height)) {
            return false;
        }
        return true;
    });
    
    // POST-GENERATION FILTERING: Additional pass to remove construction lines
    // This is critical - run after initial filtering to catch any missed construction lines
    console.log('Running post-generation construction line filter...');
    const beforePostFilter = finalContours.length;
    finalContours = postFilterConstructionLines(finalContours, width, height);
    console.log('Post-filter removed', beforePostFilter - finalContours.length, 'construction lines');
    
    // Sort by quality score (best first)
    finalContours.sort((a, b) => b.score - a.score);
    
    console.log('Final filtered contours:', finalContours.length, 'out of', contours.length, 'original');
    
    return finalContours.map(({ contour }) => contour);
}

// Post-generation filter: Aggressively remove construction lines that may have been missed
function postFilterConstructionLines(contours, width, height) {
    return contours.filter(({ contour }) => {
        if (!contour || contour.length < 5) return false;
        
        const start = contour[0];
        const end = contour[contour.length - 1];
        const length = Math.sqrt(
            Math.pow(end[0] - start[0], 2) + 
            Math.pow(end[1] - start[1], 2)
        );
        
        // Calculate bounding box
        let minX = width, maxX = 0, minY = height, maxY = 0;
        contour.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        });
        const bboxWidth = maxX - minX;
        const bboxHeight = maxY - minY;
        const bboxArea = bboxWidth * bboxHeight;
        const bboxPerimeter = 2 * (bboxWidth + bboxHeight);
        
        // Calculate straightness metrics
        let totalCurvature = 0;
        let straightPoints = 0;
        let maxDeviation = 0;
        
        // Fit a line to the contour and measure deviation
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        
        if (lineLength > 0) {
            // Calculate perpendicular distance of each point from the line
            for (let i = 1; i < contour.length - 1; i++) {
                const [px, py] = contour[i];
                const [sx, sy] = start;
                
                // Distance from point to line
                const num = Math.abs((dy * px - dx * py + end[0] * start[1] - end[1] * start[0]));
                const den = lineLength;
                const dist = den > 0 ? num / den : 0;
                maxDeviation = Math.max(maxDeviation, dist);
                
                // Curvature check
                if (i > 0 && i < contour.length - 1) {
                    const [x1, y1] = contour[i - 1];
                    const [x2, y2] = contour[i];
                    const [x3, y3] = contour[i + 1];
                    
                    const v1x = x2 - x1;
                    const v1y = y2 - y1;
                    const v2x = x3 - x2;
                    const v2y = y3 - y2;
                    
                    const cross = v1x * v2y - v1y * v2x;
                    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
                    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
                    
                    if (len1 > 0 && len2 > 0) {
                        const curvature = Math.abs(cross) / (len1 * len2);
                        totalCurvature += curvature;
                        if (curvature < 0.05) straightPoints++;
                    }
                }
            }
        }
        
        const avgCurvature = totalCurvature / Math.max(1, contour.length - 2);
        const straightRatio = straightPoints / Math.max(1, contour.length - 2);
        const deviationRatio = lineLength > 0 ? maxDeviation / lineLength : 0;
        
        // AGGRESSIVE REJECTION CRITERIA:
        
        // 1. Very straight lines (low deviation from fitted line)
        if (deviationRatio < 0.05 && length > 30) {
            return false; // Construction line
        }
        
        // 2. High straightness ratio
        if (straightRatio > 0.75 && length > 25) {
            return false; // Construction line
        }
        
        // 3. Low curvature + significant length
        if (avgCurvature < 0.05 && length > Math.min(width, height) * 0.15) {
            return false; // Construction line
        }
        
        // 4. Open lines with high length-to-perimeter ratio (geometric construction)
        const closureDist = Math.sqrt(Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2));
        if (!(closureDist < 10) && length > bboxPerimeter * 1.2) {
            return false; // Construction line
        }
        
        // 5. Concentric circles detection - if multiple similar-sized closed contours exist
        if (closureDist < 10 && bboxArea > 0) {
            const radius = Math.sqrt(bboxArea / Math.PI);
            const perimeter = 2 * Math.PI * radius;
            const perimeterRatio = length / Math.max(perimeter, 1);
            
            // If it's very close to a perfect circle and there are similar ones, might be construction
            if (perimeterRatio > 0.9 && perimeterRatio < 1.1) {
                // Check if there are other similar circles (concentric)
                let similarCount = 0;
                for (const other of contours) {
                    if (other.contour === contour) continue;
                    const otherStart = other.contour[0];
                    const otherEnd = other.contour[other.contour.length - 1];
                    const otherClosure = Math.sqrt(
                        Math.pow(otherEnd[0] - otherStart[0], 2) + 
                        Math.pow(otherEnd[1] - otherStart[1], 2)
                    );
                    
                    if (otherClosure < 10) {
                        let otherMinX = width, otherMaxX = 0, otherMinY = height, otherMaxY = 0;
                        other.contour.forEach(([x, y]) => {
                            otherMinX = Math.min(otherMinX, x);
                            otherMaxX = Math.max(otherMaxX, x);
                            otherMinY = Math.min(otherMinY, y);
                            otherMaxY = Math.max(otherMaxY, y);
                        });
                        const otherArea = (otherMaxX - otherMinX) * (otherMaxY - otherMinY);
                        const centerDist = Math.sqrt(
                            Math.pow((minX + maxX) / 2 - (otherMinX + otherMaxX) / 2, 2) +
                            Math.pow((minY + maxY) / 2 - (otherMinY + otherMaxY) / 2, 2)
                        );
                        
                        // If centers are close and sizes are similar, likely concentric
                        if (centerDist < Math.max(bboxWidth, bboxHeight) * 0.3 && 
                            Math.abs(bboxArea - otherArea) < bboxArea * 0.5) {
                            similarCount++;
                            if (similarCount > 1) {
                                return false; // Part of concentric construction circles
                            }
                        }
                    }
                }
            }
        }
        
        return true; // Keep this contour
    });
}

// Simplify contours using Douglas-Peucker algorithm
function simplifyContours(contours, epsilon = 1.5) {
    function douglasPeucker(points, epsilon) {
        if (points.length <= 2) return points;
        
        // Find the point with maximum distance from line between first and last
        let maxDist = 0;
        let maxIndex = 0;
        const end = points.length - 1;
        
        for (let i = 1; i < end; i++) {
            const dist = pointToLineDistance(points[i], points[0], points[end]);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
        
        // If max distance is greater than epsilon, recursively simplify
        if (maxDist > epsilon) {
            // Recursive call on both parts
            const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
            const right = douglasPeucker(points.slice(maxIndex), epsilon);
            
            // Combine results (remove duplicate point at maxIndex)
            return left.slice(0, -1).concat(right);
        } else {
            // All points between first and last can be removed
            return [points[0], points[end]];
        }
    }
    
    function pointToLineDistance(point, lineStart, lineEnd) {
        const [x0, y0] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;
        
        const A = x0 - x1;
        const B = y0 - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x0 - xx;
        const dy = y0 - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    return contours.map(contour => douglasPeucker(contour, epsilon));
}

// Generate tutorial steps from contours with dynamic step count
function generateTutorialStepsFromContours(contours, width, height) {
    try {
        console.log('=== Starting tutorial step generation ===');
        console.log('Input contours count:', contours ? contours.length : 'null/undefined');
        console.log('Canvas dimensions:', width, 'x', height);
        
        const steps = [];
    
        // Validate input
        if (!contours || !Array.isArray(contours) || contours.length === 0) {
            console.warn('No contours provided, using geometric fallback');
            return generateGeometricSteps(width, height);
        }
        
        // Create indexed contours with their original indices (already sorted by size)
        const indexedContours = contours.map((c, idx) => {
            // Validate contour structure
            if (!c || !Array.isArray(c) || c.length === 0) {
                return null;
            }
            return { contour: c, index: idx, length: c.length };
        }).filter(item => item !== null); // Remove invalid contours
        
        const totalContours = indexedContours.length;
        
        if (totalContours === 0) {
            console.warn('No valid contours found, using geometric fallback');
            return generateGeometricSteps(width, height);
        }
        
        // Calculate dynamic number of steps based on contour count
        // NO LIMIT - allow as many steps as needed for complete representation
        let numSteps;
        if (totalContours <= 3) {
            numSteps = Math.max(2, totalContours); // At least 2 steps for very few contours
        } else if (totalContours <= 5) {
            numSteps = 3; // 3 steps for small sets
        } else if (totalContours <= 15) {
            numSteps = 5 + Math.floor((totalContours - 5) / 3); // 5-7 steps
        } else if (totalContours <= 30) {
            numSteps = 7 + Math.floor((totalContours - 15) / 5); // 7-10 steps
        } else {
            // For many contours, create more steps to ensure all are included
            // Base steps + additional steps for remaining contours
            numSteps = 10 + Math.floor((totalContours - 30) / 3); // More steps for many contours
        }
        
        // Ensure we have at least 2 steps, but NO MAXIMUM LIMIT
        numSteps = Math.max(2, numSteps);
        
        // Ensure all contours are included by creating enough steps
        // If we have more contours than steps, increase steps
        if (numSteps < totalContours) {
            numSteps = totalContours; // One step per contour if needed
        }
        
        console.log(`Generating ${numSteps} steps from ${totalContours} contours`);
        
        // Calculate contours per step for EXPONENTIAL progression
        // Each step should show significantly more progress than the previous
        const contoursPerStep = [];
        let remainingContours = totalContours;
        
        // Exponential progression: each step adds exponentially more contours
        // Formula: step i gets approximately (base * growthFactor^i) contours
        // This ensures visible, meaningful advancement between steps
        const baseRatio = 0.08; // First step gets ~8% of contours
        const growthFactor = 1.8; // Each subsequent step grows by 80%
        
        let cumulativeRatio = 0;
        
        for (let i = 0; i < numSteps - 1; i++) {
            // Calculate the target ratio for this step using exponential progression
            let stepRatio;
            
            if (i === 0) {
                // First step: minimal foundation (~5-10% of total contours)
                stepRatio = baseRatio;
            } else {
                // Exponential growth: each step adds progressively more
                // Calculate what ratio this step should have
                const targetCumulativeRatio = Math.min(0.95, baseRatio * Math.pow(growthFactor, i));
                stepRatio = Math.max(0.03, targetCumulativeRatio - cumulativeRatio);
            }
            
            // Calculate actual count based on ratio
            const count = Math.max(1, Math.min(remainingContours, Math.floor(totalContours * stepRatio)));
            
            // Ensure we don't take more than available
            const actualCount = Math.min(count, remainingContours);
            
            if (actualCount > 0) {
                contoursPerStep.push(actualCount);
                remainingContours -= actualCount;
                cumulativeRatio += (actualCount / totalContours);
            } else {
                // If we can't add any more, break early
                break;
            }
        }
        
        // Adjust the last step to include any remaining contours
        if (contoursPerStep.length < numSteps - 1 && remainingContours > 0) {
            // Distribute remaining contours across remaining steps
            const remainingSteps = (numSteps - 1) - contoursPerStep.length;
            if (remainingSteps > 0) {
                const perRemainingStep = Math.floor(remainingContours / remainingSteps);
                for (let i = 0; i < remainingSteps - 1; i++) {
                    contoursPerStep.push(perRemainingStep);
                    remainingContours -= perRemainingStep;
                }
                contoursPerStep.push(remainingContours);
            } else {
                // Add remaining to last step if we've already filled all steps
                if (contoursPerStep.length > 0) {
                    contoursPerStep[contoursPerStep.length - 1] += remainingContours;
                }
            }
        }
        
        // Build steps progressively
        let contourIndex = 0;
        const stepTitles = [
            'Basic Composition',
            'Major Shapes',
            'Building Structure',
            'Adding Forms',
            'Expanding Details',
            'Refining Elements',
            'Completing Features',
            'Adding Finer Details',
            'Enhancing Texture',
            'Final Details',
            'Polishing',
            'Final Touches'
        ];
        
        const stepInstructions = [
            'Start by drawing the main outlines. Focus on the largest shapes and overall composition. These are the foundation of your drawing.',
            'Add the major shapes and forms. These include the main body parts, large features, and significant structural elements.',
            'Continue building the structure. Add the next layer of important shapes that define the form.',
            'Add more forms and elements. Each new shape helps define the overall structure of your drawing.',
            'Expand with additional details. Include more features that add depth and character to your drawing.',
            'Refine the elements you\'ve drawn. Make sure proportions are correct and shapes are well-defined.',
            'Complete the main features. Add all the important elements that make your drawing recognizable.',
            'Add finer details. Include smaller features like textures, patterns, and subtle elements.',
            'Enhance textures and details. Add depth and richness to your drawing with intricate elements.',
            'Add final details. Include the smallest features that complete your drawing.',
            'Polish your drawing. Refine edges, enhance contrast, and perfect your lines.',
            'Add final touches, clean up any rough edges, and ensure your drawing is complete and polished.'
        ];
        
        // Create progressive steps
        for (let stepNum = 0; stepNum < numSteps - 1; stepNum++) {
            const contoursInThisStep = contoursPerStep[stepNum] || 0;
            const stepContourIndices = [];
            
            for (let j = 0; j < contoursInThisStep && contourIndex < totalContours; j++) {
                if (indexedContours[contourIndex]) {
                    stepContourIndices.push(indexedContours[contourIndex].index);
                }
                contourIndex++;
            }
            
            if (stepContourIndices.length > 0) {
                // Determine detail level based on step number
                let detailLevel;
                if (stepNum === 0) detailLevel = 'basic';
                else if (stepNum < numSteps / 3) detailLevel = 'outline';
                else if (stepNum < (2 * numSteps) / 3) detailLevel = 'object';
                else detailLevel = 'detailed';
                
                steps.push({
                    step: stepNum + 1,
                    title: stepTitles[Math.min(stepNum, stepTitles.length - 1)],
                    instruction: stepInstructions[Math.min(stepNum, stepInstructions.length - 1)],
                    contourIndices: stepContourIndices,
                    detailLevel: detailLevel
                });
            }
        }
        
        // Final step: All contours
        if (steps.length > 0) {
            steps.push({
                step: numSteps,
                title: 'Final Touches',
                instruction: 'Add final touches, clean up any rough edges, and ensure your drawing is complete and polished. All elements are now visible.',
                contourIndices: indexedContours.map(item => item.index), // All contours
                detailLevel: 'final'
            });
        } else {
            // Fallback if no steps were created
            console.warn('No steps created, using fallback');
            return generateGeometricSteps(width, height);
        }
    
        console.log('=== Tutorial step generation complete ===');
        console.log('Total steps generated:', steps.length);
        return steps;
    } catch (error) {
        console.error('=== FATAL ERROR in generateTutorialStepsFromContours ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        console.error('Input contours:', contours);
        console.error('Canvas dimensions:', width, 'x', height);
        
        // Return fallback steps on error
        console.warn('Returning geometric fallback steps due to error');
        try {
            return generateGeometricSteps(width, height);
        } catch (fallbackError) {
            console.error('Fatal Error: Even fallback step generation failed:', fallbackError);
            // Return minimal steps as last resort
            return [{
                step: 1,
                title: 'Error',
                instruction: 'An error occurred while generating the tutorial. Please try uploading a different image.',
                contourIndices: [],
                detailLevel: 'basic'
            }];
        }
    }
}


// Fallback: Generate steps based on geometric analysis
function generateGeometricSteps(width, height) {
    const steps = [
        {
            step: 1,
            title: 'Basic Framework',
            instruction: 'Start by drawing the basic framework. Identify the main geometric shapes (circles, rectangles, triangles) that form the foundation of your drawing.',
            contourIndices: [],
            detailLevel: 'basic'
        },
        {
            step: 2,
            title: 'Main Shapes',
            instruction: 'Draw the main shapes and their relationships. Focus on proportions and how different elements relate to each other.',
            contourIndices: [],
            detailLevel: 'outline'
        },
        {
            step: 3,
            title: 'Refining Shapes',
            instruction: 'Refine the shapes, making them more accurate. Add curves and adjust proportions as needed.',
            contourIndices: [],
            detailLevel: 'object'
        },
        {
            step: 4,
            title: 'Adding Details',
            instruction: 'Add details, textures, and finer elements to bring your drawing to life.',
            contourIndices: [],
            detailLevel: 'detailed'
        },
        {
            step: 5,
            title: 'Final Polish',
            instruction: 'Add final touches, enhance contrast, and polish your drawing to completion.',
            contourIndices: [],
            detailLevel: 'final'
        }
    ];
    return steps;
}

// Display a specific step
function displayStep(stepIndex) {
    if (stepIndex < 0) return;
    
    // Allow going beyond initial steps for continuous refinement
    if (stepIndex >= tutorialSteps.length) {
        // User is beyond initial steps - show final result
        stepIndex = tutorialSteps.length - 1;
    }

    const step = tutorialSteps[stepIndex];
    currentStepIndex = stepIndex; // Set before drawing so drawTutorialStep can use it

    // Update UI with dynamic step count
    document.getElementById('currentStep').textContent = stepIndex + 1; // Step numbers are 1-based
    
    // NEVER show step limit - always allow unlimited steps
    const stepLimitIndicator = document.getElementById('stepLimitIndicator');
    stepLimitIndicator.style.display = 'none'; // Always hide step limit
    
    document.getElementById('stepInstructions').textContent = step.instruction;
    
    // Update buttons
    document.getElementById('prevBtn').disabled = stepIndex === 0;
    // Next button is never disabled - users can always add more detail
    document.getElementById('nextBtn').disabled = false;
    
    // "Add More Detail" function removed - focus on accurate initial generation

    // Draw tutorial visualization (with stepIndex for clarity)
    drawTutorialStep(step, stepIndex);
}

// Draw tutorial step visualization
function drawTutorialStep(step, stepIndex) {
    // Use stepIndex parameter or fall back to currentStepIndex
    const currentIndex = (stepIndex !== undefined) ? stepIndex : currentStepIndex;
    
    // Clear tutorial canvas
    tutorialCtx.clearRect(0, 0, tutorialCanvas.width, tutorialCanvas.height);
    
    // Draw white background
    tutorialCtx.fillStyle = '#ffffff';
    tutorialCtx.fillRect(0, 0, tutorialCanvas.width, tutorialCanvas.height);
    
    // Draw original image with very light opacity as reference (optional)
    tutorialCtx.globalAlpha = 0.1;
    tutorialCtx.drawImage(originalImage, 0, 0, tutorialCanvas.width, tutorialCanvas.height);
    tutorialCtx.globalAlpha = 1.0;

    // Draw contours as clean lines
    if (edgeContours.length > 0 && step.contourIndices) {
        // Get all previous step contour indices (cumulative - all steps up to but not including current)
        const allPreviousIndices = new Set();
        for (let i = 0; i < currentIndex; i++) {
            if (tutorialSteps[i] && tutorialSteps[i].contourIndices) {
                tutorialSteps[i].contourIndices.forEach(idx => allPreviousIndices.add(idx));
            }
        }
        
        // Get current step's new contour indices
        const currentStepIndices = new Set(step.contourIndices || []);
        
        // Draw previous steps' contours in light gray (for context)
        if (allPreviousIndices.size > 0) {
            drawContourLinesProgressive(Array.from(allPreviousIndices), '#cccccc', 1.5, step.detailLevel, tutorialCtx);
        }
        
        // Draw current step's new contours highlighted in black/thicker (what to draw next)
        if (currentStepIndices.size > 0) {
            drawContourLinesProgressive(Array.from(currentStepIndices), '#000000', 2.5, step.detailLevel, tutorialCtx);
        }
    } else {
        // Fallback: Draw geometric guides
        drawGeometricGuides(step);
    }
    
    // Always draw the final result canvas with all contours
    drawFinalResult();
}

// Draw final result (complete line art) on final canvas
function drawFinalResult() {
    // Clear final canvas
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    // Draw white background
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    // Draw original image with very light opacity as reference (optional)
    finalCtx.globalAlpha = 0.1;
    finalCtx.drawImage(originalImage, 0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.globalAlpha = 1.0;
    
    // Draw all contours
    if (edgeContours.length > 0) {
        const allIndices = edgeContours.map((_, idx) => idx);
        drawContourLinesProgressive(allIndices, '#000000', 2, 'final', finalCtx);
    }
}

// Draw geometric guides for fallback mode (when no contours are found)
function drawGeometricGuides(step) {
    tutorialCtx.strokeStyle = '#000000'; // Black lines
    tutorialCtx.lineWidth = 2;
    tutorialCtx.globalAlpha = 0.8;

    // Draw grid or basic shapes based on step
    if (step.detailLevel === 'basic') {
        // Draw a simple grid
        const gridSize = 50;
        for (let x = 0; x < tutorialCanvas.width; x += gridSize) {
            tutorialCtx.beginPath();
            tutorialCtx.moveTo(x, 0);
            tutorialCtx.lineTo(x, tutorialCanvas.height);
            tutorialCtx.stroke();
        }
        for (let y = 0; y < tutorialCanvas.height; y += gridSize) {
            tutorialCtx.beginPath();
            tutorialCtx.moveTo(0, y);
            tutorialCtx.lineTo(tutorialCanvas.width, y);
            tutorialCtx.stroke();
        }
    }

    tutorialCtx.globalAlpha = 1.0;
}

// Draw contour lines for progressive visualization (supports different contexts)
function drawContourLinesProgressive(contourIndices, strokeColor, lineWidth, detailLevel, targetCtx) {
    // Use provided context or default to tutorial context
    const ctx = targetCtx || tutorialCtx;
    
    // Set line style
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Adjust line width if not explicitly provided
    if (!lineWidth || lineWidth === undefined) {
        lineWidth = detailLevel === 'basic' ? 3 : 
                   detailLevel === 'outline' ? 2.5 : 
                   detailLevel === 'object' ? 2 : 
                   detailLevel === 'detailed' ? 1.5 : 2;
    }
    ctx.lineWidth = lineWidth;
    
    // Draw each contour as a smooth path
    contourIndices.forEach(contourIdx => {
        if (contourIdx >= 0 && contourIdx < edgeContours.length) {
            const contour = edgeContours[contourIdx];
            
            if (!contour || contour.length < 2) return; // Need at least 2 points
            
            // Start path
            ctx.beginPath();
            
            // Move to first point
            const [firstX, firstY] = contour[0];
            ctx.moveTo(firstX, firstY);
            
            // Draw smooth curve through points
            if (contour.length === 2) {
                // Simple line for 2 points
                const [x, y] = contour[1];
                ctx.lineTo(x, y);
            } else {
                // Draw smooth lines connecting all points
                for (let i = 1; i < contour.length; i++) {
                    const [x, y] = contour[i];
                    
                    if (i === 1) {
                        // First segment: line to second point
                        ctx.lineTo(x, y);
                    } else {
                        // Use previous point as control for smooth curve
                        const [prevX, prevY] = contour[i - 1];
                        const midX = (prevX + x) / 2;
                        const midY = (prevY + y) / 2;
                        ctx.quadraticCurveTo(prevX, prevY, midX, midY);
                    }
                }
                // Close the path smoothly if it's a closed contour
                const [lastX, lastY] = contour[contour.length - 1];
                const [firstX2, firstY2] = contour[0];
                const dist = Math.sqrt(Math.pow(lastX - firstX2, 2) + Math.pow(lastY - firstY2, 2));
                if (dist < 5) {
                    // Close the contour
                    ctx.closePath();
                }
            }
            
            // Stroke the path
            ctx.stroke();
        }
    });
}


// Navigation functions
function nextStep() {
    if (currentStepIndex < tutorialSteps.length - 1) {
        displayStep(currentStepIndex + 1);
    }
    // All contours should be captured in initial generation - no "Add More Detail" needed
}

function previousStep() {
    if (currentStepIndex > 0) {
        displayStep(currentStepIndex - 1);
    }
}

function resetApp() {
    tutorialSteps = [];
    currentStepIndex = 0;
    originalImage = null;
    imageData = null;
    edgeContours = [];
    window.currentSegmentation = null;
    
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    tutorialCtx.clearRect(0, 0, tutorialCanvas.width, tutorialCanvas.height);
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
}

// UI helper functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'block';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

