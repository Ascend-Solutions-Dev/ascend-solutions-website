// GitHub Pages serves this repository directly from its root. The application
// build serves the same interaction code from `public/`.
(() => {
  const script = document.createElement("script");
  script.src = "/public/site-interactions.js";
  script.defer = true;
  document.head.append(script);
})();
