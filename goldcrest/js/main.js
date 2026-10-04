(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

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
})();
