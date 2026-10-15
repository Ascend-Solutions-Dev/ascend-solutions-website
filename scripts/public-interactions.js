// Only the two interactions used by the public marketing pages.
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#primary-menu');
  const setOpen = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    menu.classList.toggle('is-open', open);
  };
  toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  const form = document.querySelector('.waitlist-form');
  if (!form) return;
  const status = document.querySelector('#waitlist-status');
  const button = form.querySelector('button[type="submit"]');
  const report = (kind, message) => {
    status.className = 'form-status ' + kind;
    status.textContent = message;
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    const data = new FormData(form);
    if (data.get('company')) return;
    const email = String(data.get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      report('error', 'Enter a valid email address.');
      return;
    }
    button.disabled = true;
    button.textContent = 'Joining…';
    report('submitting', '');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source: 'pantrii' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'We could not save your email.');
      report('success', result.message || 'You’re on the list. We’ll be in touch.');
      form.reset();
    } catch (error) {
      report('error', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      button.disabled = false;
      button.textContent = 'Join the waitlist';
    }
  });
})();
