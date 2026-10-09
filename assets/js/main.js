/**
 * Trendy Traders Academy — shared site behaviour
 * ------------------------------------------------------------------
 * Exposes window.TTA with small helpers reused by popup.js and
 * form-validation.js (storage, analytics, config).
 * No dependencies. Every feature is a progressive enhancement:
 * pages remain readable and navigable without JavaScript.
 */
(function () {
  'use strict';

  var CONFIG = window.TTA_CONFIG || {};
  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Storage: sessionStorage with an in-memory fallback (private mode,
     blocked storage, embedded previews).
     --------------------------------------------------------------- */
  var memoryStore = {};
  var session = {
    get: function (key) {
      try { return window.sessionStorage.getItem(key); } catch (e) { return memoryStore[key] || null; }
    },
    set: function (key, value) {
      memoryStore[key] = String(value);
      try { window.sessionStorage.setItem(key, String(value)); } catch (e) { /* memory fallback already set */ }
    }
  };

  /* ---------------------------------------------------------------
     Analytics hook. Uses whatever is already on the page (GTM
     dataLayer, then gtag). Never adds tags itself and never sends
     personal data: callers pass only non-identifying parameters.
     --------------------------------------------------------------- */
  var PII_KEYS = /name|email|phone|mobile|age|occupation|amount/i;

  function track(eventName, params) {
    var payload = {};
    params = params || {};
    Object.keys(params).forEach(function (k) {
      if (!PII_KEYS.test(k) || k === 'form_name') payload[k] = params[k];
    });
    payload.page_type = doc.body.getAttribute('data-page') || 'unknown';

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: eventName }, payload));
    } else if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
    if (window.TTA_DEBUG) console.info('[TTA track]', eventName, payload);
  }

  window.TTA = { config: CONFIG, session: session, track: track };

  /* ---------------------------------------------------------------
     Config binding: fill editable values (batch dates, contacts).
     --------------------------------------------------------------- */
  function bindConfig() {
    var display = CONFIG.display || {};
    doc.querySelectorAll('[data-config]').forEach(function (el) {
      var value = display[el.getAttribute('data-config')];
      if (value) el.textContent = value;
    });

    var contact = CONFIG.contact || {};
    doc.querySelectorAll('[data-contact="phone"]').forEach(function (a) { if (contact.phoneHref) a.href = contact.phoneHref; });
    doc.querySelectorAll('[data-contact="email"]').forEach(function (a) { if (contact.emailHref) a.href = contact.emailHref; });
    doc.querySelectorAll('[data-contact="whatsapp"]').forEach(function (a) { if (contact.whatsapp) a.href = contact.whatsapp; });

    var enrol = CONFIG.enrolUrls || {};
    doc.querySelectorAll('[data-enrol]').forEach(function (a) {
      var url = enrol[a.getAttribute('data-enrol')];
      if (url) a.href = url;
      a.addEventListener('click', function () {
        track('enrol_click', { course: a.getAttribute('data-enrol') });
      });
    });
  }

  /* ---------------------------------------------------------------
     Image fallbacks: logo and mentor portrait degrade to text
     placeholders until the official assets are uploaded.
     --------------------------------------------------------------- */
  function onImageMissing(img, callback) {
    if (!img) return;
    if (img.complete && img.naturalWidth === 0) { callback(); return; }
    img.addEventListener('error', callback, { once: true });
  }

  function initImageFallbacks() {
    doc.querySelectorAll('[data-logo]').forEach(function (wrap) {
      onImageMissing(wrap.querySelector('img'), function () { wrap.classList.add('is-fallback'); });
    });
    doc.querySelectorAll('[data-media-fallback]').forEach(function (wrap) {
      onImageMissing(wrap.querySelector('img'), function () { wrap.classList.add('is-fallback'); });
    });
  }

  /* ---------------------------------------------------------------
     Header: scrolled state + mobile navigation
     --------------------------------------------------------------- */
  function initHeader() {
    var header = doc.querySelector('.site-header');
    if (!header) return;

    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = header.querySelector('.nav-toggle');
    var nav = doc.getElementById('site-nav');
    if (!toggle || !nav) return;

    var desktop = window.matchMedia('(min-width: 1024px)');

    function setOpen(open) {
      if (open) nav.style.setProperty('--nav-top', Math.max(0, header.getBoundingClientRect().bottom) + 'px');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      doc.body.classList.toggle('is-locked', open);
      doc.body.classList.toggle('nav-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a destination (including in-page anchors)
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('[data-open-consultation]')) {
        if (!desktop.matches) setOpen(false);
      }
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    desktop.addEventListener('change', function (mq) { if (mq.matches) setOpen(false); });

  }

  /* ---------------------------------------------------------------
     Scroll spy: sections carry data-spy="<key>" (header links use
     data-spy-link) and optionally data-spy-bottom="<key>" for the
     mobile bottom nav (links use data-spy-bottom-link). The last
     section whose top has passed 35% of the viewport wins.
     --------------------------------------------------------------- */
  function initScrollSpy() {
    var sections = Array.prototype.slice.call(doc.querySelectorAll('[data-spy]'));
    var headerLinks = doc.querySelectorAll('[data-spy-link]');
    var bottomLinks = doc.querySelectorAll('[data-spy-bottom-link]');
    if (!sections.length) return;
    var current = null;
    var ticking = false;

    function mark(links, attr, key) {
      links.forEach(function (a) {
        var on = a.getAttribute(attr) === key;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }

    function update() {
      ticking = false;
      var line = window.innerHeight * 0.35;
      var active = sections[0];
      sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) active = s; });
      // At the very bottom of the page, the last section is the active one
      if (window.innerHeight + window.scrollY >= doc.documentElement.scrollHeight - 4) active = sections[sections.length - 1];
      if (active === current) return;
      current = active;
      var key = active.getAttribute('data-spy');
      mark(headerLinks, 'data-spy-link', key);
      mark(bottomLinks, 'data-spy-bottom-link', active.getAttribute('data-spy-bottom') || key);
    }

    // Timer-based throttle: keeps working even when animation frames
    // are paused (background tabs, some embedded webviews).
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.setTimeout(update, 60); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------------------------------------------------------
     Expand / collapse: FAQ answers, programme details, mentor details.
     <button data-toggle="[analytics label]" aria-controls="panel-id">
     --------------------------------------------------------------- */
  function initToggles() {
    doc.querySelectorAll('[data-toggle]').forEach(function (btn) {
      var panel = doc.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        panel.classList.toggle('is-open', open);
        var label = btn.getAttribute('data-toggle');
        if (open && label) track('details_open', { item: label });
      });
    });
  }

  /* "View All" buttons reveal the .is-extra items of their container */
  function initShowMore() {
    doc.querySelectorAll('[data-show-more]').forEach(function (btn) {
      var box = doc.getElementById(btn.getAttribute('aria-controls'));
      if (!box) return;
      var label = btn.querySelector('[data-label]');
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        box.classList.toggle('is-expanded', open);
        if (label) label.textContent = open ? 'Show Less' : 'View All';
        if (open) {
          var first = box.querySelector('.is-extra');
          var focusable = first && (first.matches('button, a') ? first : first.querySelector('button, a'));
          if (focusable) focusable.focus({ preventScroll: true });
        }
      });
    });
  }

  /* Chart entrance: animate once when the chart scrolls into view */
  function initChart() {
    var chart = doc.querySelector('.chart');
    if (!chart) return;
    if (reduceMotion || !('IntersectionObserver' in window)) { chart.classList.add('is-drawn'); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { chart.classList.add('is-drawn'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(chart);
  }

  /* ---------------------------------------------------------------
     Media coverage: screenshots open in a lightbox; if a screenshot
     has not been uploaded yet the card shows text + article link.
     --------------------------------------------------------------- */
  var lightbox;

  function getLightbox() {
    if (lightbox) return lightbox;
    lightbox = doc.createElement('dialog');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-labelledby', 'lightbox-caption');
    lightbox.innerHTML =
      '<div class="lightbox__inner">' +
        '<div class="lightbox__bar">' +
          '<p class="lightbox__caption" id="lightbox-caption"></p>' +
          '<div class="btn-row">' +
            '<a class="btn btn--outline btn--sm" data-lightbox-link target="_blank" rel="noopener noreferrer">Read article</a>' +
            '<button type="button" class="modal__close" data-lightbox-close aria-label="Close enlarged image" style="position:static">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="lightbox__body"><img alt=""></div>' +
      '</div>';
    doc.body.appendChild(lightbox);
    lightbox.querySelector('[data-lightbox-close]').addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', function () {
      doc.body.classList.remove('is-locked');
      if (lightbox._returnFocus) lightbox._returnFocus.focus();
    });
    return lightbox;
  }

  function initPress() {
    doc.querySelectorAll('.press-card').forEach(function (card) {
      var shot = card.querySelector('.press-card__shot');
      if (!shot) return;
      var img = shot.querySelector('img');
      onImageMissing(img, function () { card.classList.add('no-shot'); });

      shot.addEventListener('click', function () {
        var box = getLightbox();
        var link = card.querySelector('.press-card__link a');
        var big = box.querySelector('.lightbox__body img');
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        box.querySelector('.lightbox__caption').textContent = card.querySelector('.press-card__title').textContent;
        var boxLink = box.querySelector('[data-lightbox-link]');
        if (link) { boxLink.href = link.href; boxLink.hidden = false; } else { boxLink.hidden = true; }
        box._returnFocus = shot;
        doc.body.classList.add('is-locked');
        if (typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
        track('press_screenshot_open', { publication: card.getAttribute('data-publication') || '' });
      });
    });
  }

  /* ---------------------------------------------------------------
     Testimonials: rendered only from genuine entries in config.
     --------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initTestimonials() {
    var items = (CONFIG.testimonials || []).filter(function (t) { return t && t.quote && t.name; });
    doc.querySelectorAll('[data-testimonials]').forEach(function (section) {
      if (!items.length) return; // stays hidden: no placeholder or invented reviews
      var grid = section.querySelector('.testimonial-grid');
      grid.innerHTML = items.slice(0, 6).map(function (t) {
        var source = t.sourceUrl
          ? ' · <a href="' + escapeHtml(t.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t.sourceLabel || 'Source') + '</a>'
          : (t.sourceLabel ? ' · ' + escapeHtml(t.sourceLabel) : '');
        return '<figure class="testimonial"><blockquote><p>' + escapeHtml(t.quote) + '</p></blockquote>' +
          '<figcaption><strong>' + escapeHtml(t.name) + '</strong>' + escapeHtml(t.detail || '') + source + '</figcaption></figure>';
      }).join('');
      section.hidden = false;
    });
  }

  /* ---------------------------------------------------------------
     Mobile sticky CTA: appears after the hero, hides near the
     contact section / footer so it never covers their actions.
     --------------------------------------------------------------- */
  function initStickyCta() {
    var bar = doc.querySelector('.sticky-cta');
    if (!bar || !('IntersectionObserver' in window)) return;
    doc.body.classList.add('has-sticky-cta');

    var pastHero = false;
    var nearEnd = false;
    var update = function () { bar.classList.toggle('is-visible', pastHero && !nearEnd && !doc.body.classList.contains('modal-open')); };

    var hero = doc.querySelector('.hero, .page-hero, .course-hero');
    if (hero) {
      new IntersectionObserver(function (entries) {
        pastHero = !entries[0].isIntersecting;
        update();
      }).observe(hero);
    } else {
      pastHero = true;
    }

    var endZones = doc.querySelectorAll('.contact-section, .site-footer');
    var visibleEnds = new Set();
    var endObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) visibleEnds.add(en.target); else visibleEnds.delete(en.target); });
      nearEnd = visibleEnds.size > 0;
      update();
    });
    endZones.forEach(function (z) { endObserver.observe(z); });

    doc.addEventListener('tta:modal', update);
    update();
  }

  /* ---------------------------------------------------------------
     Scroll reveal: subtle, once, disabled for reduced motion.
     --------------------------------------------------------------- */
  function initReveal() {
    var items = doc.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-revealed'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  function init() {
    bindConfig();
    initImageFallbacks();
    initHeader();
    initToggles();
    initShowMore();
    initScrollSpy();
    initChart();
    initPress();
    initTestimonials();
    initStickyCta();
    initReveal();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
