/**
 * Layout Manager
 * Fetches and injects reusable layout components (Sidebar, Navbar, Footer, etc.)
 */

document.addEventListener("DOMContentLoaded", function () {
  const loadComponent = (id, url, callback) => {
    const element = document.getElementById(id);
    if (element) {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
          }
          return response.text();
        })
        .then((html) => {
          element.outerHTML = html;
          if (callback) callback();
        })
        .catch((error) => console.error("Error loading component:", error));
    }
  };

  // Load components and initialize Kaiadmin JS after they are loaded
  let componentsLoaded = 0;
  const totalComponents = 4;

  const onComponentLoaded = () => {
    componentsLoaded++;
    if (componentsLoaded === totalComponents) {
      // Re-trigger any scripts that need to bind to the newly injected elements
      // like the toggle sidebar functionality from kaiadmin
      if (typeof jQuery !== 'undefined') {
        // Trigger a custom event in case kaiadmin script needs to re-initialize
        $(document).trigger('layoutLoaded');
      }
    }
  };

  loadComponent("layout-sidebar", "/components/layout/sidebar.html", onComponentLoaded);
  loadComponent("layout-navbar", "/components/layout/navbar.html", onComponentLoaded);
  loadComponent("layout-footer", "/components/layout/footer.html", onComponentLoaded);
  loadComponent("layout-custom-template", "/components/layout/custom-template.html", onComponentLoaded);
});
