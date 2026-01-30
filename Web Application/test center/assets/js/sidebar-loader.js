/**
 * Sidebar Loader - Dynamically builds sidebar navigation from JSON config
 * 
 * Usage:
 * 1. Include this script at the bottom of your HTML: <script src="assets/js/sidebar-loader.js"></script>
 * 2. Add a container: <div id="sidebar-content"></div>
 * 
 * The script automatically:
 * - Loads navigation.json
 * - Builds the sidebar HTML
 * - Highlights the active page
 * - Handles path differences (root vs subfolders)
 */

(function() {
  'use strict';

  // Determine base path based on current page location
  function getBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length;
    
    // Check if we're in a subdirectory (tools/, forms/, etc.)
    if (path.includes('/tools/') || path.includes('/forms/') || 
        path.includes('/components/') || path.includes('/charts/') ||
        path.includes('/tables/') || path.includes('/maps/')) {
      return '../';
    }
    return '';
  }

  // Get current page filename for active highlighting
  function getCurrentPage() {
    const path = window.location.pathname;
    // Handle both /page.html and /folder/page.html
    const match = path.match(/([^\/]+\.html?)$/) || path.match(/\/([^\/]+)\/?$/);
    return match ? match[1] : 'index.html';
  }

  // Check if href matches current page
  function isActivePage(href) {
    const currentPath = window.location.pathname;
    // Normalize both paths for comparison
    const hrefPage = href.replace(/^\.\.\//, '').replace(/^\.\//, '');
    return currentPath.endsWith(hrefPage) || 
           currentPath.endsWith('/' + hrefPage) ||
           (currentPath.endsWith('/') && hrefPage === 'index.html');
  }

  // Build menu item HTML
  function buildMenuItem(item, basePath) {
    const href = basePath + item.href;
    const isActive = isActivePage(item.href);
    return `
      <li${isActive ? ' class="active"' : ''}>
        <a href="${href}">
          <span class="sub-item">${item.title}</span>
        </a>
      </li>
    `;
  }

  // Build menu section HTML
  function buildMenuSection(section, basePath) {
    const hasActiveItem = section.items.some(item => isActivePage(item.href));
    const isExpanded = section.expanded || hasActiveItem;
    
    const itemsHtml = section.items.map(item => buildMenuItem(item, basePath)).join('');
    
    return `
      <li class="nav-item${hasActiveItem ? ' active' : ''}${isExpanded ? ' submenu' : ''}">
        <a data-bs-toggle="collapse" href="#${section.id}"${isExpanded ? '' : ' class="collapsed"'} aria-expanded="${isExpanded}">
          <i class="${section.icon}"></i>
          <p>${section.title}</p>
          <span class="caret"></span>
        </a>
        <div class="collapse${isExpanded ? ' show' : ''}" id="${section.id}">
          <ul class="nav nav-collapse">
            ${itemsHtml}
          </ul>
        </div>
      </li>
    `;
  }

  // Build divider section HTML
  function buildDivider(section) {
    return `
      <li class="nav-section">
        <span class="sidebar-mini-icon">
          <i class="fa fa-ellipsis-h"></i>
        </span>
        <h4 class="text-section">${section.title}</h4>
      </li>
    `;
  }

  // Build complete sidebar HTML
  function buildSidebar(config, basePath) {
    let html = '<ul class="nav nav-secondary">';
    
    for (const section of config.sections) {
      if (section.type === 'menu') {
        html += buildMenuSection(section, basePath);
      } else if (section.type === 'divider') {
        html += buildDivider(section);
      }
    }
    
    html += '</ul>';
    return html;
  }

  // Load navigation config and render sidebar
  async function loadSidebar() {
    const basePath = getBasePath();
    const configPath = basePath + 'assets/config/navigation.json';
    
    try {
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load navigation config: ${response.status}`);
      }
      
      const config = await response.json();
      const sidebarHtml = buildSidebar(config, basePath);
      
      // Insert into sidebar-content container
      const container = document.getElementById('sidebar-content');
      if (container) {
        container.innerHTML = sidebarHtml;
      } else {
        console.warn('Sidebar container #sidebar-content not found');
      }
      
    } catch (error) {
      console.error('Error loading sidebar:', error);
      // Fallback: show error message in sidebar
      const container = document.getElementById('sidebar-content');
      if (container) {
        container.innerHTML = '<p class="text-danger p-3">Failed to load navigation</p>';
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
  } else {
    loadSidebar();
  }

})();
