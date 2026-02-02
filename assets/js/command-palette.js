/**
 * @module CommandPalette
 * 
 * Quick navigation command palette with Cmd+K or Ctrl+K trigger
 * Provides fuzzy search for sections and special actions (theme toggle, search, scroll to top)
 */

/**
 * Command palette for quick navigation and actions
 * Supports keyboard shortcuts (Cmd+K / Ctrl+K) and fuzzy search
 */
class CommandPalette {
  /**
   * Initializes the command palette
   * Sets up DOM references, builds command index, and attaches event listeners
   */
  constructor() {
    this.paletteEl = document.getElementById('command-palette');
    this.inputEl = document.getElementById('command-palette-input');
    this.resultsEl = document.getElementById('command-palette-results');
    this.backdropEl = document.getElementById('command-palette-backdrop');
    this.commands = [];
    this.highlightedIndex = -1;
    this.lastActiveElement = null;
    this.boundTrapFocus = (event) => this.trapFocus(event);
    
    this.buildCommandIndex();
    this.setupEventListeners();
  }

  /**
   * Builds the command index from navigation links and special actions
   * Creates command objects with id, title, emoji, type, and action properties
   * 
   * @returns {void}
   */
  buildCommandIndex() {
    this.commands = [];

    // Add all sections from navigation
    document.querySelectorAll('.nav-group a').forEach(link => {
      const href = link.getAttribute('href');
      const label = link.textContent.trim();
      const emoji = label.match(/[\p{Emoji}]/u)?.[0] || '';
      const title = label.replace(/[\p{Emoji}]/gu, '').trim();

      this.commands.push({
        id: href,
        title: title,
        emoji: emoji,
        type: 'section',
        action: () => this.navigateToSection(href)
      });
    });

    // Add special commands
    this.commands.push(
      {
        id: 'theme-toggle',
        title: 'Toggle dark mode',
        emoji: '🌙',
        type: 'action',
        action: () => {
          document.querySelector('.theme-toggle').click();
          this.close();
        }
      },
      {
        id: 'back-to-top',
        title: 'Back to top',
        emoji: '↑',
        type: 'action',
        action: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.close();
        }
      },
      {
        id: 'search-focus',
        title: 'Open search',
        emoji: '🔍',
        type: 'action',
        action: () => {
          document.getElementById('search-input').focus();
          this.close();
        }
      }
    );
  }

  /**
   * Attaches event listeners for keyboard shortcuts and user interactions
   * Handles Cmd+K / Ctrl+K trigger, search input, keyboard navigation, backdrop clicks
   * 
   * @returns {void}
   */
  setupEventListeners() {
    // Trigger: Cmd+K or Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
      }
    });

    // Search input
    this.inputEl.addEventListener('input', (e) => {
      this.filterCommands(e.target.value);
    });

    // Keyboard navigation
    this.inputEl.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // Close on backdrop click
    this.backdropEl.addEventListener('click', () => this.close());

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.paletteEl.classList.contains('active')) {
        this.close();
      }
    });

    this.paletteEl.addEventListener('keydown', this.boundTrapFocus);
  }

  /**
   * Opens the command palette
   * Clears input, focuses search, and displays initial results
   * 
   * @returns {void}
   */
  open() {
    this.lastActiveElement = document.activeElement;
    this.paletteEl.classList.add('active');
    this.paletteEl.setAttribute('aria-hidden', 'false');
    this.backdropEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.inputEl.value = '';
    this.inputEl.focus();
    this.filterCommands('');
  }

  /**
   * Closes the command palette
   * Removes active class and resets highlighted index
   * 
   * @returns {void}
   */
  close() {
    this.paletteEl.classList.remove('active');
    this.paletteEl.setAttribute('aria-hidden', 'true');
    this.backdropEl.classList.remove('active');
    document.body.style.overflow = '';
    this.highlightedIndex = -1;
    if (this.lastActiveElement && typeof this.lastActiveElement.focus === 'function') {
      this.lastActiveElement.focus();
    }
  }

  /**
   * Filters commands based on search query
   * Uses exact match, starts with, includes, and fuzzy matching with scoring
   * 
   * @param {string} query - The search query text
   * @returns {void}
   */
  filterCommands(query) {
    const normalized = query.toLowerCase();
    
    if (!query.trim()) {
      // Show recent/favorite commands if search is empty
      this.displayResults(this.commands.slice(0, 8));
      return;
    }

    // Score and sort results
    const scored = this.commands
      .map(cmd => {
        let score = 0;
        const cmdTitle = cmd.title.toLowerCase();
        
        // Exact match
        if (cmdTitle === normalized) score = 1000;
        // Starts with
        else if (cmdTitle.startsWith(normalized)) score = 500;
        // Includes
        else if (cmdTitle.includes(normalized)) score = 100;
        // Fuzzy match (each char in order)
        else if (this.fuzzyMatch(cmdTitle, normalized)) score = 25;

        return { ...cmd, score };
      })
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    this.displayResults(scored);
  }

  /**
   * Performs fuzzy string matching
   * Checks if all characters of query appear in str in the correct order
   * 
   * @param {string} str - The string to search in
   * @param {string} query - The query pattern
   * @returns {boolean} True if fuzzy match succeeds
   */
  fuzzyMatch(str, query) {
    let queryIdx = 0;
    for (let i = 0; i < str.length && queryIdx < query.length; i++) {
      if (str[i] === query[queryIdx]) queryIdx++;
    }
    return queryIdx === query.length;
  }

  /**
   * Displays filtered command results in the palette
   * Renders result items with emoji, highlighted title, and type badge
   * 
   * @param {Object[]} results - Array of command objects to display
   * @returns {void}
   */
  displayResults(results) {
    this.highlightedIndex = -1;
    this.resultsEl.innerHTML = '';
    this.currentResults = results;

    if (results.length === 0) {
      this.resultsEl.innerHTML = '<div class="palette-no-results">No commands found</div>';
      return;
    }

    results.forEach((cmd, idx) => {
      const item = document.createElement('button');
      item.className = 'palette-result-item';
      item.type = 'button';
      item.dataset.index = idx;
      item.innerHTML = `
        <span class="palette-result-emoji">${cmd.emoji || '•'}</span>
        <span class="palette-result-title">${this.highlightMatch(cmd.title, this.inputEl.value)}</span>
        <span class="palette-result-type">${cmd.type}</span>
      `;

      item.addEventListener('click', () => this.executeCommand(cmd));
      this.resultsEl.appendChild(item);
    });
  }

  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.split('').join('.*?')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  handleKeydown(e) {
    const items = this.resultsEl.querySelectorAll('.palette-result-item');
    const count = items.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.highlightedIndex = (this.highlightedIndex + 1) % count;
        this.updateHighlight(items);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.highlightedIndex = (this.highlightedIndex - 1 + count) % count;
        this.updateHighlight(items);
        break;

      case 'Enter':
        e.preventDefault();
        if (this.highlightedIndex >= 0 && this.currentResults) {
          this.executeCommand(this.currentResults[this.highlightedIndex]);
        }
        break;
    }
  }

  updateHighlight(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('highlighted', idx === this.highlightedIndex);
      if (idx === this.highlightedIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  /**
   * Gets focusable elements within a container
   * 
   * @param {HTMLElement} container - Container to search for focusable elements
   * @returns {HTMLElement[]} Array of focusable elements
   */
  getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
  }

  /**
   * Traps focus within the command palette when open
   * 
   * @param {KeyboardEvent} event - Keydown event
   * @returns {void}
   */
  trapFocus(event) {
    if (event.key !== 'Tab' || !this.paletteEl.classList.contains('active')) return;

    const focusables = this.getFocusableElements(this.paletteEl);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  selectCommand(index, results) {
    const items = this.resultsEl.querySelectorAll('.palette-result-item');
    if (items[index]) {
      items[index].click();
    }
  }

  executeCommand(cmd) {
    if (cmd && cmd.action) {
      cmd.action();
    }
  }

  navigateToSection(href) {
    const target = document.querySelector(href);
    if (target) {
      // Open accordion if needed
      const accordion = target.closest('.accordion');
      if (accordion && !accordion.hasAttribute('open')) {
        accordion.setAttribute('open', '');
        // Wait for accordion to open before scrolling
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        // Scroll immediately if no accordion
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      this.close();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CommandPalette();
});
