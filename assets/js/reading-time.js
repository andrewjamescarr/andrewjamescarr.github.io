/**
 * @module ReadingTime
 * 
 * Calculates and displays reading time badges for accordion sections
 * Uses 200 words per minute as the reading speed estimate
 */

/**
 * Reading time calculator
 * Adds estimated reading time badges to accordion sections
 */
class ReadingTime {
  /**
   * Initializes the reading time calculator
   * Finds all accordions and adds reading time badges
   */
  constructor() {
    this.WPM = 200; // Words per minute
    this.calculateAndDisplay();
  }

  /**
   * Calculates reading times for all accordions
   * @returns {void}
   */
  calculateAndDisplay() {
    const accordions = document.querySelectorAll('.accordion');
    
    accordions.forEach(accordion => {
      const summary = accordion.querySelector('.accordion-summary h2');
      const content = accordion.querySelector('.accordion-content');
      
      if (!summary || !content) return;

      const readingTime = this.calculateTime(content);
      this.addBadge(summary, readingTime, content);
    });
  }

  /**
   * Calculates reading time in minutes
   * @param {HTMLElement} contentEl - The content element to measure
   * @returns {number} Reading time in minutes (minimum 1)
   */
  calculateTime(contentEl) {
    const text = contentEl.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(wordCount / this.WPM));
  }

  /**
   * Adds reading time badge to a heading
   * @param {HTMLElement} headingEl - The heading element
   * @param {number} readingTime - Reading time in minutes
   * @param {HTMLElement} contentEl - The content element (for word count title)
   * @returns {void}
   */
  addBadge(headingEl, readingTime, contentEl) {
    const text = contentEl.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    
    const badge = document.createElement('span');
    badge.className = 'reading-time';
    badge.textContent = `${readingTime} min`;
    badge.title = `~${wordCount} words`;
    
    headingEl.appendChild(badge);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ReadingTime();
});
