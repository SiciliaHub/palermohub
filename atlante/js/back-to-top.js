(function () {
  'use strict';

  var SHOW_THRESHOLD = 200;

  function wire(scrollEl, btn) {
    if (!scrollEl || !btn) return;

    function update() {
      if (scrollEl.scrollTop > SHOW_THRESHOLD) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    scrollEl.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', function () {
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    });
    update();
  }

  function wireToc(modalEl) {
    if (!modalEl) return;
    var toc = modalEl.querySelector('.guida-toc');
    if (!toc) return;
    toc.addEventListener('click', function (e) {
      var link = e.target.closest('a.guida-toc-item');
      if (!link) return;
      var target = modalEl.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wire(document.querySelector('#sidebar > .sidebar-content'), document.getElementById('sidebar-left-totop'));
    wire(document.querySelector('#sidebar-right > .sidebar-content'), document.getElementById('sidebar-right-totop'));
    wire(document.getElementById('modal-basemap-help'), document.getElementById('guida-totop'));
    wireToc(document.getElementById('modal-basemap-help'));
  });
})();
