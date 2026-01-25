// Simple client-side search for the user guide
(function() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) return;

  // Build search index from page content
  function buildSearchIndex() {
    const index = [];
    
    // Index all accordion sections
    document.querySelectorAll('.accordion').forEach(accordion => {
      const summary = accordion.querySelector('.accordion-summary h2');
      const sectionTitle = summary ? summary.textContent.trim() : '';
      
      // Index all subsections within the accordion
      accordion.querySelectorAll('h3, h4').forEach(heading => {
        const headingText = heading.textContent.trim();
        const headingId = heading.id || '';
        
        // Get text content near this heading
        let content = '';
        let sibling = heading.nextElementSibling;
        let count = 0;
        
        while (sibling && count < 3) {
          if (sibling.tagName === 'P' || sibling.tagName === 'UL' || sibling.tagName === 'OL') {
            content += ' ' + sibling.textContent;
            count++;
          }
          if (sibling.tagName === 'H3' || sibling.tagName === 'H4' || sibling.tagName === 'H2') {
            break;
          }
          sibling = sibling.nextElementSibling;
        }
        
        index.push({
          section: sectionTitle,
          title: headingText,
          content: content.substring(0, 200),
          id: headingId,
          element: heading
        });
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
        <div class="search-result-item" data-id="${result.id}">
          <div class="search-result-title">${result.section} → ${result.title}</div>
          <div class="search-result-snippet">${snippet}</div>
        </div>
      `;
    }).join('');
    
    searchResults.innerHTML = html;
    searchResults.classList.remove('hidden');
    
    // Add click handlers to results
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        if (id) {
          const element = document.getElementById(id);
          if (element) {
            // Open the accordion if it's inside one
            const accordion = element.closest('.accordion');
            if (accordion && !accordion.hasAttribute('open')) {
              accordion.setAttribute('open', 'true');
            }
            
            // Scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Hide search results
            searchResults.classList.add('hidden');
            searchInput.value = '';
          }
        }
      });
    });
  }

  // Handle search input
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length < 2) {
      searchResults.classList.add('hidden');
      return;
    }
    
    searchTimeout = setTimeout(() => {
      const results = search(query);
      displayResults(results);
    }, 200);
  });

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
