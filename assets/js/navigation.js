/**
 * @module Navigation
 * 
 * Side navigation enhancements: active section highlight, accordion opening, mobile drawer
 * Handles scroll-based active link highlighting and mobile navigation menu
 */
(function() {
  const nav = document.querySelector('.side-nav');
  if (!nav) return;

  const toggleButton = document.querySelector('.nav-toggle');
  const closeButton = document.querySelector('.nav-close');
  const backdrop = document.querySelector('.nav-backdrop');
  const body = document.body;

  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  if (links.length === 0) return;

  const sections = Array.from(document.querySelectorAll('section[id], #top'));
  const linkById = new Map();

  /**
   * Opens the mobile navigation drawer
   * Adds 'nav-open' class to body and updates ARIA attributes
   * 
   * @returns {void}
   */
  function openNav() {
    if (!toggleButton) return;
    body.classList.add('nav-open');
    toggleButton.setAttribute('aria-expanded', 'true');
  }

  /**
   * Closes the mobile navigation drawer
   * Removes 'nav-open' class from body and updates ARIA attributes
   * 
   * @returns {void}
   */
  function closeNav() {
    if (!toggleButton) return;
    body.classList.remove('nav-open');
    toggleButton.setAttribute('aria-expanded', 'false');
  }

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      if (body.classList.contains('nav-open')) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeNav);
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeNav);
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeNav();
  });

  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    const id = decodeURIComponent(href.replace('#', '')).trim();
    if (id) linkById.set(id, link);

    link.addEventListener('click', () => {
      const target = document.getElementById(id);
      if (target) {
        const accordion = target.closest('.accordion');
        if (accordion && !accordion.hasAttribute('open')) {
          accordion.setAttribute('open', 'true');
        }
      }
      setActive(id);
      closeNav();
    });
  });

  /**
   * Sets the active navigation link by ID
   * Removes 'active' class from all links, then applies to specified link
   * 
   * @param {string} id - The section ID to mark as active
   * @returns {void}
   */
  function setActive(id) {
    links.forEach(link => link.classList.remove('active'));
    const activeLink = linkById.get(id);
    if (activeLink) activeLink.classList.add('active');
  }

  /**
   * Finds the currently active section based on scroll position
   * Uses 140px offset to determine which section is in view
   * 
   * @returns {HTMLElement|null} The active section element or null
   */
  function findActiveSection() {
    const offset = 140;
    let active = null;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top - offset <= 0 && rect.bottom > offset) {
        active = section;
      }
    });

    return active;
  }

  /**
   * Handles scroll events with requestAnimationFrame throttling
   * Updates active link highlighting based on current scroll position
   * 
   * @returns {void}
   */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const activeSection = findActiveSection();
      if (activeSection && activeSection.id) {
        setActive(activeSection.id);
      }
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent((window.location.hash || '').replace('#', '')).trim();
    if (id) setActive(id);
  });

  onScroll();
})();
