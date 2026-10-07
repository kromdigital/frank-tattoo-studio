(() => {
  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: fondo al hacer scroll */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menú móvil */
  const burger = $('#burger'), nav = $('#nav');
  const toggle = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggle(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle(false)));

  /* Link activo según sección */
  const links = [...nav.querySelectorAll('a')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((l) => { const s = document.querySelector(l.getAttribute('href')); s && io.observe(s); });

  /* Portafolio: filtros, entrada escalonada y lightbox */
  const filters = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.work')];
  const empty = $('#workEmpty');
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.style.setProperty('--d', (cards.indexOf(e.target) % 3) * 0.12 + 's');
    e.target.classList.add('is-in');
    cio.unobserve(e.target);
  }), { threshold: 0.15 });
  cards.forEach((c) => cio.observe(c));

  filters.forEach((b) => b.addEventListener('click', () => {
    filters.forEach((f) => { const on = f === b; f.classList.toggle('is-active', on); f.setAttribute('aria-pressed', on); });
    let n = 0;
    cards.forEach((c) => {
      const show = b.dataset.filter === 'todos' || c.dataset.cat === b.dataset.filter;
      c.hidden = !show;
      if (!show) return;
      cio.unobserve(c);
      c.classList.remove('is-in'); void c.offsetWidth;
      c.style.setProperty('--d', n++ * 0.08 + 's');
      c.classList.add('is-in');
    });
    empty.hidden = n > 0;
  }));

  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let list = [], idx = 0;
  const paint = () => {
    const c = list[idx];
    const fallback = c.dataset.src.replace('-full.jpg', '.jpg');
    lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = fallback; };   // si falta la versión grande, usa la miniatura
    lbImg.src = c.dataset.src;
    lbImg.alt = c.querySelector('h3').textContent;
    lbCap.textContent = lbImg.alt;
  };
  const openLb = (c) => {
    list = cards.filter((x) => !x.hidden); idx = list.indexOf(c); paint();
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; lb.querySelector('.lb__close').focus();
  };
  const closeLb = () => {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  const step = (d) => { idx = (idx + d + list.length) % list.length; paint(); };
  cards.forEach((c) => {
    c.addEventListener('click', () => openLb(c));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(c); } });
  });
  lb.querySelector('.lb__close').addEventListener('click', closeLb);
  lb.querySelector('.lb__prev').addEventListener('click', () => step(-1));
  lb.querySelector('.lb__next').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* Estilos: entrada escalonada de tarjetas */
  const sCards = [...document.querySelectorAll('.style-card')];
  const sio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.style.setProperty('--d', sCards.indexOf(e.target) * 0.15 + 's');
    e.target.classList.add('is-in');
    sio.unobserve(e.target);
  }), { threshold: 0.15 });
  sCards.forEach((c) => sio.observe(c));

  /* Footer: año automático y ocultar botón de WhatsApp al llegar */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  const wa = $('.whatsapp'), foot = $('.footer');
  wa.addEventListener('animationend', (e) => { if (e.animationName === 'fadeUp') wa.classList.add('is-ready'); });
  new IntersectionObserver((es) => es.forEach((e) => wa.classList.toggle('is-hidden', e.isIntersecting)), { rootMargin: '0px 0px -90px 0px' }).observe(foot);

  /* Revelado de secciones + contador de cifras */
  const countUp = (el) => {
    const end = parseFloat(el.dataset.count);
    if (isNaN(end) || reduce) return;
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1800;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      rio.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('[data-reveal]').forEach((el) => rio.observe(el));

  if (reduce) return;

  /* Parallax suave del fondo con el mouse */
  const bg = $('#heroBg'), hero = $('#inicio');
  let tx = 0, ty = 0, cx = 0, cy = 0;
  hero.addEventListener('mousemove', (e) => {
    tx = (e.clientX / innerWidth - .5) * -24;
    ty = (e.clientY / innerHeight - .5) * -16;
  });
  (function loop() {
    cx += (tx - cx) * .06; cy += (ty - cy) * .06;
    bg.style.translate = `${cx}px ${cy + scrollY * .12}px`;
    requestAnimationFrame(loop);
  })();

  /* Parallax sutil de la foto de "Sobre mí" */
  const aboutImg = $('#aboutImg'), about = $('#sobre-mi');
  addEventListener('scroll', () => {
    const r = about.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    aboutImg.style.transform = `translateY(${(r.top / innerHeight) * -30}px)`;
  }, { passive: true });

  /* Partículas doradas (polvo de tinta) */
  const c = $('#dust'), ctx = c.getContext('2d');
  let w, h, dots;
  const init = () => {
    w = c.width = c.offsetWidth; h = c.height = c.offsetHeight;
    dots = Array.from({ length: Math.min(45, w / 35) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.6 + .4, s: Math.random() * .25 + .08, a: Math.random() * .5 + .15, p: Math.random() * 6.28
    }));
  };
  init(); addEventListener('resize', init);
  (function draw(t = 0) {
    ctx.clearRect(0, 0, w, h);
    dots.forEach((d) => {
      d.y -= d.s; d.x += Math.sin(t / 2500 + d.p) * .25;
      if (d.y < -5) { d.y = h + 5; d.x = Math.random() * w; }
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.28);
      ctx.fillStyle = `rgba(217,169,74,${d.a * (.6 + .4 * Math.sin(t / 900 + d.p))})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
})();