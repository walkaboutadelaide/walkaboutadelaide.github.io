/* Lightweight image lightbox — click any gallery / body photo to view it
 * full screen (Chirpy-style). Vanilla JS, zero dependencies, works offline
 * and over file://. Keyboard: Esc closes, ← / → navigate a gallery.
 */
(function () {
  'use strict';

  var SEL = '.walk-photo img, .article-body img, .post-content img';
  var overlay, imgEl, capEl, prevBtn, nextBtn, group = [], idx = 0, lastFocus = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');
    overlay.innerHTML =
      '<button class="lb-close" aria-label="Close (Esc)">&times;</button>' +
      '<button class="lb-nav lb-prev" aria-label="Previous image">&#10094;</button>' +
      '<figure class="lb-figure">' +
        '<img class="lb-img" alt="">' +
        '<figcaption class="lb-cap"></figcaption>' +
      '</figure>' +
      '<button class="lb-nav lb-next" aria-label="Next image">&#10095;</button>';
    document.body.appendChild(overlay);
    imgEl = overlay.querySelector('.lb-img');
    capEl = overlay.querySelector('.lb-cap');
    prevBtn = overlay.querySelector('.lb-prev');
    nextBtn = overlay.querySelector('.lb-next');

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('lb-close') ||
          e.target.classList.contains('lb-figure')) {
        close();
      } else if (e.target.classList.contains('lb-prev')) {
        show(idx - 1);
      } else if (e.target.classList.contains('lb-next')) {
        show(idx + 1);
      }
    });
  }

  function open(list, i) {
    if (!overlay) build();
    group = list;
    lastFocus = document.activeElement;
    document.body.classList.add('lb-lock');
    overlay.classList.add('open');
    show(i);
    document.addEventListener('keydown', onKey);
    overlay.querySelector('.lb-close').focus();
  }

  function close() {
    overlay.classList.remove('open');
    document.body.classList.remove('lb-lock');
    document.removeEventListener('keydown', onKey);
    imgEl.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function show(i) {
    if (i < 0) i = group.length - 1;
    if (i >= group.length) i = 0;
    idx = i;
    var src = group[i].currentSrc || group[i].src;
    imgEl.src = src;
    var cap = group[i].getAttribute('alt') || group[i].getAttribute('title') || '';
    capEl.textContent = cap;
    capEl.style.display = cap ? '' : 'none';
    var multi = group.length > 1;
    prevBtn.style.display = multi ? '' : 'none';
    nextBtn.style.display = multi ? '' : 'none';
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var img = e.target.closest(SEL);
    if (!img) return;
    if (img.closest('a')) return;          // leave linked images as links
    e.preventDefault();
    var container = img.closest('.walk-photos') ||
                    img.closest('.article-body') ||
                    img.closest('.post-content');
    var list = container
      ? Array.prototype.slice.call(container.querySelectorAll(SEL))
      : [img];
    var start = list.indexOf(img);
    if (start === -1) { list = [img]; start = 0; }
    open(list, start);
  });
})();
