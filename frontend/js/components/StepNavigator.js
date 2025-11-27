/**
 * Step Navigator Component
 * 
 * Additional navigation utilities for tutorial steps.
 */

(function () {
    'use strict';

    // Progress tracking
    const completedSteps = new Set();

    function markStepComplete(stepNumber) {
        completedSteps.add(stepNumber);
        saveProgress();
    }

    function saveProgress() {
        if (typeof tutorialData !== 'undefined') {
            localStorage.setItem(
                `tutorial_${tutorialData.id}_progress`,
                JSON.stringify(Array.from(completedSteps))
            );
        }
    }

    function loadProgress() {
        if (typeof tutorialData !== 'undefined') {
            const saved = localStorage.getItem(`tutorial_${tutorialData.id}_progress`);
            if (saved) {
                const steps = JSON.parse(saved);
                steps.forEach(step => completedSteps.add(step));
            }
        }
    }

    // Load progress on init
    loadProgress();

    // Export functions
    window.TutorialNavigator = {
        markComplete: markStepComplete,
        getProgress: () => Array.from(completedSteps)
    };
})();
