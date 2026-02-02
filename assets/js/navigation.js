/**
 * @module Navigation
 * 
 * Side navigation enhancements: active section highlight, accordion opening, mobile drawer
 * Handles scroll-based active link highlighting and mobile navigation menu
 */

/**
 * Navigation manager
 * Provides scroll-based active link highlighting and mobile drawer functionality
 */
class Navigation {
  /**
   * Initializes the navigation manager
   * Sets up event listeners and initial state
   */
  constructor() {
    this.nav = document.querySelector('.side-nav');
    if (!this.nav) return;

    this.toggleButton = document.querySelector('.nav-toggle');
    this.closeButton = document.querySelector('.nav-close');
    this.backdrop = document.querySelector('.nav-backdrop');
    this.body = document.body;

    this.links = Array.from(this.nav.querySelectorAll('a[href^="#"]'));
    if (this.links.length === 0) return;

    this.sections = Array.from(document.querySelectorAll('section[id], #top'));
    this.linkById = new Map();
    this.ticking = false;
    
    this.setupEventListeners();
  }

  /**
   * Sets up all event listeners for navigation
   * @returns {void}
   */
  setupEventListeners() {
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggleNav());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.closeNav());
    }
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.closeNav());
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeNav();
    });

    this.links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const id = decodeURIComponent(href.replace('#', '')).trim();
      if (id) this.linkById.set(id, link);

      link.addEventListener('click', () => {
        const target = document.getElementById(id);
        if (target) {
          const accordion = target.closest('.accordion');
          if (accordion && !accordion.hasAttribute('open')) {
            accordion.setAttribute('open', 'true');
          }
        }
        this.setActive(id);
        this.closeNav();
      });
    });

    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    window.addEventListener('resize', () => this.onScroll());
    window.addEventListener('hashchange', () => {
      const id = decodeURIComponent((window.location.hash || '').replace('#', '')).trim();
      if (id) this.setActive(id);
    });

    this.onScroll();
  }

  /**
   * Toggles the mobile navigation drawer
   * @returns {void}
   */
  toggleNav() {
    if (this.body.classList.contains('nav-open')) {
      this.closeNav();
    } else {
      this.openNav();
    }
  }

  /**
   * Opens the mobile navigation drawer
   * Adds 'nav-open' class to body and updates ARIA attributes
   * 
   * @returns {void}
   */
  openNav() {
    if (!this.toggleButton) return;
    this.body.classList.add('nav-open');
    this.toggleButton.setAttribute('aria-expanded', 'true');
  }

  /**
   * Closes the mobile navigation drawer
   * Removes 'nav-open' class from body and updates ARIA attributes
   * 
   * @returns {void}
   */
  closeNav() {
    if (!this.toggleButton) return;
    this.body.classList.remove('nav-open');
    this.toggleButton.setAttribute('aria-expanded', 'false');
  }

  /**
   * Sets the active navigation link by ID
   * Removes 'active' class from all links, then applies to specified link
   * 
   * @param {string} id - The section ID to mark as active
   * @returns {void}
   */
  setActive(id) {
    this.links.forEach(link => link.classList.remove('active'));
    const activeLink = this.linkById.get(id);
    if (activeLink) activeLink.classList.add('active');
  }

  /**
   * Finds the currently active section based on scroll position
   * Uses 140px offset to determine which section is in view
   * 
   * @returns {HTMLElement|null} The active section element or null
   */
  findActiveSection() {
    const offset = 140;
    let active = null;

    this.sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top - offset <= 0 && rect.bottom > offset) {
        active = section;
      }
    });

    return active;
  }

  /**
   * Handles scroll events with requestAnimationFrame throttling
   * Updates active link highlighting based on current scroll position
   * 
   * @returns {void}
   */
  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    window.requestAnimationFrame(() => {
      const activeSection = this.findActiveSection();
      if (activeSection && activeSection.id) {
        this.setActive(activeSection.id);
      }
      this.ticking = false;
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Navigation();
});
