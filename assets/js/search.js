/**
 * Client-side search for the user guide
 * Provides fast, instant search across page content including:
 * - Section titles and headings
 * - Content snippets
 * - Keyboard navigation support
 * 
 * @module Search
 */
class Search {
  /**
   * Initializes the Search module
   * Sets up DOM elements, builds search index, and configures event listeners
   */
  constructor() {
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    
    if (!this.searchInput || !this.searchResults) return;

    this.searchTimeout = null;
    this.currentHighlightedIndex = -1;
    this.indexReady = false;
    
    this.searchIndex = [];
    this.scheduleIndexBuild();
    this.setupEventListeners();
  }

  /**
   * Schedules search index building during idle time
   * Falls back to a timeout when requestIdleCallback is unavailable
   * 
   * @returns {void}
   */
  scheduleIndexBuild() {
    const build = () => {
      this.searchIndex = this.buildSearchIndex();
      this.indexReady = true;
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(build, { timeout: 1000 });
    } else {
      setTimeout(build, 0);
    }
  }

  /**
   * Ensures the search index is ready before querying
   * 
   * @returns {void}
   */
  ensureIndexReady() {
    if (this.indexReady) return;
    this.searchIndex = this.buildSearchIndex();
    this.indexReady = true;
  }

  /**
   * Toggles search results visibility and accessibility attributes
   * 
   * @param {boolean} isVisible - Whether the results should be visible
   * @returns {void}
   */
  setResultsVisibility(isVisible) {
    this.searchResults.classList.toggle('hidden', !isVisible);
    this.searchResults.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    this.searchInput.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
  }

  /**
   * Converts text to URL-friendly slug
   * Removes special characters, converts to lowercase, replaces spaces with hyphens
   * 
   * @param {string} text - Text to slugify
   * @returns {string} URL-friendly slug
   * @example
   * slugify("How to Work") // Returns: "how-to-work"
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Ensures all headings in the document have unique IDs
   * Generates IDs from heading text if missing
   * Handles duplicates by appending numbers
   * 
   * @returns {void}
   */
  ensureHeadingIds() {
    const headings = document.querySelectorAll('.main-sections h2, .main-sections h3, .main-sections h4');
    headings.forEach(heading => {
      if (heading.id) return;
      const base = this.slugify(heading.textContent || 'section');
      if (!base) return;

      let candidate = base;
      let counter = 2;
      while (document.getElementById(candidate)) {
        candidate = `${base}-${counter}`;
        counter += 1;
      }
      heading.id = candidate;
    });
  }

  /**
   * @typedef {Object} SearchIndexItem
   * @property {string} section - The parent section name
   * @property {string} title - The heading title
   * @property {string} content - Content snippet (max 200 chars)
   * @property {string} id - The anchor ID for linking
   * @property {HTMLElement} element - Reference to the DOM element
   */

  /**
   * Builds the search index from page content
   * Indexes all h2, h3, h4 headings with their content snippets
   * 
   * @returns {SearchIndexItem[]} Array of indexed items
   */
  buildSearchIndex() {
    this.ensureHeadingIds();
    const index = [];

    const getSectionTitle = (heading) => {
      const accordion = heading.closest('.accordion');
      if (accordion) {
        const summary = accordion.querySelector('.accordion-summary h2');
        if (summary) return summary.textContent.trim();
      }
      return 'Overview';
    };

    const getAnchorElement = (heading) => {
      if (heading.id) return heading;

      const summary = heading.closest('.accordion-summary');
      if (summary) {
        const accordion = heading.closest('.accordion');
        const firstSection = accordion ? accordion.querySelector('.accordion-content section[id]') : null;
        if (firstSection) return firstSection;
      }

      const section = heading.closest('section[id]');
      if (section) return section;

      const ancestorWithId = heading.closest('[id]');
      return ancestorWithId || null;
    };

    const getContentSnippet = (heading) => {
      const summary = heading.closest('.accordion-summary');
      if (summary) {
        const accordion = heading.closest('.accordion');
        const content = accordion ? accordion.querySelector('.accordion-content') : null;
        return content ? content.textContent.trim().substring(0, 200) : '';
      }

      let content = '';
      let sibling = heading.nextElementSibling;
      let count = 0;

      while (sibling && count < 3) {
        if (sibling.tagName === 'P' || sibling.tagName === 'UL' || sibling.tagName === 'OL') {
          content += ' ' + sibling.textContent;
          count++;
        }
        if (sibling.tagName === 'H2' || sibling.tagName === 'H3' || sibling.tagName === 'H4') {
          break;
        }
        sibling = sibling.nextElementSibling;
      }

      return content.trim().substring(0, 200);
    };

    document.querySelectorAll('.main-sections h2, .main-sections h3, .main-sections h4').forEach(heading => {
      const headingText = heading.textContent.trim();
      const anchorElement = getAnchorElement(heading);
      if (!anchorElement || !anchorElement.id) return;

      index.push({
        section: getSectionTitle(heading),
        title: headingText,
        content: getContentSnippet(heading),
        id: anchorElement.id,
        element: anchorElement
      });
    });

    return index;
  }

