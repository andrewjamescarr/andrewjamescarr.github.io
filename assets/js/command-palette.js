// Command Palette - Quick navigation with Cmd+K or Ctrl+K

class CommandPalette {
  constructor() {
    this.paletteEl = document.getElementById('command-palette');
    this.inputEl = document.getElementById('command-palette-input');
    this.resultsEl = document.getElementById('command-palette-results');
    this.backdropEl = document.getElementById('command-palette-backdrop');
    this.commands = [];
    this.highlightedIndex = -1;
    
    this.buildCommandIndex();
    this.setupEventListeners();
  }

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
  }

  open() {
    this.paletteEl.classList.add('active');
    this.inputEl.value = '';
    this.inputEl.focus();
    this.filterCommands('');
  }

  close() {
    this.paletteEl.classList.remove('active');
    this.highlightedIndex = -1;
  }

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

  fuzzyMatch(str, query) {
    let queryIdx = 0;
    for (let i = 0; i < str.length && queryIdx < query.length; i++) {
      if (str[i] === query[queryIdx]) queryIdx++;
    }
    return queryIdx === query.length;
  }

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
