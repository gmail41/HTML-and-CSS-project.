(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = !root.classList.contains('motion');

  /* ---------- navigation ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- forms ---------- */
  function post(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; });
    });
  }

  var login = document.getElementById('portal-form');
  if (login) {
    var alertBox = document.getElementById('portal-alert');
    var alertText = document.getElementById('portal-alert-text');
    login.addEventListener('submit', function (e) {
      e.preventDefault();
      post('/api/portal').then(function (res) {
        alertText.textContent = res.body.error || 'Service temporarily unavailable. Please try again later.';
        alertBox.classList.add('show');
        document.getElementById('pw').value = '';
      }).catch(function () {
        alertText.textContent = 'Service temporarily unavailable. Please try again later.';
        alertBox.classList.add('show');
      });
    });
  }

  var contact = document.getElementById('contact-form');
  if (contact) {
    var msg = document.getElementById('contact-msg');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contact.querySelector('button[type=submit]');
      btn.disabled = true;
      var f = contact.elements;
      post('/api/contact', {
        name: f.name.value, email: f.email.value, topic: f.topic.value,
        message: f.message.value, website: f.website.value
      }).then(function (res) {
        if (res.ok && res.body.ok) {
          msg.textContent = 'Form sent. Thank you, we will be in touch.';
          msg.className = 'form-msg show';
          contact.reset();
        } else {
          msg.textContent = res.body.error || 'Unable to send your message right now.';
          msg.className = 'form-msg show err';
        }
      }).catch(function () {
        msg.textContent = 'Unable to send your message right now.';
        msg.className = 'form-msg show err';
      }).then(function () { btn.disabled = false; });
    });
  }

  /* ---------- header: colour follows the section beneath it ---------- */
  var darks = [].slice.call(document.querySelectorAll('.dark'));
  var lastY = window.scrollY;
  function updateHeader(y, darkRanges) {
    if (!header) return;
    var probe = y + header.offsetHeight / 2;
    var onDark = darkRanges.some(function (r) { return probe >= r[0] && probe < r[1]; });
    header.classList.toggle('on-dark', onDark);
    header.classList.toggle('on-light', !onDark);
    header.classList.toggle('scrolled', y > 8);
    if (!header.classList.contains('menu-open')) {
      if (y > lastY + 4 && y > 160) header.classList.add('hide');
      else if (y < lastY - 4 || y <= 160) header.classList.remove('hide');
    }
    lastY = y;
  }

  function docTop(el) {
    var t = 0;
    while (el) { t += el.offsetTop; el = el.offsetParent; }
    return t;
  }
  function ranges() {
    return darks.map(function (d) { var t = docTop(d); return [t, t + d.offsetHeight]; });
  }

  if (reduce) {
    var staticRanges = ranges();
    var onScroll = function () { updateHeader(window.scrollY, staticRanges); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { staticRanges = ranges(); onScroll(); });
    onScroll();
    return;
  }

  /* ---------- split headlines into masked words ---------- */
  function split(el) {
    var words = [];
    var chars = el.getAttribute('data-split') === 'chars';
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(chars ? /(\s+|)/ : /(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            var wi = document.createElement('span');
            w.className = 'w';
            wi.className = 'wi';
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
            words.push(wi);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') {
          walk(c);
        }
      });
    })(el);
    words.forEach(function (w, i) { w.style.setProperty('--i', i); });
    el.style.setProperty('--n', Math.max(words.length - 1, 1));
    el.style.setProperty('--in', 0);
    el.classList.add('is-split');
  }
  [].forEach.call(document.querySelectorAll('[data-split]'), split);

  /* ---------- scroll engine ---------- */
  // Every tracked element has a target (from scroll position) and a current
  // value that eases toward it each frame. Writing the eased value to CSS
  // variables keeps motion smooth in both scroll directions.
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(k, dt) { return 1 - Math.pow(1 - k, dt / 16.667); }

  var items = [].slice.call(document.querySelectorAll('[data-reveal],[data-split]')).map(function (el) {
    return {
      el: el,
      end: parseFloat(el.getAttribute('data-end')) || 0.68,
      exit: !el.hasAttribute('data-noexit'),
      delay: parseFloat(el.getAttribute('data-delay')) || 0,
      counts: [].slice.call(el.querySelectorAll('[data-count]')).map(function (c) {
        var n = parseFloat(c.getAttribute('data-count'));
        c.textContent = '0';
        return { el: c, n: n, last: -1 };
      }),
      top: 0, h: 0, ci: 0, co: 0, wi: -1, wo: -1
    };
  });
  var parallax = [].slice.call(document.querySelectorAll('[data-speed]')).map(function (el) {
    return { el: el, s: parseFloat(el.getAttribute('data-speed')) || 0, top: 0, h: 0, c: 0, w: null };
  });
  var hero = document.querySelector('.hero');
  var heroH = 1, hp = 0, hpW = -1;
  var marquees = [].slice.call(document.querySelectorAll('.marquee-track')).map(function (t) {
    return { el: t, half: 1, top: 0, h: 0, base: 0 };
  });

  var vh = window.innerHeight, maxScroll = 0, darkRanges = [];
  function measure() {
    vh = window.innerHeight;
    maxScroll = Math.max(0, root.scrollHeight - vh);
    items.forEach(function (it) { it.top = docTop(it.el); it.h = it.el.offsetHeight; });
    parallax.forEach(function (p) { p.top = docTop(p.el); p.h = p.el.offsetHeight; });
    marquees.forEach(function (m) {
      m.half = m.el.scrollWidth / 2 || 1;
      m.top = docTop(m.el.parentNode);
      m.h = m.el.parentNode.offsetHeight;
    });
    if (hero) heroH = hero.offsetHeight || 1;
    darkRanges = ranges();
    kick();
  }

  var started = false, t0 = 0, last = 0, running = false;
  var vel = 0, skew = 0, prevY = window.scrollY;

  function frame(now) {
    var dt = Math.min(64, now - (last || now)) || 16.667;
    last = now;
    var y = window.scrollY;
    var k = ease(0.1, dt);
    var busy = false;
    var since = performance.now() - t0;

    items.forEach(function (it) {
      var ti = 0, to = 0;
      if (started && since < it.delay) busy = true; // still waiting to start its intro
      if (started && since >= it.delay) {
        var s = it.top - vh;
        var e = Math.min(it.top - vh * it.end, maxScroll);
        ti = e <= s ? (y >= e ? 1 : 0) : clamp((y - s) / (e - s));
        if (it.exit) {
          var b = it.top + it.h;
          to = clamp((y - (b - vh * 0.22)) / (vh * 0.22));
        }
      }
      it.ci += (ti - it.ci) * k;
      it.co += (to - it.co) * k;
      if (Math.abs(ti - it.ci) < 0.0005) it.ci = ti;
      if (Math.abs(to - it.co) < 0.0005) it.co = to;
      if (it.ci !== ti || it.co !== to) busy = true;
      if (it.ci !== it.wi) { it.el.style.setProperty('--in', it.ci.toFixed(4)); it.wi = it.ci; }
      if (it.co !== it.wo) { it.el.style.setProperty('--out', it.co.toFixed(4)); it.wo = it.co; }
      it.counts.forEach(function (c) {
        var v = Math.round(c.n * (1 - Math.pow(1 - it.ci, 3)));
        if (v !== c.last) { c.el.textContent = String(v); c.last = v; }
      });
    });

    parallax.forEach(function (p) {
      var t = (p.top + p.h / 2 - (y + vh / 2)) * p.s;
      p.c += (t - p.c) * k;
      if (Math.abs(t - p.c) < 0.05) p.c = t; else busy = true;
      var w = p.c.toFixed(1);
      if (w !== p.w) { p.el.style.translate = '0 ' + w + 'px'; p.w = w; }
    });

    if (hero) {
      var th = clamp(y / heroH);
      hp += (th - hp) * k;
      if (Math.abs(th - hp) < 0.0005) hp = th; else busy = true;
      if (hp !== hpW) { hero.style.setProperty('--hp', hp.toFixed(4)); hpW = hp; }
    }

    // marquee keeps drifting while on screen; scroll speed pushes and skews it
    var dy = y - prevY;
    prevY = y;
    vel += (dy - vel) * ease(0.2, dt);
    var tsk = Math.max(-10, Math.min(10, vel * 0.35));
    skew += (tsk - skew) * ease(0.12, dt);
    marquees.forEach(function (m) {
      if (y + vh < m.top || y > m.top + m.h) return;
      busy = true;
      m.base += dt * 0.045 + Math.abs(vel) * 0.9;
      var x = m.base % m.half;
      m.el.style.setProperty('--mx', x.toFixed(1));
      m.el.style.setProperty('--skew', skew.toFixed(2));
    });

    root.style.setProperty('--sp', maxScroll ? (y / maxScroll).toFixed(4) : '0');

    if (busy || Math.abs(vel) > 0.05) requestAnimationFrame(frame);
    else { running = false; last = 0; }
  }

  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', function () {
    updateHeader(window.scrollY, darkRanges);
    kick();
  }, { passive: true });
  window.addEventListener('resize', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  window.addEventListener('load', measure);

  measure();
  updateHeader(window.scrollY, darkRanges);
  root.classList.add('motion-ready');

  // hold the intro until the typeface is in, so words don't re-flow mid-flight
  var go = function () {
    if (started) return;
    started = true;
    t0 = performance.now();
    measure();
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  setTimeout(go, 700);
})();