  /**
   * Performs search query against indexed content with scoring algorithm
   * 
   * Scoring system:
   * - Exact title match: 100 points
   * - Title contains query: 50 points
   * - Section contains query: 20 points
   * - Content contains query: 10 points
   * - Individual word matches: 5 points (title), 2 points (content)
   * 
   * @param {string} query - The search query text
   * @returns {SearchIndexItem[]} Matching results sorted by score (descending)
   */
  search(query) {
    if (!query || query.length < 2) {
      return [];
    }

    this.ensureIndexReady();
    
    const queryLower = query.toLowerCase();
    const results = [];
    
    this.searchIndex.forEach(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();
      const sectionLower = item.section.toLowerCase();
      
      if (titleLower === queryLower) {
        score += 100;
      } else if (titleLower.includes(queryLower)) {
        score += 50;
      }
      
      if (sectionLower.includes(queryLower)) {
        score += 20;
      }
      
      if (contentLower.includes(queryLower)) {
        score += 10;
      }
      
      const words = queryLower.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          if (titleLower.includes(word)) score += 5;
          if (contentLower.includes(word)) score += 2;
        }
      });
      
      if (score > 0) {
        results.push({ ...item, score });
      }
    });
    
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }

  /**
   * Displays search results in the results container
   * Renders clickable result items with section path and content snippet
   * Shows "No results found" message when results array is empty
   * 
   * @param {SearchIndexItem[]} results - Array of search results with scores
   * @returns {void}
   */
  displayResults(results) {
    if (results.length === 0) {
      this.searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-title">No results found</div></div>';
      this.setResultsVisibility(true);
      return;
    }
    
    const html = results.map(result => {
      const snippet = result.content.substring(0, 120).trim() + '...';
      return `
        <button class="search-result-item" type="button" data-id="${result.id}">
          <div class="search-result-title">${result.section} → ${result.title}</div>
          <div class="search-result-snippet">${snippet}</div>
        </button>
      `;
    }).join('');
    
    this.searchResults.innerHTML = html;
    this.setResultsVisibility(true);
    
    this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        if (!id) return;

        const element = document.getElementById(id);
        if (!element) return;

        const accordion = element.closest('.accordion');
        if (accordion) {
          accordion.setAttribute('open', 'true');
        }

        if (history && history.replaceState) {
          history.replaceState(null, '', `#${id}`);
        } else {
          window.location.hash = id;
        }

        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);

        this.setResultsVisibility(false);
        this.searchInput.value = '';
      });
    });
  }

  /**
   * Updates visual highlighting of search results
   * Applies 'highlighted' class to currently selected item and scrolls it into view
   * 
   * @param {HTMLElement[]} items - Array of search result item elements
   * @returns {void}
   */
  updateHighlight(items) {
    items.forEach((item, index) => {
      if (index === this.currentHighlightedIndex) {
        item.classList.add('highlighted');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('highlighted');
      }
    });
  }

  /**
   * Sets up event listeners for search input and document interactions
   * 
   * @returns {void}
   */
  setupEventListeners() {
    this.searchInput.addEventListener('input', () => {
      clearTimeout(this.searchTimeout);
      const query = this.searchInput.value.trim();
      
      if (query.length < 2) {
        this.setResultsVisibility(false);
        this.currentHighlightedIndex = -1;
        return;
      }
      
      this.searchTimeout = setTimeout(() => {
        const results = this.search(query);
        this.displayResults(results);
        this.currentHighlightedIndex = -1;
      }, 200);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (!this.searchResults.classList.contains('hidden')) {
        const items = Array.from(this.searchResults.querySelectorAll('.search-result-item'));
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.currentHighlightedIndex = Math.min(this.currentHighlightedIndex + 1, items.length - 1);
          this.updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.currentHighlightedIndex = Math.max(this.currentHighlightedIndex - 1, -1);
          this.updateHighlight(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.currentHighlightedIndex >= 0 && items[this.currentHighlightedIndex]) {
            items[this.currentHighlightedIndex].click();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.setResultsVisibility(false);
          this.currentHighlightedIndex = -1;
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
        this.setResultsVisibility(false);
      }
    });

    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.trim().length >= 2) {
        this.setResultsVisibility(true);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new Search();
});
