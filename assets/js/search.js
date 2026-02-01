// Simple client-side search for the user guide
(function() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) return;

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

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

  // Build search index from page content
  function buildSearchIndex() {
    ensureHeadingIds();
    const index = [];

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

  // Perform search
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

  // Display search results
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

  // Handle search input
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
