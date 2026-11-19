// Invito a installare «PNRR Italia · Atlante dei progetti» come app (con il suo logo).
// Chrome/Edge/Samsung: `beforeinstallprompt` tenuto da parte, aperto solo al tocco su «Installa».
// Safari iPhone/iPad: si spiega il gesto «Condividi → Aggiungi alla schermata Home».
// «Non ora» = riposo 14 giorni (localStorage). App già installata = nessun invito.
(function () {
  var CHIAVE = 'atlante-pnrr-installa-no', GIORNI = 14, ATTESA = 3000;
  var ICONA = '/atlante_pnrr_app/icon-192.png';

  var installata = function () {
    return window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches ||
      navigator.standalone === true;
  };
  var inRiposo = function () {
    try { var q = Number(localStorage.getItem(CHIAVE)); return q > 0 && Date.now() - q < GIORNI * 864e5; }
    catch (e) { return false; }
  };
  var riposo = function () { try { localStorage.setItem(CHIAVE, String(Date.now())); } catch (e) {} };

  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var safari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

  if (installata() || inRiposo()) return;

  var invito = null, box = null;

  var stile = document.createElement('style');
  stile.textContent =
    '.atl-installa{position:fixed;z-index:2000;right:16px;bottom:16px;max-width:360px;display:flex;gap:12px;' +
    'align-items:flex-start;padding:14px 16px;background:#fff;color:#2b2b2b;border:1px solid #d9d4c4;' +
    'border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);font:14px/1.45 Arial,sans-serif}' +
    '.atl-installa img{width:48px;height:48px;border-radius:10px;flex:none}' +
    '.atl-installa p{margin:0 0 10px}.atl-installa b{display:block;margin-bottom:2px}' +
    '.atl-installa button{font:600 14px Arial,sans-serif;padding:7px 14px;border-radius:9px;cursor:pointer;' +
    'border:1px solid #c9c3ad;background:#fff;color:#333;margin-right:8px}' +
    '.atl-installa button.si{background:#0c1c33;border-color:#0c1c33;color:#fff}' +
    '@media(max-width:480px){.atl-installa{left:12px;right:12px;bottom:12px;max-width:none}}';

  function chiudi() { if (box) { box.remove(); box = null; } }

  function mostra() {
    if (box || installata() || inRiposo()) return;
    if (!invito && !(ios && safari)) return;
    document.head.appendChild(stile);
    box = document.createElement('section');
    box.className = 'atl-installa';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Installa l’app');

    var img = document.createElement('img');
    img.src = ICONA; img.alt = ''; img.width = 48; img.height = 48;

    var corpo = document.createElement('div');
    var p = document.createElement('p');
    var t = document.createElement('b'); t.textContent = 'Atlante PNRR';
    p.appendChild(t);
    p.appendChild(document.createTextNode(invito
      ? 'Installa l’Atlante dei progetti PNRR come app: si apre a schermo intero, senza le barre del browser.'
      : 'Per installare l’Atlante PNRR: tocca Condividi, poi «Aggiungi alla schermata Home».'));
    corpo.appendChild(p);

    if (invito) {
      var si = document.createElement('button');
      si.type = 'button'; si.className = 'si'; si.textContent = 'Installa';
      si.addEventListener('click', function () {
        var ev = invito; invito = null; chiudi();
        try {
          ev.prompt();
          ev.userChoice.then(function (r) { if (r.outcome !== 'accepted') riposo(); });
        } catch (e) { riposo(); }
      });
      corpo.appendChild(si);
    }
    var no = document.createElement('button');
    no.type = 'button'; no.textContent = invito ? 'Non ora' : 'Ho capito';
    no.addEventListener('click', function () { riposo(); chiudi(); });
    corpo.appendChild(no);

    box.appendChild(img); box.appendChild(corpo);
    document.body.appendChild(box);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); invito = e; setTimeout(mostra, ATTESA);
  });
  window.addEventListener('appinstalled', function () { invito = null; chiudi(); });
  if (ios && safari) window.addEventListener('load', function () { setTimeout(mostra, ATTESA); });
})();
