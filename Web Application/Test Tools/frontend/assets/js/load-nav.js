/**
 * Shared sidebar nav loader.
 * Injects nav links into #sidebar-nav and highlights the active link.
 * Each page that uses this must have <nav id="sidebar-nav"> inside <aside id="sidebar">.
 */
(function () {
  const NAV_HTML = `
    <a href="/" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors mb-1"><i class="fas fa-home w-4 text-center text-xs"></i><span>Dashboard</span></a>
    <a href="/tools/mock-server" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-server w-4 text-center text-xs"></i><span>Mock Server</span></a>
    <div class="pt-4 pb-1 px-3"><span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tools</span></div>
    <a href="/tools/aes-encryption" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-lock w-4 text-center text-xs"></i><span>AES Encryption</span></a>
    <a href="/tools/json-converter" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-code w-4 text-center text-xs"></i><span>JSON Converter</span></a>
    <a href="/tools/base64-pdf" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-file-pdf w-4 text-center text-xs"></i><span>Base64 &#8644; PDF</span></a>
    <a href="/tools/pdf-base64" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-file-export w-4 text-center text-xs"></i><span>PDF &#8594; Base64</span></a>
    <a href="/tools/mini_postman" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-paper-plane w-4 text-center text-xs"></i><span>Mini Postman</span></a>
    <div class="pt-4 pb-1 px-3"><span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">eSignature</span></div>
    <div class="pt-2 pb-0.5 pl-5 pr-3"><span class="text-xs font-medium text-gray-700 uppercase tracking-wider">E-Forms</span></div>
    <a href="/forms/claim-form-a-patient" class="flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-file-alt w-4 text-center text-xs"></i><span>Claim Form A Patient</span></a>
    <a href="/forms/fast-track" class="flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-bolt w-4 text-center text-xs"></i><span>Fast Track</span></a>
    <a href="/forms/medical-expense-opd" class="flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-file-invoice-dollar w-4 text-center text-xs"></i><span>Medical Expense OPD</span></a>
    <a href="/forms/medical-expense-ipd" class="flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-file-invoice-dollar w-4 text-center text-xs"></i><span>Medical Expense IPD</span></a>
    <div class="pt-2 pb-0.5 pl-5 pr-3"><span class="text-xs font-medium text-gray-700 uppercase tracking-wider">eDocSign</span></div>
    <a href="/tools/url-generator" class="flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-list w-4 text-center text-xs"></i><span>DocList (Web Portal)</span></a>
    <div class="pt-4 pb-1 px-3"><span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">BURT</span></div>
    <a href="/forms/auto-login-burt" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors"><i class="fas fa-id-card w-4 text-center text-xs"></i><span>Auto Login BURT</span></a>
  `;

  function activateCurrentLink(nav) {
    nav.querySelectorAll("a[href]").forEach(function (a) {
      if (a.pathname === window.location.pathname) {
        a.classList.remove("text-gray-400", "hover:text-white", "hover:bg-gray-800");
        a.classList.add("bg-blue-600", "text-white");
      }
    });
  }

  function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
    document.getElementById("sidebar-overlay").classList.toggle("hidden");
  }

  function closeSidebar() {
    document.getElementById("sidebar").classList.add("-translate-x-full");
    document.getElementById("sidebar-overlay").classList.add("hidden");
  }

  // Expose sidebar toggle functions globally (used by inline onclick in HTML)
  window.toggleSidebar = toggleSidebar;
  window.closeSidebar = closeSidebar;

  function init() {
    var nav = document.getElementById("sidebar-nav");
    if (!nav) return;
    nav.innerHTML = NAV_HTML;
    activateCurrentLink(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
