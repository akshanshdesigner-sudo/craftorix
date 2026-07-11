(function () {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    menuToggle.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
  });
  document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuToggle.textContent = '☰';
    });
  });

  // Reveal-on-scroll for any .reveal element, including ones added dynamically below
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.15 });
  function observeReveals() {
    document.querySelectorAll('.reveal:not(.show)').forEach(el => revealObserver.observe(el));
  }

  // Splits a stat value like "40+" or "98%" into a plain part and a lime-highlighted suffix
  function renderStatValue(value) {
    const match = String(value).match(/^(\d+)([^\d]*)$/);
    if (!match) return escapeHtml(value);
    return `${escapeHtml(match[1])}<span>${escapeHtml(match[2])}</span>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function el(tag, opts) {
    const node = document.createElement(tag);
    if (opts) {
      if (opts.className) node.className = opts.className;
      if (opts.html !== undefined) node.innerHTML = opts.html;
      if (opts.text !== undefined) node.textContent = opts.text;
      if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
    }
    return node;
  }

  function render(content) {
    // Meta
    if (content.meta) {
      if (content.meta.title) document.title = content.meta.title;
      if (content.meta.description) {
        const m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute('content', content.meta.description);
      }
    }

    // Hero
    const hero = content.hero || {};
    setText('heroBadgeNum', hero.badgeNumber);
    setHtml('heroBadgeText', hero.badgeText);
    setHtml('heroHeading', hero.heading);
    setText('heroSubtitle', hero.subtitle);
    setText('heroPrimaryCta', hero.primaryCta);
    setText('heroSecondaryCta', hero.secondaryCta);

    // Logos
    const logosRow = document.getElementById('logosRow');
    logosRow.innerHTML = '';
    (content.logos || []).forEach(name => logosRow.appendChild(el('span', { text: name })));

    // Stats
    const statsInner = document.getElementById('statsInner');
    statsInner.innerHTML = '';
    (content.stats || []).forEach(stat => {
      const wrap = el('div', { className: 'stat' });
      wrap.appendChild(el('div', { className: 'num', html: renderStatValue(stat.value) }));
      wrap.appendChild(el('div', { className: 'lbl', text: stat.label }));
      statsInner.appendChild(wrap);
    });

    // About
    const about = content.about || {};
    if (about.photo) document.getElementById('aboutPhoto').src = about.photo;
    setText('aboutRoleName', about.roleName);
    setText('aboutRoleTitle', about.roleTitle);
    setHtml('aboutHeading', about.heading);
    const aboutParagraphs = document.getElementById('aboutParagraphs');
    aboutParagraphs.innerHTML = '';
    (about.paragraphs || []).forEach(p => aboutParagraphs.appendChild(el('p', { text: p })));
    const skillTags = document.getElementById('skillTags');
    skillTags.innerHTML = '';
    (about.skills || []).forEach(skill => skillTags.appendChild(el('span', { text: skill })));

    // Services
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';
    (content.services || []).forEach((service, i) => {
      const card = el('div', { className: 'service-card reveal' });
      card.appendChild(el('span', { className: 'idx', text: String(i + 1).padStart(2, '0') }));
      card.appendChild(el('div', { className: 'icon', text: service.icon }));
      card.appendChild(el('h3', { text: service.title }));
      card.appendChild(el('p', { text: service.desc }));
      const tags = el('div', { className: 'tags' });
      (service.tags || []).forEach(t => tags.appendChild(el('span', { text: t })));
      card.appendChild(tags);
      servicesGrid.appendChild(card);
    });

    // Case studies drive the carousel; moreProjects (a different set) drives the grid below it
    setupCarousel(content.caseStudies || []);
    const workGrid = document.getElementById('workGrid');
    workGrid.innerHTML = '';
    (content.moreProjects || []).forEach((p, i) => {
      const card = el('div', { className: 'work-card reveal' });
      const thumb = el('div', { className: 'work-thumb ph-' + ((i % 4) + 1) });
      thumb.appendChild(el('img', { attrs: { src: p.image, alt: p.title + ' (placeholder)', loading: 'lazy' } }));
      thumb.appendChild(el('span', { className: 'cat-chip', text: p.category }));
      card.appendChild(thumb);
      const info = el('div', { className: 'work-info' });
      const infoText = el('div');
      infoText.appendChild(el('h4', { text: p.title }));
      infoText.appendChild(el('p', { text: p.category }));
      info.appendChild(infoText);
      info.appendChild(el('div', { className: 'work-arrow', text: '↗' }));
      card.appendChild(info);
      workGrid.appendChild(card);
    });
    setText('workNote', content.workNote);

    // CTA strip
    const ctaStrip = content.ctaStrip || {};
    setHtml('ctaStripHeading', ctaStrip.heading);
    setText('ctaStripBtn', ctaStrip.buttonText);

    // Process
    const processGrid = document.getElementById('processGrid');
    processGrid.innerHTML = '';
    (content.process || []).forEach(step => {
      const card = el('div', { className: 'process-card reveal' });
      card.appendChild(el('span', { className: 'num', text: step.num }));
      card.appendChild(el('h4', { text: step.title }));
      card.appendChild(el('p', { text: step.desc }));
      processGrid.appendChild(card);
    });

    // Trust
    const trust = content.trust || {};
    if (trust.photo) document.getElementById('trustPhoto').src = trust.photo;
    setHtml('trustHeading', trust.heading);
    const trustHighlights = document.getElementById('trustHighlights');
    trustHighlights.innerHTML = '';
    (trust.highlights || []).forEach(h => {
      const block = el('div', { className: 'highlight-block' });
      block.appendChild(el('h5', { text: h.title }));
      block.appendChild(el('p', { text: h.desc }));
      trustHighlights.appendChild(block);
    });
    const trustStats = document.getElementById('trustStats');
    trustStats.innerHTML = '';
    (trust.stats || []).forEach(stat => {
      const wrap = el('div', { className: 't-stat' });
      wrap.appendChild(el('div', { className: 'num', text: stat.value }));
      wrap.appendChild(el('div', { className: 'lbl', text: stat.label }));
      trustStats.appendChild(wrap);
    });

    // Testimonials
    const testiGrid = document.getElementById('testiGrid');
    testiGrid.innerHTML = '';
    (content.testimonials || []).forEach(t => {
      const card = el('div', { className: 'testi-card reveal' });
      card.appendChild(el('div', { className: 'stars', text: '★★★★★' }));
      card.appendChild(el('p', { className: 'quote', text: t.quote }));
      const person = el('div', { className: 'testi-person' });
      const avatar = el('div', { className: 'testi-avatar' });
      avatar.appendChild(el('img', { attrs: { src: t.avatar, alt: t.name } }));
      person.appendChild(avatar);
      const names = el('div');
      names.appendChild(el('div', { className: 'n', text: t.name }));
      names.appendChild(el('div', { className: 'r', text: t.role }));
      person.appendChild(names);
      card.appendChild(person);
      testiGrid.appendChild(card);
    });

    // Blog
    const blogGrid = document.getElementById('blogGrid');
    blogGrid.innerHTML = '';
    (content.blog || []).forEach(post => {
      const card = el('div', { className: 'blog-card reveal' });
      const thumb = el('div', { className: 'blog-thumb' });
      thumb.appendChild(el('img', { attrs: { src: post.image, alt: post.title, loading: 'lazy' } }));
      card.appendChild(thumb);
      const body = el('div', { className: 'blog-body' });
      body.appendChild(el('div', { className: 'blog-meta', text: post.meta }));
      body.appendChild(el('h4', { text: post.title }));
      body.appendChild(el('p', { text: post.desc }));
      card.appendChild(body);
      blogGrid.appendChild(card);
    });

    // FAQ
    const faqList = document.getElementById('faqList');
    faqList.innerHTML = '';
    (content.faq || []).forEach((item, i) => {
      const faqItem = el('div', { className: 'faq-item reveal' + (i === 0 ? ' open' : '') });
      const question = el('button', { className: 'faq-question' });
      question.appendChild(el('span', { text: item.question }));
      question.appendChild(el('span', { className: 'plus', text: '+' }));
      const answer = el('div', { className: 'faq-answer' });
      const answerP = el('p');
      answerP.textContent = item.answer;
      answer.appendChild(answerP);
      question.addEventListener('click', () => {
        const isOpen = faqItem.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i2 => i2.classList.remove('open'));
        if (!isOpen) faqItem.classList.add('open');
      });
      faqItem.appendChild(question);
      faqItem.appendChild(answer);
      faqList.appendChild(faqItem);
    });

    // Contact
    const contact = content.contact || {};
    setHtml('contactHeading', contact.heading);
    setText('contactSubtitle', contact.subtitle);
    setText('contactPrimaryBtn', contact.primaryCta);
    setText('contactSecondaryBtn', contact.secondaryCta);
    setText('contactEmailText', contact.email);
    if (contact.email) {
      document.getElementById('contactPrimaryBtn').href = 'mailto:' + contact.email;
      document.getElementById('contactSecondaryBtn').href = 'mailto:' + contact.email;
    }

    // Footer
    const footer = content.footer || {};
    const footerEmailLink = document.getElementById('footerEmailLink');
    footerEmailLink.href = footer.email ? 'mailto:' + footer.email : '#';
    footerEmailLink.textContent = footer.email || '';
    setText('footerCopyright', footer.copyright);
    const footerSocials = document.getElementById('footerSocials');
    footerSocials.innerHTML = '';
    (footer.socials || []).forEach(s => {
      footerSocials.appendChild(el('a', {
        text: s.short || s.label,
        attrs: { href: s.url || '#', 'aria-label': s.label }
      }));
    });

    observeReveals();
  }

  function setText(id, value) {
    if (value === undefined || value === null) return;
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }
  function setHtml(id, value) {
    if (value === undefined || value === null) return;
    const node = document.getElementById(id);
    if (node) node.innerHTML = value;
  }

  let caseProjects = [];
  let caseIndex = 0;
  function setupCarousel(projects) {
    caseProjects = projects;
    caseIndex = 0;
    const caseDots = document.getElementById('caseDots');
    function renderDots() {
      caseDots.innerHTML = '';
      caseProjects.forEach((_, i) => {
        const dot = el('button', { attrs: { 'aria-label': 'Go to project ' + (i + 1) } });
        if (i === caseIndex) dot.className = 'active';
        dot.addEventListener('click', () => { caseIndex = i; updateCase(); });
        caseDots.appendChild(dot);
      });
    }
    function updateCase() {
      if (!caseProjects.length) return;
      const p = caseProjects[caseIndex];
      const caseImg = document.getElementById('caseImg');
      caseImg.style.opacity = 0;
      setTimeout(() => {
        caseImg.src = p.image;
        caseImg.alt = p.title + ' (placeholder)';
        caseImg.style.opacity = 1;
      }, 150);
      setText('caseTitle', p.title);
      setText('caseDesc', p.desc);
      setText('caseTag', p.category);
      renderDots();
    }
    document.getElementById('casePrev').onclick = () => {
      if (!caseProjects.length) return;
      caseIndex = (caseIndex - 1 + caseProjects.length) % caseProjects.length;
      updateCase();
    };
    document.getElementById('caseNext').onclick = () => {
      if (!caseProjects.length) return;
      caseIndex = (caseIndex + 1) % caseProjects.length;
      updateCase();
    };
    updateCase();
  }

  async function fetchContent() {
    try {
      const res = await fetch('/api/content', { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch (e) { /* server not running, fall back to static file */ }
    const res2 = await fetch('content.json', { cache: 'no-store' });
    return res2.json();
  }

  fetchContent()
    .then(render)
    .catch(err => console.error('Failed to load site content:', err));
})();
