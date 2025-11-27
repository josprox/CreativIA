# Layered Image Processing Pipeline

## Overview

The AI Drawing Tutorial Generator now uses a **layered image processing pipeline** with OpenCV.js to significantly improve contour detection quality and figure integrity.

## Architecture

### Processing Layers

The image processing follows a three-layer pipeline:

1. **Layer 1 (RGB)**: Original color image data
   - Preserves full color information for context
   - Used as input for subsequent layers

2. **Layer 2 (Grayscale)**: Color-to-grayscale conversion
   - Eliminates color variance
   - Simplifies contrast data for edge detection
   - Reduces computational complexity

3. **Layer 3 (Binary/Threshold)**: Binary image creation
   - Applies **Otsu's Thresholding** (default) for automatic optimal threshold selection
   - Alternative: **Adaptive Thresholding** for images with varying lighting
   - Creates sharp black/white boundaries defining main figure from background
   - Provides high-contrast input for contour extraction

### Edge Detection

After binary conversion, **Canny edge detection** is applied to extract clean, continuous edges from the binary image. This produces superior results compared to Sobel-based methods because:

- Binary images have clear foreground/background separation
- Canny edge detection uses hysteresis thresholding for better edge continuity
- Reduces spurious lines and noise

## Implementation Details

### OpenCV.js Integration

- **Library**: OpenCV.js (loaded via CDN)
- **Location**: `index.html` - OpenCV.js script tag
- **Initialization**: Automatic detection and fallback to TensorFlow.js if unavailable

### Key Functions

1. **`processLayeredImageOpenCV(imageData, width, height)`**
   - Main layered processing function
   - Converts RGB → Grayscale → Binary
   - Returns binary image data and edge array

2. **`extractEdgesFromBinary(binaryMat, width, height)`**
   - Applies Canny edge detection to binary image
   - Converts OpenCV Mat to boolean edge array
   - Optimized parameters: low=50, high=150

3. **Fallback Mechanism**
   - If OpenCV.js is unavailable, falls back to TensorFlow.js Sobel edge detection
   - Ensures application always works, even without OpenCV.js

## Benefits

1. **Cleaner Contours**: Binary thresholding eliminates color-based noise
2. **Complete Strokes**: Better edge detection from high-contrast binary images
3. **Figure Integrity**: Otsu's method automatically finds optimal threshold for figure/background separation
4. **Reduced Spurious Lines**: Binary processing removes internal texture details that aren't part of the outline
5. **Better Edge Continuity**: Canny edge detection on binary images produces more connected edges

## Configuration

### Thresholding Method

By default, **Otsu's Thresholding** is used. To switch to **Adaptive Thresholding**, modify `app.js`:

```javascript
const useAdaptive = true; // Change to true in processLayeredImageOpenCV function
```

**When to use Adaptive Thresholding:**
- Images with uneven lighting
- Images with shadows
- When Otsu's produces poor results

**When to use Otsu's (default):**
- Images with clear foreground/background
- Most standard images
- When you want automatic threshold selection

## Dependencies

- **OpenCV.js**: Loaded via CDN (no npm installation required for browser use)
- **TensorFlow.js**: Fallback edge detection (already included)
- **package.json**: Documents project structure (npm not strictly required for CDN approach)

## Usage

The layered processing is automatically applied when an image is uploaded. No user configuration needed - the system automatically:

1. Detects if OpenCV.js is available
2. Uses layered processing if available
3. Falls back to TensorFlow.js if OpenCV.js is unavailable
4. Processes through all three layers
5. Extracts contours from the binary image

## Technical Notes

- OpenCV.js is loaded asynchronously to avoid blocking page load
- Memory management: All OpenCV Mat objects are properly deleted to prevent leaks
- The binary image is converted back to ImageData format for compatibility
- Edge extraction uses Canny algorithm with optimized parameters for binary images

