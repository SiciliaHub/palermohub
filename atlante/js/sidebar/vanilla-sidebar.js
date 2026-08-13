/**
 * Sidebar control — vanilla JS puro (nessuna dipendenza jQuery, nessun L.DomUtil/L.DomEvent/L.Mixin.Events).
 * Stessa API pubblica di leaflet-sidebar.js: L.control.sidebar(id).addTo(map), .open(id), .close(), .on(type, fn).
 * Markup/CSS attesi invariati: .sidebar, .sidebar-tabs > ul > li, .sidebar-content > .sidebar-pane, .sidebar-close.
 */
(function (global) {
  function SidebarControl(id, options) {
    this.options = Object.assign({ position: 'left' }, options);
    this._sidebar = document.getElementById(id);
    this._listeners = {};

    this._sidebar.classList.add('sidebar-' + this.options.position);

    this._container = Array.from(this._sidebar.children)
      .find(function (child) { return child.tagName === 'DIV' && child.classList.contains('sidebar-content'); });

    this._tabItems = Array.from(
      this._sidebar.querySelectorAll('.sidebar-tabs > ul > li, ul.sidebar-tabs > li')
    );

    this._panes = [];
    this._closeButtons = [];
    Array.from(this._container.children).forEach(function (child) {
      if (child.tagName === 'DIV' && child.classList.contains('sidebar-pane')) {
        this._panes.push(child);
        child.querySelectorAll('.sidebar-close').forEach(function (btn) {
          this._closeButtons.push(btn);
        }, this);
      }
    }, this);
  }

  SidebarControl.prototype.addTo = function (map) {
    this._map = map;

    this._tabItems.forEach(function (li) {
      var a = li.querySelector('a');
      if (!a || !a.getAttribute('href') || a.getAttribute('href').charAt(0) !== '#') return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (li.classList.contains('disabled')) return;
        var id = a.getAttribute('href').slice(1);
        li.classList.contains('active') ? this.close() : this.open(id);
      }.bind(this));
    }, this);

    this._closeButtons.forEach(function (btn) {
      btn.addEventListener('click', this.close.bind(this));
    }, this);

    return this;
  };

  SidebarControl.prototype.open = function (id) {
    this._panes.forEach(function (pane) {
      pane.classList.toggle('active', pane.id === id);
    });

    this._tabItems.forEach(function (li) {
      var a = li.querySelector('a');
      li.classList.toggle('active', !!a && a.getAttribute('href') === '#' + id);
    });

    this._fire('content', { id: id });

    if (this._sidebar.classList.contains('collapsed')) {
      this._fire('opening');
      this._sidebar.classList.remove('collapsed');
    }

    return this;
  };

  SidebarControl.prototype.close = function () {
    this._tabItems.forEach(function (li) {
      li.classList.remove('active');
    });

    if (!this._sidebar.classList.contains('collapsed')) {
      this._fire('closing');
      this._sidebar.classList.add('collapsed');
    }

    return this;
  };

  SidebarControl.prototype.on = function (type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
    return this;
  };

  SidebarControl.prototype._fire = function (type, data) {
    (this._listeners[type] || []).forEach(function (fn) { fn(data || {}); });
  };

  global.L = global.L || {};
  global.L.control = global.L.control || {};
  global.L.control.sidebar = function (id, options) {
    return new SidebarControl(id, options);
  };
})(window);
