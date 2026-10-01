'use strict';
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entrance = $('#entrance');
  const audio = $('#wedding-music');
  const musicButton = $('#music-toggle');
  const musicLabel = $('#music-label');
  const menuButton = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');
  const toast = $('#toast');
  const shareDialog = $('#share-dialog');
  let entranceTimer;
  let toastTimer;
  let musicStarting = false;
  let activeDialogs = 0;

  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
  }

  function lockBody() {
    if (activeDialogs === 0) {
      document.body.classList.add('dialog-open');
    }
    activeDialogs++;
  }

  function unlockBody() {
    activeDialogs = Math.max(0, activeDialogs - 1);
    if (activeDialogs === 0) document.body.classList.remove('dialog-open');
  }

  function showDialog(dialog) {
    if (!dialog.open && typeof dialog.showModal === 'function') {
      try { dialog.showModal(); lockBody(); return true; }
      catch { return false; }
    }
    return false;
  }

  [entrance, $('#photo-dialog'), shareDialog].forEach(dialog => {
    dialog.addEventListener('close', unlockBody);
  });

  function finishEntrance() {
    clearTimeout(entranceTimer);
    if (entrance.open) entrance.close();
    entrance.classList.remove('opening');
    $('#open-entrance').disabled = false;
    $('#skip-entrance').disabled = false;
    $('#hero-title').focus({ preventScroll: true });
    try { sessionStorage.setItem('surya-maha-entered-v1', 'yes'); } catch {}
  }

  function syncMusic() {
    const playing = !audio.paused && !audio.ended;
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', playing ? 'Pause wedding music' : 'Play wedding music');
    musicLabel.textContent = playing ? 'Music on' : 'Music off';
  }

  async function playMusic() {
    if (musicStarting || !audio.paused) return;
    musicStarting = true;
    audio.volume = 0.35;
    try { await audio.play(); }
    catch { notify('Music couldn’t start. Tap the music button to try again.'); }
    finally { musicStarting = false; syncMusic(); }
  }

  function openEntrance() {
    if (!entrance.open || entrance.classList.contains('opening')) return;
    if ($('#entrance-sound').checked) void playMusic();
    if (reducedMotion.matches) { finishEntrance(); return; }
    entrance.classList.add('opening');
    $('#open-entrance').disabled = true;
    $('#skip-entrance').disabled = true;
    entranceTimer = setTimeout(finishEntrance, 1700);
  }

  $('#open-entrance').addEventListener('click', openEntrance);
  $('#skip-entrance').addEventListener('click', finishEntrance);
  entrance.addEventListener('cancel', (event) => { event.preventDefault(); finishEntrance(); });
  $('#replay-entrance').addEventListener('click', () => {
    entrance.classList.remove('opening');
    $('#open-entrance').disabled = false;
    $('#skip-entrance').disabled = false;
    $('#entrance-sound').checked = !audio.paused;
    if (showDialog(entrance)) $('#open-entrance').focus();
  });
  musicButton.addEventListener('click', () => {
    if (audio.paused) void playMusic(); else { audio.pause(); syncMusic(); }
  });
  ['play', 'pause', 'ended'].forEach(name => audio.addEventListener(name, syncMusic));
  audio.addEventListener('error', () => { syncMusic(); notify('Music is unavailable at the moment. You can still explore the invitation.'); });

  function closeMenu() {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = 'Menu';
  }
  menuButton.addEventListener('click', () => {
    const willOpen = mobileNav.hidden;
    mobileNav.hidden = !willOpen;
    menuButton.setAttribute('aria-expanded', String(willOpen));
    menuButton.textContent = willOpen ? 'Close' : 'Menu';
  });
  $$('a, button', mobileNav).forEach(item => item.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener('click', (event) => {
    if (!mobileNav.hidden && !$('#site-header').contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
  const header = $('#site-header');
  let headerScrolled = false;
  function updateHeader() {
    const scrolled = window.scrollY > 25;
    if (scrolled !== headerScrolled) {
      headerScrolled = scrolled;
      header.classList.toggle('scrolled', scrolled);
    }
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const tabs = $$('.event-tab');
  function chooseEvent(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => chooseEvent(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); chooseEvent(tabs[next], true); }
    });
  });

  const weddingTime = Date.parse('2026-11-11T09:21:00+05:30');
  const countdown = $('#countdown');
  function updateCountdown() {
    let remaining = Math.max(0, Math.floor((weddingTime - Date.now()) / 1000));
    const parts = { days: Math.floor(remaining / 86400), hours: Math.floor((remaining % 86400) / 3600), minutes: Math.floor((remaining % 3600) / 60), seconds: remaining % 60 };
    Object.entries(parts).forEach(([key, value]) => { $(`[data-count="${key}"]`).textContent = String(value).padStart(2, '0'); });
    countdown.hidden = false;
    if (remaining === 0) {
      $('#countdown-caption').textContent = 'Our new chapter has begun. Thank you for your love and blessings.';
      countdown.hidden = true;
    }
  }
  updateCountdown();
  let countdownInterval = setInterval(updateCountdown, 1000);
  window.addEventListener('pagehide', () => { clearInterval(countdownInterval); clearTimeout(entranceTimer); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) { updateCountdown(); clearInterval(countdownInterval); countdownInterval = setInterval(updateCountdown, 1000); if (entrance.classList.contains('opening')) finishEntrance(); } });

  const photoDialog = $('#photo-dialog');
  $('#view-photo').addEventListener('click', () => { if (!showDialog(photoDialog)) window.open('assets/couple.webp', '_blank', 'noopener'); });
  $('#close-photo').addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('click', (event) => {
    if (event.target === photoDialog) {
      const bounds = photoDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) photoDialog.close();
    }
  });

  const invitationTitle = 'Mahalakshmi & Surya Prakash · Wedding Invitation';
  const invitationText = 'With warm hearts, we invite you to our reception on 10 November 2026 at Rahul Convention Hall (7 PM onwards) and our wedding on 11 November 2026 at Sri Maha Ganapathi Temple (9:21–9:51 AM). Your presence and blessings will make our celebration complete.';
  function invitationUrl() { return new URL('./', window.location.href).href; }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(value); return true; } catch {}
    }
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    const parent = shareDialog.open ? shareDialog : document.body;
    parent.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch {}
    field.remove();
    return copied;
  }

  function openShareFallback() {
    $('#share-url').value = invitationUrl();
    $('#whatsapp-share').href = 'https://wa.me/?text=' + encodeURIComponent(invitationText + '\n\n' + invitationUrl());
    if (showDialog(shareDialog)) $('#copy-share-link').focus();
    else { void copyText(invitationUrl()).then(copied => notify(copied ? 'Invitation link copied.' : 'You can share the invitation using the address in your browser.')); }
  }

  async function shareInvitation() {
    if (navigator.share) {
      try { await navigator.share({ title: invitationTitle, text: invitationText, url: invitationUrl() }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    openShareFallback();
  }
  $$('[data-share]').forEach(button => button.addEventListener('click', () => { void shareInvitation(); }));
  $('#close-share').addEventListener('click', () => shareDialog.close());
  $('#copy-share-link').addEventListener('click', async () => {
    const copied = await copyText(invitationUrl());
    if (copied) { shareDialog.close(); notify('Invitation link copied.'); }
    else { $('#share-url').focus(); $('#share-url').select(); $('#copy-share-link').textContent = 'Select and copy the link above'; }
  });
  $$('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const value = button.dataset.copy;
    const copied = await copyText(value);
    notify(copied ? `${value} copied.` : `Use ${value} when sharing your memories.`);
  }));

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -15px 0px' });
    $$('.reveal').forEach(node => observer.observe(node));
    const showAll = () => { $$('.reveal').forEach(node => node.classList.add('visible')); observer.disconnect(); };
    reducedMotion.addEventListener('change', showAll, { once: true });
    window.addEventListener('beforeprint', showAll);
  }

  let hasEntered = false;
  try { hasEntered = sessionStorage.getItem('surya-maha-entered-v1') === 'yes'; } catch {}
  if (!hasEntered && !window.location.hash) {
    if (showDialog(entrance)) $('#open-entrance').focus();
  }
})();
