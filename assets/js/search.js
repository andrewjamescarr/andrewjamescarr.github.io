/**
 * Client-side search for the user guide
 * Provides fast, instant search across page content including:
 * - Section titles and headings
 * - Content snippets
 * - Keyboard navigation support
 * 
 * @module Search
 */
(function() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) return;

  /**
   * Converts text to URL-friendly slug
   * Removes special characters, converts to lowercase, replaces spaces with hyphens
   * 
   * @param {string} text - Text to slugify
   * @returns {string} URL-friendly slug
   * @example
   * slugify("How to Work") // Returns: "how-to-work"
   */
  function slugify(text) {
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
  function ensureHeadingIds() {
    const headings = document.querySelectorAll('.main-sections h2, .main-sections h3, .main-sections h4');
    headings.forEach(heading => {
      if (heading.id) return;
      const base = slugify(heading.textContent || 'section');
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
  function buildSearchIndex() {
    ensureHeadingIds();
    const index = [];

    /**
     * Gets the parent section title for a heading
     * Looks for accordion parent or returns 'Overview'
     * 
     * @param {HTMLElement} heading - The heading element
     * @returns {string} Section title
     */
    function getSectionTitle(heading) {
      const accordion = heading.closest('.accordion');
      if (accordion) {
        const summary = accordion.querySelector('.accordion-summary h2');
        if (summary) return summary.textContent.trim();
      }
      return 'Overview';
    }

    function getAnchorElement(heading) {
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
    }

    /**
     * Extracts a text snippet from content after a heading
     * Collects text from next sibling elements up to 200 characters
     * 
     * @param {HTMLElement} heading - The heading element
     * @returns {string} Content snippet (max 200 chars)
     */
    function getContentSnippet(heading) {
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
    }

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

  const searchIndex = buildSearchIndex();

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
  function search(query) {
    if (!query || query.length < 2) {
      return [];
    }
    
    const queryLower = query.toLowerCase();
    const results = [];
    
    searchIndex.forEach(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();
      const sectionLower = item.section.toLowerCase();
      
      // Exact title match = highest score
      if (titleLower === queryLower) {
        score += 100;
      } else if (titleLower.includes(queryLower)) {
        score += 50;
      }
      
      // Section match
      if (sectionLower.includes(queryLower)) {
        score += 20;
      }
      
      // Content match
      if (contentLower.includes(queryLower)) {
        score += 10;
      }
      
      // Word boundary matches
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
    
    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10); // Top 10 results
  }

  /**
   * Displays search results in the results container
   * Renders clickable result items with section path and content snippet
   * Shows "No results found" message when results array is empty
   * 
   * @param {SearchIndexItem[]} results - Array of search results with scores
   * @returns {void}
   */
  function displayResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-title">No results found</div></div>';
      searchResults.classList.remove('hidden');
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
    
    searchResults.innerHTML = html;
    searchResults.classList.remove('hidden');
    
    // Add click handlers to results
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
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

        searchResults.classList.add('hidden');
        searchInput.value = '';
      });
    });
  }

  /**
   * Handles search input with debouncing and keyboard navigation
   * Debounces search queries by 200ms to avoid excessive processing
   * Tracks highlighted result index for arrow key navigation
   */
  let searchTimeout;
  let currentHighlightedIndex = -1;

  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length < 2) {
      searchResults.classList.add('hidden');
      currentHighlightedIndex = -1;
      return;
    }
    
    searchTimeout = setTimeout(() => {
      const results = search(query);
      displayResults(results);
      currentHighlightedIndex = -1;
    }, 200);
  });

  /**
   * Handles keyboard navigation within search results
   * - ArrowDown: Move to next result
   * - ArrowUp: Move to previous result
   * - Enter: Navigate to highlighted result
   * - Escape: Close results panel
   */
  searchInput.addEventListener('keydown', function(e) {
    if (!searchResults.classList.contains('hidden')) {
      const items = Array.from(searchResults.querySelectorAll('.search-result-item'));
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentHighlightedIndex = Math.min(currentHighlightedIndex + 1, items.length - 1);
        updateHighlight(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentHighlightedIndex = Math.max(currentHighlightedIndex - 1, -1);
        updateHighlight(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentHighlightedIndex >= 0 && items[currentHighlightedIndex]) {
          items[currentHighlightedIndex].click();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        searchResults.classList.add('hidden');
        currentHighlightedIndex = -1;
      }
    }
  });

  /**
   * Updates visual highlighting of search results
   * Applies 'highlighted' class to currently selected item and scrolls it into view
   * 
   * @param {HTMLElement[]} items - Array of search result item elements
   * @returns {void}
   */
  function updateHighlight(items) {
    items.forEach((item, index) => {
      if (index === currentHighlightedIndex) {
        item.classList.add('highlighted');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('highlighted');
      }
    });
  }


  // Hide results when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add('hidden');
    }
  });

  // Show results when focusing on search input if there's a query
  searchInput.addEventListener('focus', function() {
    if (this.value.trim().length >= 2) {
      searchResults.classList.remove('hidden');
    }
  });
})();
