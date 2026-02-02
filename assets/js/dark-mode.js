/**
 * Dark mode toggle with localStorage persistence
 * Manages theme switching between light and dark modes with support for:
 * - User preference persistence via localStorage
 * - System preference detection (prefers-color-scheme)
 * - Automatic syncing with system theme changes
 * 
 * @module DarkMode
 */
(function() {
  const themeToggle = document.querySelector('.theme-toggle');
  const html = document.documentElement;
  
  if (!themeToggle) return;

  /**
   * Gets the initial theme preference
   * Priority order:
   * 1. Saved localStorage preference
   * 2. System preference (prefers-color-scheme)
   * 3. Default to 'light'
   * 
   * @returns {'light'|'dark'} The initial theme to use
   */
  function getInitialTheme() {
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
   */
  function setTheme(theme) {
    if (theme === 'dark') {
      html.classList.add('dark-mode');
      themeToggle.textContent = '☀️';
      themeToggle.title = 'Switch to light mode';
    } else {
      html.classList.remove('dark-mode');
      themeToggle.textContent = '🌙';
      themeToggle.title = 'Switch to dark mode';
    }
    localStorage.setItem('theme', theme);
  }

  // Initialize theme
  const initialTheme = getInitialTheme();
  setTheme(initialTheme);

  // Toggle on click
  themeToggle.addEventListener('click', () => {
    const current = html.classList.contains('dark-mode') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
