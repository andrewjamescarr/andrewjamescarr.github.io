// Calculate and display reading time for accordion sections
(function() {
  const accordions = document.querySelectorAll('.accordion');
  
  accordions.forEach(accordion => {
    const summary = accordion.querySelector('.accordion-summary h2');
    const content = accordion.querySelector('.accordion-content');
    
    if (!summary || !content) return;

    // Count words in content
    const text = content.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    
    // Estimate reading time (200 words per minute)
    const readingTime = Math.max(1, Math.round(wordCount / 200));
    
    // Create and append reading time badge
    const badge = document.createElement('span');
    badge.className = 'reading-time';
    badge.textContent = `${readingTime} min`;
    badge.title = `~${wordCount} words`;
    
    summary.appendChild(badge);
  });
})();
