(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Investor portal: front-end shell only. Real authentication must be provided
  // by a backend / auth service (see DEPLOY.md). Never validate credentials here.
  var login = document.getElementById('portal-form');
  if (login) {
    login.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('portal-msg');
      msg.textContent = 'The investor portal is not yet connected to an authentication service. Please contact us for access.';
      msg.classList.add('show');
    });
  }

  // Contact form: if the form action is still the placeholder, do not pretend to send.
  var contact = document.getElementById('contact-form');
  if (contact) {
    contact.addEventListener('submit', function (e) {
      if (contact.getAttribute('action') === '#') {
        e.preventDefault();
        var msg = document.getElementById('contact-msg');
        msg.textContent = 'This form is not yet connected to an email service. See DEPLOY.md, step 4.';
        msg.classList.add('show');
      }
    });
  }
})();
