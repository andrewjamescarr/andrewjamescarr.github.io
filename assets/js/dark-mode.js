/**
 * Dark mode toggle with localStorage persistence
 * Manages theme switching between light and dark modes with support for:
 * - User preference persistence via localStorage
 * - System preference detection (prefers-color-scheme)
 * - Automatic syncing with system theme changes
 * 
 * @module DarkMode
 */

/**
 * Dark mode theme manager
 * Provides toggle functionality with localStorage and system preference support
 */
class DarkMode {
  /**
   * Initializes the dark mode manager
   * Sets up toggle button, applies initial theme, and listens for changes
   */
  constructor() {
    this.themeToggle = document.querySelector('.theme-toggle');
    this.html = document.documentElement;
    
    if (!this.themeToggle) return;
    
    this.initialize();
  }

  /**
   * Initializes theme and event listeners
   * @returns {void}
   */
  initialize() {
    const initialTheme = this.getInitialTheme();
    this.setTheme(initialTheme);
    
    this.themeToggle.addEventListener('click', () => {
      const current = this.html.classList.contains('dark-mode') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
    });
    
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /**
   * Gets the initial theme preference
   * Priority order:
   * 1. Saved localStorage preference
   * 2. System preference (prefers-color-scheme)
   * 3. Default to 'light'
   * 
   * @returns {'light'|'dark'} The initial theme to use
   */
  getInitialTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Sets the theme and updates UI elements
   * Updates:
   * - HTML class ('dark-mode')
   * - Toggle button icon and title
   * - localStorage preference
   * 
   * @param {'light'|'dark'} theme - The theme to apply
   * @returns {void}
   */
  setTheme(theme) {
    if (theme === 'dark') {
      this.html.classList.add('dark-mode');
      this.themeToggle.textContent = '☀️';
      this.themeToggle.title = 'Switch to light mode';
    } else {
      this.html.classList.remove('dark-mode');
      this.themeToggle.textContent = '🌙';
      this.themeToggle.title = 'Switch to dark mode';
    }
    localStorage.setItem('theme', theme);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DarkMode();
});
