/**
 * Tutorial Viewer Component
 * 
 * Displays tutorial steps with navigation.
 */

(function () {
    'use strict';

    if (typeof tutorialData === 'undefined') return;

    const stepImage = document.getElementById('stepImage');
    const stepTitle = document.getElementById('stepTitle');
    const stepDescription = document.getElementById('stepDescription');
    const stepInstructions = document.getElementById('stepInstructions');
    const currentStepEl = document.getElementById('currentStep');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const thumbnails = document.querySelectorAll('.thumbnail');

    let currentStep = 0;
    const steps = tutorialData.steps;

    // Initialize
    showStep(0);

    // Previous button
    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    });

    // Next button
    nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
            showStep(currentStep + 1);
        }
    });

    // Thumbnail clicks
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            showStep(index);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentStep > 0) {
            showStep(currentStep - 1);
        } else if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
            showStep(currentStep + 1);
        }
    });

    function showStep(index) {
        const step = steps[index];

        // Update image
        stepImage.src = step.image_path;

        // Update info
        stepTitle.textContent = step.title;
        stepDescription.textContent = step.description;
        stepInstructions.innerHTML = step.instructions || '';

        // Update current step indicator
        currentStepEl.textContent = index + 1;

        // Update buttons
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === steps.length - 1;

        // Update thumbnails
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // Update current step
        currentStep = index;

        // Smooth scroll to active thumbnail
        if (thumbnails[index]) {
            thumbnails[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
})();
