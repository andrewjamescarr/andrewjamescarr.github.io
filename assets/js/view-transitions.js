// View Transitions API - Smooth animated transitions between sections

class ViewTransitions {
  constructor() {
    this.supported = 'startViewTransition' in document;
    
    if (this.supported) {
      this.setupTransitions();
    }
  }

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
