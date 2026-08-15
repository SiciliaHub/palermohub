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

  document.addEventListener('DOMContentLoaded', function () {
    wire(document.querySelector('#sidebar > .sidebar-content'), document.getElementById('sidebar-left-totop'));
    wire(document.querySelector('#sidebar-right > .sidebar-content'), document.getElementById('sidebar-right-totop'));
    wire(document.getElementById('modal-basemap-help'), document.getElementById('guida-totop'));
  });
})();
