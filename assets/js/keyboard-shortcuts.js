/**
 * @module KeyboardShortcuts
 * 
 * Displays keyboard shortcuts help modal triggered by '?' key
 * Shows all available keyboard shortcuts with icons and descriptions
 */

/**
 * Keyboard shortcuts help modal controller
 * Manages display of keyboard shortcut reference modal
 */
class KeyboardShortcuts {
  /**
   * Initializes the keyboard shortcuts help modal
   * Sets up DOM references, shortcut list, and event listeners
   */
  constructor() {
    this.helpEl = document.getElementById('keyboard-help');
    this.backdropEl = document.getElementById('keyboard-help-backdrop');
    this.closeBtn = document.querySelector('[data-help-close]');
    
    this.shortcuts = [
      { keys: 'Cmd/Ctrl + K', action: 'Open command palette', icon: '⌨️' },
      { keys: '?', action: 'Show this help', icon: '❓' },
      { keys: '/', action: 'Focus search', icon: '🔍' },
      { keys: 'Escape', action: 'Close any modal', icon: '⎋' },
      { keys: '↑ / ↓', action: 'Navigate results', icon: '⬆️' },
      { keys: 'Enter', action: 'Select result', icon: '↩️' },
    ];

    this.setupEventListeners();
  }

  /**
   * Attaches event listeners for help modal triggers
   * Handles '?' key, backdrop clicks, close button, and ESC key
   * 
   * @returns {void}
   */
  setupEventListeners() {
    // Trigger: ? key (without modifier, and not in input)
    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in input/textarea
      if (e.target.matches('input, textarea')) return;
      
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        this.toggle();
      }
    });

    // Close on backdrop click
    this.backdropEl?.addEventListener('click', () => this.close());

    // Close on close button
    this.closeBtn?.addEventListener('click', () => this.close());

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.helpEl?.classList.contains('active')) {
        this.close();
      }
    });
  }

  /**
   * Toggles the help modal open/closed
   * 
   * @returns {void}
   */
  toggle() {
    if (this.helpEl.classList.contains('active')) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Opens the help modal
   * Adds 'active' class and prevents body scrolling
   * 
   * @returns {void}
   */
  open() {
    this.helpEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the help modal
   * Removes 'active' class and restores body scrolling
   * 
   * @returns {void}
   */
  close() {
    this.helpEl.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new KeyboardShortcuts();
});
