(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Investor portal: intentionally non-functional. It never authenticates and
  // never transmits what is typed; it always shows the standard error banner.
  var login = document.getElementById('portal-form');
  if (login) {
    login.addEventListener('submit', function (e) {
      e.preventDefault();
      document.getElementById('portal-alert').classList.add('show');
      document.getElementById('pw').value = '';
    });
  }

  var contact = document.getElementById('contact-form');
  if (contact) {
    contact.addEventListener('submit', function (e) {
      if (contact.getAttribute('action') === '#') {
        e.preventDefault();
        var msg = document.getElementById('contact-msg');
        msg.textContent = 'This form is not yet connected to an email service. Please write to us directly at the email address shown on this page.';
        msg.classList.add('show');
      }
    });
  }
})();
