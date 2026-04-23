/* RideTo Course Finder — embeddable popup loader
 * --------------------------------------------------
 * Drop-in usage on any external site:
 *
 *   <button class="_3LLaL4ReQcarEQlcPJnphk">Take quiz now</button>
 *   <script src="https://YOUR-DOMAIN/embed.js" async></script>
 *
 * By default it wires up any element with:
 *   - class "_3LLaL4ReQcarEQlcPJnphk"
 *   - or attribute  data-rideto-finder
 *
 * To target a different selector, set window.RideToFinder before loading,
 * or add  data-selector="..."  on the script tag:
 *
 *   <script src="https://YOUR-DOMAIN/embed.js"
 *           data-selector=".my-cta-button"
 *           async></script>
 */
(function () {
  if (window.__rideToFinderLoaded) return;
  window.__rideToFinderLoaded = true;

  // --- Resolve config -------------------------------------------------------
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  // Origin where /embed lives — derived from this script's src.
  var scriptSrc = currentScript ? currentScript.src : "";
  var origin = scriptSrc ? new URL(scriptSrc, window.location.href).origin : window.location.origin;
  var embedUrl = origin + "/embed";

  var customSelector =
    (currentScript && currentScript.getAttribute("data-selector")) ||
    (window.RideToFinder && window.RideToFinder.selector) ||
    "";

  var defaultSelector = "._3LLaL4ReQcarEQlcPJnphk, [data-rideto-finder]";
  var selector = customSelector ? customSelector + ", " + defaultSelector : defaultSelector;

  // --- Overlay management ---------------------------------------------------
  var overlay = null;
  var iframe = null;

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.setAttribute("data-rideto-overlay", "");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647", // top of the stacking context
      "background:rgba(0,0,0,0.6)",
      "display:none",
      "opacity:0",
      "transition:opacity 200ms ease",
    ].join(";");

    iframe = document.createElement("iframe");
    iframe.setAttribute("title", "RideTo Course Finder");
    iframe.setAttribute("allow", "clipboard-write");
    iframe.style.cssText = [
      "position:absolute",
      "inset:0",
      "width:100%",
      "height:100%",
      "border:0",
      "background:transparent",
    ].join(";");
    iframe.setAttribute("allowtransparency", "true");
    iframe.src = embedUrl;

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
  }

  function openFinder() {
    if (!overlay) buildOverlay();
    // Reload the iframe each time so the quiz starts fresh.
    if (iframe.src !== embedUrl) iframe.src = embedUrl;
    else iframe.contentWindow && iframe.contentWindow.location.replace(embedUrl);

    overlay.style.display = "block";
    // next frame -> trigger transition
    requestAnimationFrame(function () {
      overlay.style.opacity = "1";
    });
    document.documentElement.style.overflow = "hidden";
  }

  function closeFinder() {
    if (!overlay) return;
    overlay.style.opacity = "0";
    setTimeout(function () {
      overlay.style.display = "none";
      document.documentElement.style.overflow = "";
    }, 200);
  }

  // --- Wire host-page triggers ---------------------------------------------
  function wireTriggers(root) {
    var nodes = (root || document).querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.__rideToBound) continue;
      el.__rideToBound = true;
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openFinder();
      });
    }
  }

  // Initial pass + observe DOM for buttons added later (SPAs, lazy renders).
  function init() {
    wireTriggers(document);
    if (window.MutationObserver) {
      new MutationObserver(function () {
        wireTriggers(document);
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // --- Listen for messages from the iframe ---------------------------------
  window.addEventListener("message", function (event) {
    if (!event.data || typeof event.data !== "object") return;
    if (event.origin !== origin) return;
    if (event.data.type === "rideto:close") closeFinder();
  });

  // --- Public API ----------------------------------------------------------
  window.RideToFinder = Object.assign(window.RideToFinder || {}, {
    open: openFinder,
    close: closeFinder,
    selector: selector,
  });
})();
