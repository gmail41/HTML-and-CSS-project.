// Runs in <head> before first paint: opt the page into scroll motion so
// content waits in its pre-reveal state instead of flashing. If main.js
// never confirms (blocked or failed), fall back to the static page.
(function () {
  var d = document.documentElement;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  d.classList.add('motion');
  setTimeout(function () {
    if (!d.classList.contains('motion-ready')) d.classList.remove('motion');
  }, 2500);
})();
