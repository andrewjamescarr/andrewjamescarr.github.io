/**
 * @module ViewTransitions
 * 
 * View Transitions API - Smooth animated transitions between sections
 * Uses browser's native view transitions for smooth navigation and accordion animations
 */

/**
 * Manages view transitions for page navigation
 * Provides smooth animated transitions between sections using View Transitions API
 */
class ViewTransitions {
  /**
   * Initializes the view transitions handler
   * Checks browser support and sets up transition listeners
   */
  constructor() {
    this.supported = 'startViewTransition' in document;
    
    if (this.supported) {
      this.setupTransitions();
    }
  }

  /**
   * Sets up click event listeners for transitions
   * Intercepts navigation and accordion clicks to apply view transitions
   * 
   * @returns {void}
   */
  setupTransitions() {
    // Intercept all navigation within the page
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      e.preventDefault();
      this.navigateWithTransition(href);
    });

    // Also hook into accordion clicks
    document.addEventListener('click', (e) => {
      const accordion = e.target.closest('.accordion');
      if (accordion) {
        this.performTransition();
      }
    });
  }

  /**
   * Navigates to target with view transition animation
   * Uses View Transitions API if supported, falls back to direct navigation
   * 
   * @param {string} href - The hash href to navigate to
   * @returns {void}
   */
  navigateWithTransition(href) {
    const target = document.querySelector(href);
    if (!target) return;

    if (this.supported) {
      document.startViewTransition(() => {
        this.performNavigation(target, href);
      });
    } else {
      this.performNavigation(target, href);
    }
  }

  /**
   * Performs the actual navigation logic
   * Opens accordion if needed, updates URL hash, and scrolls to target
   * 
   * @param {HTMLElement} target - The target element to navigate to
   * @param {string} href - The hash href for URL update
   * @returns {void}
   */
  performNavigation(target, href) {
    // Open accordion if needed
    const accordion = target.closest('.accordion');
    if (accordion && !accordion.hasAttribute('open')) {
      accordion.setAttribute('open', '');
    }

    // Update URL hash
    window.history.pushState(null, '', href);

    // Scroll to target
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Performs a view transition for accordion interactions
   * Placeholder for accordion-specific transition effects
   * 
   * @returns {void}
   */
  performTransition() {
    if (this.supported) {
      // Simple transition for accordions
      // The view transition will handle the visual update
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ViewTransitions();
});
