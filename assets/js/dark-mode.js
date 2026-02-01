// Dark mode toggle with localStorage persistence
(function() {
  const themeToggle = document.querySelector('.theme-toggle');
  const html = document.documentElement;
  
  if (!themeToggle) return;

  // Check for saved preference or system preference
  function getInitialTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

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
