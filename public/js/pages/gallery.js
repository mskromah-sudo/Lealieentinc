// Gallery page module: sets up lazy loading for images and background images
(function () {
  // Lazy-load helper for <img data-src>
  const supportsNative = 'loading' in HTMLImageElement.prototype;

  function loadImg(img) {
    if (!img) return;
    const src = img.dataset.src;
    if (!src) return;
    // set up a small onload class
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.src = src;
    img.removeAttribute('data-src');
  }

  function handleBackground(el) {
    const src = el.dataset.bg;
    if (!src) return;
    el.style.backgroundImage = `url('${src}')`;
    el.classList.add('bg-loaded');
    el.removeAttribute('data-bg');
  }

  export function initGallery() {
    const imgs = Array.from(document.querySelectorAll('img[data-src]'));
    const bgs = Array.from(document.querySelectorAll('[data-bg]'));

    if (supportsNative) {
      imgs.forEach(img => {
        img.loading = 'lazy';
        loadImg(img);
      });
      bgs.forEach(handleBackground);
      return;
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.tagName === 'IMG') {
              loadImg(el);
            } else {
              handleBackground(el);
            }
            observer.unobserve(el);
          }
        });
      }, { rootMargin: '200px' });

      imgs.forEach(img => io.observe(img));
      bgs.forEach(el => io.observe(el));
      return;
    }

    // Fallback: eager load
    imgs.forEach(loadImg);
    bgs.forEach(handleBackground);
  }

  // Auto-init when module loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
  } else {
    initGallery();
  }
})();
