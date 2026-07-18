(function () {
  let state = null;
  const panelsRoot = document.getElementById('panels');
  const loading = document.getElementById('loading');
  const statusEl = document.getElementById('status');
  const panelTitle = document.getElementById('panelTitle');
  const sideNav = document.getElementById('sideNav');
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  const loginForm = document.getElementById('loginForm');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const passwordModal = document.getElementById('passwordModal');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordModalMsg = document.getElementById('passwordModalMsg');

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = kind || '';
  }

  // ---------- generic field helpers ----------
  function field(parent, labelText, value, onChange, opts) {
    opts = opts || {};
    const label = document.createElement('label');
    label.textContent = labelText;
    parent.appendChild(label);
    const input = document.createElement(opts.textarea ? 'textarea' : 'input');
    if (!opts.textarea) input.type = opts.type || 'text';
    input.value = value || '';
    input.addEventListener('input', () => onChange(input.value));
    parent.appendChild(input);
    if (opts.hint) {
      const m = document.createElement('div');
      m.className = 'muted';
      m.textContent = opts.hint;
      parent.appendChild(m);
    }
    return input;
  }

  function row(parent) {
    const r = document.createElement('div');
    r.className = 'row';
    parent.appendChild(r);
    return r;
  }

  function col(parent) {
    const c = document.createElement('div');
    parent.appendChild(c);
    return c;
  }

  function subheading(parent, text, spaced) {
    const label = document.createElement('label');
    label.textContent = text;
    if (spaced) label.style.marginTop = '24px';
    parent.appendChild(label);
  }

  function addButton(parent, text, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add-btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    parent.appendChild(btn);
    return btn;
  }

  function removeButton(parent, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove';
    btn.textContent = '✕ remove';
    btn.addEventListener('click', onClick);
    parent.appendChild(btn);
    return btn;
  }

  // chip list editor for arrays of plain strings, e.g. logos, skills
  function chipList(parent, labelText, arr, placeholder) {
    const label = document.createElement('label');
    label.textContent = labelText;
    parent.appendChild(label);
    const list = document.createElement('div');
    list.className = 'chip-list';
    parent.appendChild(list);

    function renderChips() {
      list.innerHTML = '';
      arr.forEach((val, i) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        const span = document.createElement('span');
        span.textContent = val;
        chip.appendChild(span);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '✕';
        btn.addEventListener('click', () => { arr.splice(i, 1); renderChips(); });
        chip.appendChild(btn);
        list.appendChild(chip);
      });
    }
    renderChips();

    const addRow = document.createElement('div');
    addRow.className = 'chip-add';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder || 'Add new…';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Add';
    function addValue() {
      const v = input.value.trim();
      if (!v) return;
      arr.push(v);
      input.value = '';
      renderChips();
    }
    btn.addEventListener('click', addValue);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } });
    addRow.appendChild(input);
    addRow.appendChild(btn);
    parent.appendChild(addRow);
  }

  // Renders a repeatable array-of-objects list with add/remove, re-rendering only this list on structural change
  function renderRepeatable(parent, arr, itemBuilder, factory, addLabel) {
    const wrap = document.createElement('div');
    parent.appendChild(wrap);

    function renderList() {
      wrap.innerHTML = '';
      arr.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        removeButton(card, () => { arr.splice(i, 1); renderList(); });
        itemBuilder(card, item);
        wrap.appendChild(card);
      });
      const btnHolder = document.createElement('div');
      addButton(btnHolder, '+ ' + addLabel, () => { arr.push(factory()); renderList(); });
      wrap.appendChild(btnHolder);
    }
    renderList();
  }

  function hint(parent, text) {
    const p = document.createElement('div');
    p.className = 'hint';
    p.textContent = text;
    parent.appendChild(p);
  }

  // Show/Hide toggle for a whole page section; missing key defaults to visible
  function visibilityToggle(parent, key) {
    const label = document.createElement('label');
    label.className = 'vis-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = state.visibility[key] !== false;
    const text = document.createElement('span');
    text.textContent = 'Show this section on the website';
    const stateTag = document.createElement('span');
    function renderState() {
      stateTag.className = 'state ' + (input.checked ? 'on' : 'off');
      stateTag.textContent = input.checked ? 'Visible' : 'Hidden';
    }
    input.addEventListener('change', () => {
      state.visibility[key] = input.checked;
      renderState();
    });
    renderState();
    label.appendChild(input);
    label.appendChild(text);
    label.appendChild(stateTag);
    parent.appendChild(label);
  }

  // ---------- module builders: each receives its own panel container ----------
  function buildHero(c) {
    visibilityToggle(c, 'hero');
    field(c, 'Badge number (e.g. 5+)', state.hero.badgeNumber, v => state.hero.badgeNumber = v);
    field(c, 'Badge text (HTML allowed, e.g. <strong>bold</strong>)', state.hero.badgeText, v => state.hero.badgeText = v, { textarea: true });
    field(c, 'Heading (wrap a word in <em></em> to highlight it green, <br> for line break)', state.hero.heading, v => state.hero.heading = v, { textarea: true });
    field(c, 'Subtitle', state.hero.subtitle, v => state.hero.subtitle = v, { textarea: true });
    const r = row(c);
    field(col(r), 'Primary button text', state.hero.primaryCta, v => state.hero.primaryCta = v);
    field(col(r), 'Secondary button text', state.hero.secondaryCta, v => state.hero.secondaryCta = v);
  }

  function buildLogos(c) {
    visibilityToggle(c, 'logos');
    chipList(c, 'Logos', state.logos, 'Company name');
  }

  function buildStats(c) {
    visibilityToggle(c, 'stats');
    renderRepeatable(c, state.stats, (card, item) => {
      const r = row(card);
      field(col(r), 'Value (e.g. 40+, 98%)', item.value, v => item.value = v);
      field(col(r), 'Label', item.label, v => item.label = v);
    }, () => ({ value: '0', label: 'New Stat' }), 'Add stat');
  }

  function buildAbout(c) {
    visibilityToggle(c, 'about');
    field(c, 'Photo URL', state.about.photo, v => state.about.photo = v);
    const r = row(c);
    field(col(r), 'Role name', state.about.roleName, v => state.about.roleName = v);
    field(col(r), 'Role title', state.about.roleTitle, v => state.about.roleTitle = v);
    field(c, 'Heading (HTML allowed, wrap in <em> to highlight)', state.about.heading, v => state.about.heading = v, { textarea: true });
    field(c, 'Paragraph 1', state.about.paragraphs[0] || '', v => state.about.paragraphs[0] = v, { textarea: true });
    field(c, 'Paragraph 2', state.about.paragraphs[1] || '', v => state.about.paragraphs[1] = v, { textarea: true });
    chipList(c, 'Skills', state.about.skills, 'Skill name');
  }

  function buildServices(c) {
    visibilityToggle(c, 'services');
    renderRepeatable(c, state.services, (card, item) => {
      const r = row(card);
      field(col(r), 'Icon (emoji)', item.icon, v => item.icon = v);
      field(col(r), 'Title', item.title, v => item.title = v);
      field(card, 'Description', item.desc, v => item.desc = v, { textarea: true });
      if (!item.tags) item.tags = [];
      chipList(card, 'Tags', item.tags, 'Tag name');
    }, () => ({ icon: '✨', title: 'New Service', desc: '', tags: [] }), 'Add service');
  }

  function buildCaseStudies(c) {
    visibilityToggle(c, 'caseStudies');
    hint(c, 'The featured project carousel at the top of the Work section.');
    renderRepeatable(c, state.caseStudies, (card, item) => {
      field(card, 'Image URL', item.image, v => item.image = v);
      const r = row(card);
      field(col(r), 'Title', item.title, v => item.title = v);
      field(col(r), 'Category', item.category, v => item.category = v);
      field(card, 'Description', item.desc, v => item.desc = v, { textarea: true });
      field(card, 'Redirect URL (PDF / Figma / case study link — optional)', item.url, v => item.url = v, { type: 'url', hint: 'When set, the carousel image becomes clickable and a "View Case Study" button appears.' });
    }, () => ({ image: '', title: 'New Case Study', category: 'App Design', desc: '', url: '' }), 'Add case study');
  }

  function buildMoreProjects(c) {
    visibilityToggle(c, 'moreProjects');
    hint(c, 'A different set of projects shown in the grid below the carousel.');
    renderRepeatable(c, state.moreProjects, (card, item) => {
      field(card, 'Image URL', item.image, v => item.image = v);
      const r = row(card);
      field(col(r), 'Title', item.title, v => item.title = v);
      field(col(r), 'Category', item.category, v => item.category = v);
      field(card, 'Description', item.desc, v => item.desc = v, { textarea: true });
      field(card, 'Redirect URL (PDF / Figma / case study link — optional)', item.url, v => item.url = v, { type: 'url', hint: 'When set, the whole project card opens this link in a new tab.' });
    }, () => ({ image: '', title: 'New Project', category: 'App Design', desc: '', url: '' }), 'Add project');
    field(c, 'Note below the project grid', state.workNote, v => state.workNote = v);
  }

  function buildCtaStrip(c) {
    visibilityToggle(c, 'ctaStrip');
    field(c, 'Heading (HTML allowed)', state.ctaStrip.heading, v => state.ctaStrip.heading = v, { textarea: true });
    field(c, 'Button text', state.ctaStrip.buttonText, v => state.ctaStrip.buttonText = v);
  }

  function buildProcess(c) {
    visibilityToggle(c, 'process');
    renderRepeatable(c, state.process, (card, item) => {
      const r = row(card);
      field(col(r), 'Number (e.g. 01)', item.num, v => item.num = v);
      field(col(r), 'Title', item.title, v => item.title = v);
      field(card, 'Description', item.desc, v => item.desc = v, { textarea: true });
    }, () => ({ num: '0' + (state.process.length + 1), title: 'New Step', desc: '' }), 'Add step');
  }

  function buildTrust(c) {
    visibilityToggle(c, 'trust');
    hint(c, 'Photo + highlights + stats block.');
    field(c, 'Photo URL', state.trust.photo, v => state.trust.photo = v);
    field(c, 'Heading (HTML allowed)', state.trust.heading, v => state.trust.heading = v, { textarea: true });
    subheading(c, 'Highlights', true);
    renderRepeatable(c, state.trust.highlights, (card, item) => {
      field(card, 'Title', item.title, v => item.title = v);
      field(card, 'Description', item.desc, v => item.desc = v, { textarea: true });
    }, () => ({ title: 'New Highlight', desc: '' }), 'Add highlight');
    subheading(c, 'Stats', true);
    renderRepeatable(c, state.trust.stats, (card, item) => {
      const r = row(card);
      field(col(r), 'Value', item.value, v => item.value = v);
      field(col(r), 'Label', item.label, v => item.label = v);
    }, () => ({ value: '0', label: 'New Stat' }), 'Add stat');
  }

  function buildTestimonials(c) {
    visibilityToggle(c, 'testimonials');
    renderRepeatable(c, state.testimonials, (card, item) => {
      field(card, 'Avatar image URL', item.avatar, v => item.avatar = v);
      field(card, 'Quote', item.quote, v => item.quote = v, { textarea: true });
      const r = row(card);
      field(col(r), 'Name', item.name, v => item.name = v);
      field(col(r), 'Role', item.role, v => item.role = v);
    }, () => ({ avatar: '', quote: '', name: 'New Client', role: '' }), 'Add testimonial');
  }

  function buildBlog(c) {
    visibilityToggle(c, 'blog');
    renderRepeatable(c, state.blog, (card, item) => {
      field(card, 'Image URL', item.image, v => item.image = v);
      field(card, 'Meta (e.g. Design · Jul 2026)', item.meta, v => item.meta = v);
      field(card, 'Title', item.title, v => item.title = v);
      field(card, 'Description', item.desc, v => item.desc = v, { textarea: true });
    }, () => ({ image: '', meta: '', title: 'New Post', desc: '' }), 'Add post');
  }

  function buildFaq(c) {
    visibilityToggle(c, 'faq');
    renderRepeatable(c, state.faq, (card, item) => {
      field(card, 'Question', item.question, v => item.question = v);
      field(card, 'Answer', item.answer, v => item.answer = v, { textarea: true });
    }, () => ({ question: 'New question?', answer: '' }), 'Add question');
  }

  function buildContact(c) {
    visibilityToggle(c, 'contact');
    field(c, 'Heading (HTML allowed)', state.contact.heading, v => state.contact.heading = v, { textarea: true });
    field(c, 'Subtitle', state.contact.subtitle, v => state.contact.subtitle = v, { textarea: true });
    field(c, 'Email address', state.contact.email, v => state.contact.email = v, { type: 'email' });
    const r = row(c);
    field(col(r), 'Primary button text', state.contact.primaryCta, v => state.contact.primaryCta = v);
    field(col(r), 'Secondary button text', state.contact.secondaryCta, v => state.contact.secondaryCta = v);
  }

  function buildFooter(c) {
    field(c, 'Email address', state.footer.email, v => state.footer.email = v, { type: 'email' });
    field(c, 'Copyright line', state.footer.copyright, v => state.footer.copyright = v);
    subheading(c, 'Social links', true);
    renderRepeatable(c, state.footer.socials, (card, item) => {
      const r = row(card);
      field(col(r), 'Label (e.g. LinkedIn)', item.label, v => item.label = v);
      field(col(r), 'Short (2-letter shown on icon)', item.short, v => item.short = v);
      field(card, 'URL', item.url, v => item.url = v, { type: 'url' });
    }, () => ({ label: 'New Social', short: '?', url: '#' }), 'Add social link');
  }

  // ---------- module registry: drives the sidebar and the panels ----------
  const modules = [
    { id: 'hero', label: 'Hero', icon: '🏠', build: buildHero },
    { id: 'logos', label: 'Logos', icon: '🏷️', build: buildLogos },
    { id: 'stats', label: 'Stats', icon: '📈', build: buildStats },
    { id: 'about', label: 'About', icon: '👤', build: buildAbout },
    { id: 'services', label: 'Services', icon: '🛠️', build: buildServices },
    { id: 'caseStudies', label: 'Case Studies', icon: '🎞️', build: buildCaseStudies },
    { id: 'moreProjects', label: 'More Projects', icon: '🗂️', build: buildMoreProjects },
    { id: 'ctaStrip', label: 'CTA Strip', icon: '📣', build: buildCtaStrip },
    { id: 'process', label: 'Process', icon: '🧭', build: buildProcess },
    { id: 'trust', label: 'Trust Section', icon: '🤝', build: buildTrust },
    { id: 'testimonials', label: 'Testimonials', icon: '💬', build: buildTestimonials },
    { id: 'blog', label: 'Blog', icon: '📝', build: buildBlog },
    { id: 'faq', label: 'FAQ', icon: '❓', build: buildFaq },
    { id: 'contact', label: 'Contact', icon: '✉️', build: buildContact },
    { id: 'footer', label: 'Footer', icon: '🔗', build: buildFooter }
  ];

  function buildNav() {
    sideNav.innerHTML = '';
    modules.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'side-link';
      btn.dataset.id = m.id;
      const ic = document.createElement('span');
      ic.className = 'ic';
      ic.textContent = m.icon;
      const lbl = document.createElement('span');
      lbl.textContent = m.label;
      btn.appendChild(ic);
      btn.appendChild(lbl);
      btn.addEventListener('click', () => showPanel(m.id));
      sideNav.appendChild(btn);
    });
  }

  function buildPanels() {
    panelsRoot.innerHTML = '';
    modules.forEach(m => {
      const panel = document.createElement('div');
      panel.className = 'panel';
      panel.id = 'panel-' + m.id;
      m.build(panel);
      panelsRoot.appendChild(panel);
    });
    showPanel(modules[0].id);
  }

  function showPanel(id) {
    modules.forEach(m => {
      document.getElementById('panel-' + m.id).style.display = m.id === id ? 'block' : 'none';
    });
    document.querySelectorAll('.side-link').forEach(a => a.classList.toggle('active', a.dataset.id === id));
    const m = modules.find(m => m.id === id);
    panelTitle.textContent = m ? m.label : '';
  }

  async function load() {
    const res = await fetch('/api/content', { cache: 'no-store' });
    state = await res.json();
    if (!state.visibility) state.visibility = {};
    loading.style.display = 'none';
    panelsRoot.style.display = 'block';
    buildPanels();
  }

  async function save() {
    setStatus('Saving…');
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (res.status === 401) {
        setStatus('Session expired — please log in again', 'err');
        showLogin();
        return;
      }
      if (!res.ok) throw new Error('Save failed');
      setStatus('Saved ✓ — refresh the site to see changes', 'ok');
    } catch (e) {
      setStatus('Error saving — is the server running?', 'err');
    }
  }

  document.getElementById('saveBtn').addEventListener('click', save);

  // ---------- auth flow ----------
  function showLogin() {
    appScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
    loginError.textContent = '';
    loginPassword.value = '';
    loginPassword.focus();
  }

  function showApp() {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'flex';
    buildNav();
    load().catch(() => {
      loading.textContent = 'Could not load content. Is the server running? (npm start)';
    });
  }

  document.getElementById('toggleLoginPassword').addEventListener('click', () => {
    const btn = document.getElementById('toggleLoginPassword');
    const isHidden = loginPassword.type === 'password';
    loginPassword.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁';
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword.value })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        loginError.textContent = data.error || 'Login failed';
        return;
      }
      showApp();
    } catch (e2) {
      loginError.textContent = 'Could not reach the server';
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await fetch('/api/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    state = null;
    showLogin();
  });

  // ---------- change password modal ----------
  document.getElementById('changePasswordBtn').addEventListener('click', () => {
    changePasswordForm.reset();
    passwordModalMsg.textContent = '';
    passwordModalMsg.className = 'modal-msg';
    passwordModal.classList.add('open');
    document.getElementById('currentPassword').focus();
  });

  document.getElementById('passwordModalCancel').addEventListener('click', () => {
    passwordModal.classList.remove('open');
  });

  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    passwordModalMsg.className = 'modal-msg';

    if (newPassword.length < 6) {
      passwordModalMsg.textContent = 'New password must be at least 6 characters';
      passwordModalMsg.classList.add('err');
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordModalMsg.textContent = 'New passwords do not match';
      passwordModalMsg.classList.add('err');
      return;
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        passwordModalMsg.textContent = data.error || 'Could not update password';
        passwordModalMsg.classList.add('err');
        return;
      }
      passwordModalMsg.textContent = 'Password updated ✓';
      passwordModalMsg.classList.add('ok');
      setTimeout(() => passwordModal.classList.remove('open'), 1200);
    } catch (e2) {
      passwordModalMsg.textContent = 'Could not reach the server';
      passwordModalMsg.classList.add('err');
    }
  });

  async function checkSession() {
    try {
      const res = await fetch('/api/session', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated) showApp();
      else showLogin();
    } catch (e) {
      showLogin();
      loginError.textContent = 'Could not reach the server';
    }
  }

  checkSession();
})();
