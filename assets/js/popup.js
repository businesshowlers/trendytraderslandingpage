/**
 * Trendy Traders Academy — global two-step consultation popup
 * ------------------------------------------------------------------
 * ONE modal + ONE form, injected once per page.
 *   Step 1: name, email, phone, age (18+)       → Continue
 *   Step 2: trading amount, occupation, WhatsApp brochure, optional
 *           email consent                       → Back / Get Free Consultation
 * Both steps live in the same <form>, so Step 1 values are kept while
 * the visitor moves back and forth, and are submitted together.
 *
 * Open it from any element with:   data-open-consultation="<location>"
 * (the value is a non-personal label used for analytics).
 *
 * Auto-open: at each delay in config.popup.autoOpenDelaysMs (default 5 s,
 * then 25 s), at most once per delay per browser session, never after a
 * successful submission, and never while another dialog is open or the
 * visitor is typing.
 * Pages can opt out with <body data-auto-popup="false">.
 *
 * Success is shown ONLY after the configured endpoint confirms it.
 */
(function () {
  'use strict';

  var doc = document;
  var TTA = window.TTA || { session: { get: function () { return null; }, set: function () {} }, track: function () {} };
  var CONFIG = window.TTA_CONFIG || {};
  var V = window.TTAFormValidation;
  var display = CONFIG.display || {};
  var contact = CONFIG.contact || {};

  var STEP_FIELDS = {
    1: ['fullName', 'email', 'phone', 'age'],
    2: ['tradeAmount', 'occupation']
  };

  var KEYS = {
    autoShown: 'tta_consult_auto_shown',
    dismissed: 'tta_consult_dismissed',
    submitted: 'tta_consult_submitted',
    utm: 'tta_utm',
    leadIds: 'tta_lead_ids'
  };

  var ICONS = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    alert: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 6v4.5M10 13.5h.01"/></svg>',
    alertSm: '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 6v4.5M10 13.5h.01"/></svg>',
    lock: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 016 0V9"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  function errorSlot(id) {
    return '<p class="field__error" id="' + id + '-error">' + ICONS.alertSm + '<span></span></p>';
  }
  function req() { return '<span class="field__req" aria-hidden="true">*</span>'; }

  /* ---------------------------------------------------------------
     Markup (single source of truth for the modal)
     --------------------------------------------------------------- */
  function buildModal() {
    var dialog = doc.createElement('dialog');
    dialog.className = 'modal';
    dialog.id = 'consultation-modal';
    dialog.setAttribute('aria-labelledby', 'cf-step1-title');

    dialog.innerHTML =
      '<div class="modal__main">' +
        '<button type="button" class="modal__close" data-modal-close aria-label="Close consultation form">' + ICONS.close + '</button>' +

        '<div class="modal__form-view">' +
          '<div class="progress">' +
            '<span class="progress__label" data-step-label aria-live="polite">Step 1 of 2</span>' +
            '<div class="progress__bar" aria-hidden="true"><span class="is-done"></span><span data-step-bar2></span></div>' +
          '</div>' +

          '<form id="consultation-form" novalidate>' +

            /* Step 1 ------------------------------------------------- */
            '<fieldset class="step" data-step="1" aria-labelledby="cf-step1-title">' +
              '<h2 class="modal__title" id="cf-step1-title" tabindex="-1">Let’s Get to Know You</h2>' +
              '<p class="modal__intro">Share your details to receive course guidance.</p>' +
              '<div class="form-grid">' +
                '<div class="field">' +
                  '<label class="field__label" for="cf-name">Full name' + req() + '</label>' +
                  '<input class="input" id="cf-name" name="fullName" type="text" autocomplete="name" required aria-describedby="cf-name-error" maxlength="80">' +
                  errorSlot('cf-name') +
                '</div>' +
                '<div class="field">' +
                  '<label class="field__label" for="cf-email">Email address' + req() + '</label>' +
                  '<input class="input" id="cf-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="cf-email-error" placeholder="name@example.com">' +
                  errorSlot('cf-email') +
                '</div>' +
                '<div class="field">' +
                  '<label class="field__label" for="cf-phone">Mobile number' + req() + '</label>' +
                  '<div class="input-group">' +
                    '<span class="input-group__prefix" aria-hidden="true">+91</span>' +
                    '<input class="input" id="cf-phone" name="phone" type="tel" autocomplete="tel-national" inputmode="numeric" required aria-describedby="cf-phone-hint cf-phone-error" placeholder="10-digit number" maxlength="14">' +
                  '</div>' +
                  '<span class="visually-hidden" id="cf-phone-hint">India country code +91 is added automatically.</span>' +
                  errorSlot('cf-phone') +
                '</div>' +
                '<div class="field">' +
                  '<label class="field__label" for="cf-age">Age' + req() + '</label>' +
                  '<input class="input" id="cf-age" name="age" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" required aria-describedby="cf-age-hint cf-age-error" placeholder="18+">' +
                  '<span class="field__hint" id="cf-age-hint">Our programmes are open to adults aged 18 and above.</span>' +
                  errorSlot('cf-age') +
                '</div>' +
                // Spam trap: hidden from people and assistive tech
                '<div class="honeypot" aria-hidden="true"><label for="cf-website">Leave this field empty</label><input id="cf-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
                '<button type="button" class="btn btn--primary btn--block" data-step-next>Continue</button>' +
                '<div class="form__privacy">' + ICONS.lock + '<p>We use these details only to respond to your enquiry. We don’t sell your information. <a href="privacy-policy.html">Privacy Policy</a></p></div>' +
              '</div>' +
            '</fieldset>' +

            /* Step 2 ------------------------------------------------- */
            '<fieldset class="step" data-step="2" aria-labelledby="cf-step2-title" hidden>' +
              '<h2 class="modal__title" id="cf-step2-title" tabindex="-1">Help Us Guide You Better</h2>' +
              '<p class="modal__intro">A little context helps our advisors suggest the right programme.</p>' +
              '<div class="form-grid">' +
                '<div class="field">' +
                  '<label class="field__label" for="cf-amount">Amount you plan to trade with' + req() + '</label>' +
                  '<select class="select" id="cf-amount" name="tradeAmount" required aria-describedby="cf-amount-error">' +
                    '<option value="" disabled selected>Select a range</option>' +
                    '<option value="20k-50k">₹20,000 to ₹50,000</option>' +
                    '<option value="50k-1L">₹50,000 to ₹1,00,000</option>' +
                    '<option value="1L-5L">₹1,00,000 to ₹5,00,000</option>' +
                    '<option value="5L+">₹5,00,000 and above</option>' +
                  '</select>' +
                  errorSlot('cf-amount') +
                '</div>' +
                '<div class="field">' +
                  '<label class="field__label" for="cf-occupation">Occupation' + req() + '</label>' +
                  '<select class="select" id="cf-occupation" name="occupation" required aria-describedby="cf-occupation-error">' +
                    '<option value="" disabled selected>Select your occupation</option>' +
                    '<option>Student</option>' +
                    '<option>Self-employed</option>' +
                    '<option>Salaried</option>' +
                    '<option>Business Owner</option>' +
                    '<option>Home Maker</option>' +
                  '</select>' +
                  errorSlot('cf-occupation') +
                '</div>' +
                '<fieldset class="field">' +
                  '<legend class="field__label">Would you like to receive the brochure on WhatsApp?</legend>' +
                  '<div class="choice-row">' +
                    '<label class="choice"><input type="radio" name="whatsappBrochure" value="yes"> Yes</label>' +
                    '<label class="choice"><input type="radio" name="whatsappBrochure" value="no"> No</label>' +
                  '</div>' +
                '</fieldset>' +
                '<label class="consent"><input type="checkbox" name="emailMarketingConsent" value="yes"> <span>Optional: email me about new batches, workshops and learning resources. I can unsubscribe at any time.</span></label>' +
                '<div class="captcha-slot" data-captcha></div>' +
                '<div class="form-status form-status--error" role="alert" data-form-status></div>' +
                '<div class="step-actions">' +
                  '<button type="button" class="btn btn--outline" data-step-back>Back</button>' +
                  '<button type="submit" class="btn btn--primary" data-submit>Get Free Consultation</button>' +
                '</div>' +
              '</div>' +
            '</fieldset>' +

            '<p class="visually-hidden" aria-live="polite" data-form-live></p>' +
          '</form>' +
        '</div>' +

        '<div class="form-success" data-form-success tabindex="-1">' +
          '<div class="form-success__icon">' + ICONS.check + '</div>' +
          '<h2 class="modal__title" id="cf-success-title">Thank you. We’ve received your enquiry.</h2>' +
          '<p>A member of our team will contact you shortly to talk through course options and upcoming batches.</p>' +
          '<button type="button" class="btn btn--outline" data-modal-close>Close</button>' +
        '</div>' +
      '</div>';

    doc.body.appendChild(dialog);
    return dialog;
  }

  /* ---------------------------------------------------------------
     State & helpers
     --------------------------------------------------------------- */
  var dialog, form, mainEl, statusEl, liveEl, submitBtn, successEl, formView, stepLabel, stepBar2;
  var steps = {};
  var currentStep = 1;
  var lastTrigger = null;
  var openSource = '';
  var formStarted = false;
  var submittedThisOpen = false;
  var busy = false;
  var captchaLoaded = false;

  function captureUtm() {
    try {
      var params = new URLSearchParams(window.location.search);
      var utm = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) {
        if (params.get(k)) utm[k] = params.get(k).slice(0, 200);
      });
      if (Object.keys(utm).length) TTA.session.set(KEYS.utm, JSON.stringify(utm));
    } catch (e) { /* ignore */ }
  }

  function readUtm() {
    try { return JSON.parse(TTA.session.get(KEYS.utm) || '{}'); } catch (e) { return {}; }
  }

  function lockScroll(lock) {
    var body = doc.body;
    if (lock) {
      var gap = window.innerWidth - doc.documentElement.clientWidth;
      if (gap > 0) body.style.paddingRight = gap + 'px';
      body.classList.add('is-locked', 'modal-open');
    } else {
      body.style.paddingRight = '';
      body.classList.remove('is-locked', 'modal-open');
    }
    doc.dispatchEvent(new CustomEvent('tta:modal'));
  }

  function setStatus(html) {
    statusEl.innerHTML = html ? ICONS.alert + '<div>' + html + '</div>' : '';
    statusEl.classList.toggle('is-visible', !!html);
  }

  function setBusy(state) {
    busy = state;
    submitBtn.disabled = state;
    submitBtn.setAttribute('aria-busy', String(state));
    form.querySelector('[data-step-back]').disabled = state;
    submitBtn.innerHTML = state
      ? '<span class="spinner" aria-hidden="true"></span><span>Sending…</span>'
      : 'Get Free Consultation';
  }

  function fallbackContactHtml() {
    return 'You can also reach us on <a href="' + contact.phoneHref + '">' + display.phone + '</a>' +
      ' or <a href="' + contact.emailHref + '">' + display.email + '</a>.';
  }

  /** Show a step; values in the other step are untouched. */
  function goToStep(n, moveFocus) {
    currentStep = n;
    steps[1].hidden = n !== 1;
    steps[2].hidden = n !== 2;
    stepLabel.textContent = 'Step ' + n + ' of 2';
    stepBar2.classList.toggle('is-done', n === 2);
    dialog.setAttribute('aria-labelledby', 'cf-step' + n + '-title');
    mainEl.scrollTop = 0;
    if (moveFocus) {
      var target = n === 2 ? form.elements.tradeAmount : steps[1].querySelector('.modal__title');
      target.focus({ preventScroll: true });
    }
  }

  function showSuccess(on) {
    formView.hidden = on;
    successEl.classList.toggle('is-visible', on);
    dialog.setAttribute('aria-labelledby', on ? 'cf-success-title' : 'cf-step' + currentStep + '-title');
  }

  function focusFirstInvalid(names) {
    var el = form.elements[names[0]];
    if (el) el.focus();
    liveEl.textContent = 'Please correct ' + names.length + (names.length === 1 ? ' field.' : ' fields.');
  }

  /* ---------------------------------------------------------------
     Optional CAPTCHA (Cloudflare Turnstile), loaded on first open
     --------------------------------------------------------------- */
  function loadCaptcha() {
    var cfg = CONFIG.captcha || {};
    if (captchaLoaded || cfg.provider !== 'turnstile' || !cfg.siteKey) return;
    captchaLoaded = true;
    var widget = doc.createElement('div');
    widget.className = 'cf-turnstile';
    widget.setAttribute('data-sitekey', cfg.siteKey);
    form.querySelector('[data-captcha]').appendChild(widget);
    var s = doc.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    doc.head.appendChild(s);
  }

  function captchaToken() {
    var el = form.querySelector('[name="cf-turnstile-response"]');
    return el ? el.value : '';
  }

  /* ---------------------------------------------------------------
     Open / close
     --------------------------------------------------------------- */
  function open(source, isAuto) {
    if (!dialog || dialog.open) return;
    if (doc.querySelector('dialog[open]')) return; // never stack over another dialog

    openSource = source || 'unspecified';
    lastTrigger = isAuto ? null : doc.activeElement;
    formStarted = false;
    submittedThisOpen = false;
    setStatus('');
    showSuccess(false);
    goToStep(1, false); // always start at Step 1; any values already typed are kept

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    lockScroll(true);
    loadCaptcha();

    window.setTimeout(function () {
      form.elements.fullName.focus({ preventScroll: true });
      mainEl.scrollTop = 0;
    }, 30);

    TTA.track('consultation_popup_impression', { trigger: isAuto ? 'auto' : 'manual', cta_location: openSource });
  }

  function close() {
    if (dialog && dialog.open) dialog.close();
  }

  function onClosed() {
    lockScroll(false);
    if (!submittedThisOpen) {
      TTA.session.set(KEYS.dismissed, '1');
      TTA.track('consultation_popup_dismiss', { cta_location: openSource, form_started: formStarted, step: currentStep });
    }
    if (lastTrigger && typeof lastTrigger.focus === 'function' && doc.contains(lastTrigger)) {
      lastTrigger.focus();
    } else if (dialog.contains(doc.activeElement)) {
      doc.activeElement.blur(); // never leave focus inside a closed dialog
    }
    lastTrigger = null;
  }

  /* ---------------------------------------------------------------
     Step navigation
     --------------------------------------------------------------- */
  function handleContinue() {
    var invalid = V.validateForm(form, STEP_FIELDS[1]);
    if (invalid.length) {
      focusFirstInvalid(invalid);
      TTA.track('consultation_form_validation_error', { step: 1, fields: invalid.join(','), error_count: invalid.length, cta_location: openSource });
      return;
    }
    TTA.track('consultation_step1_complete', { cta_location: openSource });
    goToStep(2, true);
  }

  /* ---------------------------------------------------------------
     Submission
     --------------------------------------------------------------- */
  function collect() {
    var f = form.elements;
    var wa = form.querySelector('input[name="whatsappBrochure"]:checked');
    return {
      fullName: f.fullName.value.trim(),
      email: f.email.value.trim(),
      phone: '+91' + V.normalizePhone(f.phone.value),
      age: parseInt(f.age.value, 10),
      tradeAmount: f.tradeAmount.value,
      occupation: f.occupation.value,
      whatsappBrochure: wa ? wa.value : null,
      emailMarketingConsent: f.emailMarketingConsent.checked,
      captchaToken: captchaToken() || undefined,
      context: {
        ctaLocation: openSource,
        page: window.location.pathname,
        pageTitle: doc.title,
        referrer: doc.referrer || undefined,
        utm: readUtm(),
        submittedAt: new Date().toISOString()
      }
    };
  }

  function recordLeadOnce(leadId) {
    var ids;
    try { ids = JSON.parse(TTA.session.get(KEYS.leadIds) || '[]'); } catch (e) { ids = []; }
    if (ids.indexOf(leadId) !== -1) return; // duplicate conversion guard
    ids.push(leadId);
    TTA.session.set(KEYS.leadIds, JSON.stringify(ids.slice(-10)));
    TTA.track('consultation_lead_success', { cta_location: openSource, lead_ref: leadId });
    if ((CONFIG.analytics || {}).metaPixelLead && typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {}, { eventID: leadId });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;

    // Enter pressed inside Step 1 behaves like "Continue"
    if (currentStep === 1) { handleContinue(); return; }

    setStatus('');
    if (form.elements.website.value) return; // spam trap filled → drop quietly

    // Re-check Step 1 too, in case it was edited via Back
    var invalid1 = V.validateForm(form, STEP_FIELDS[1]);
    if (invalid1.length) {
      goToStep(1, false);
      focusFirstInvalid(invalid1);
      return;
    }
    var invalid = V.validateForm(form, STEP_FIELDS[2]);
    if (invalid.length) {
      focusFirstInvalid(invalid);
      TTA.track('consultation_form_validation_error', { step: 2, fields: invalid.join(','), error_count: invalid.length, cta_location: openSource });
      return;
    }

    var cfg = CONFIG.captcha || {};
    if (cfg.provider === 'turnstile' && cfg.siteKey && !captchaToken()) {
      setStatus('Please complete the security check, then submit again.');
      return;
    }

    var endpoint = (CONFIG.form || {}).endpoint;
    TTA.track('consultation_form_submit', { cta_location: openSource });

    if (!endpoint) {
      // Backend not connected yet: be honest, never fake success.
      if (window.console) console.warn('[TTA] Consultation form endpoint is not configured (assets/js/config.js → form.endpoint).');
      setStatus('<strong>We couldn’t send your enquiry online right now.</strong> Your details are still here. ' + fallbackContactHtml());
      return;
    }

    setBusy(true);
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = window.setTimeout(function () { if (controller) controller.abort(); }, (CONFIG.form || {}).timeoutMs || 15000);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(collect()),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (err) { data = null; }
          if (!res.ok || (data && (data.ok === false || data.success === false))) {
            var err = new Error((data && (data.message || data.error)) || 'Request failed');
            err.status = res.status;
            throw err;
          }
          return data || {};
        });
      })
      .then(function (data) {
        submittedThisOpen = true;
        TTA.session.set(KEYS.submitted, '1');
        recordLeadOnce(String(data.id || data.leadId || Date.now().toString(36)));
        form.reset();
        V.clearAll(form);
        goToStep(1, false);
        showSuccess(true);
        successEl.focus();
      })
      .catch(function (err) {
        var msg = err && err.name === 'AbortError' ? 'The request took too long.' : 'Something went wrong while sending your enquiry.';
        setStatus('<strong>' + msg + '</strong> Your details are still here, so you can try again. ' + fallbackContactHtml());
        TTA.track('consultation_form_error', { cta_location: openSource, status: (err && err.status) || 0 });
      })
      .then(function () {
        window.clearTimeout(timer);
        setBusy(false);
      });
  }

  /* ---------------------------------------------------------------
     Auto-open (once per session, respectful)
     --------------------------------------------------------------- */
  function scheduleAutoOpen() {
    if (doc.body.getAttribute('data-auto-popup') === 'false') return;
    if (TTA.session.get(KEYS.submitted)) return;

    // e.g. [5000, 25000]: first at 5 s, again at 25 s after page load.
    var delays = (CONFIG.popup || {}).autoOpenDelaysMs || [5000, 25000];
    var shown = parseInt(TTA.session.get(KEYS.autoShown) || '0', 10) || 0;

    delays.forEach(function (delay, index) {
      if (index < shown) return; // this slot was already used earlier in the session
      window.setTimeout(function () { tryAutoOpen(index); }, delay);
    });

    function tryAutoOpen(index) {
      if (TTA.session.get(KEYS.submitted)) return;
      var count = parseInt(TTA.session.get(KEYS.autoShown) || '0', 10) || 0;
      if (count > index) return;
      var active = doc.activeElement;
      // Never interrupt: another dialog, the open mobile menu, or typing
      var typingElsewhere = active && /INPUT|SELECT|TEXTAREA/.test(active.tagName) && !dialog.contains(active);
      if (doc.querySelector('dialog[open]') || doc.body.classList.contains('nav-open') || typingElsewhere) return;
      TTA.session.set(KEYS.autoShown, String(index + 1));
      open('auto_timer_' + (index + 1), true);
    }
  }

  /* ---------------------------------------------------------------
     Init
     --------------------------------------------------------------- */
  function init() {
    if (!V) return;
    captureUtm();

    dialog = buildModal();
    form = dialog.querySelector('#consultation-form');
    mainEl = dialog.querySelector('.modal__main');
    steps[1] = form.querySelector('[data-step="1"]');
    steps[2] = form.querySelector('[data-step="2"]');
    statusEl = form.querySelector('[data-form-status]');
    liveEl = form.querySelector('[data-form-live]');
    submitBtn = form.querySelector('[data-submit]');
    successEl = dialog.querySelector('[data-form-success]');
    formView = dialog.querySelector('.modal__form-view');
    stepLabel = dialog.querySelector('[data-step-label]');
    stepBar2 = dialog.querySelector('[data-step-bar2]');

    V.attach(form);

    form.addEventListener('submit', handleSubmit);
    form.querySelector('[data-step-next]').addEventListener('click', handleContinue);
    form.querySelector('[data-step-back]').addEventListener('click', function () {
      setStatus('');
      goToStep(1, true);
    });
    form.addEventListener('input', function () {
      if (formStarted) return;
      formStarted = true;
      TTA.track('consultation_form_start', { cta_location: openSource });
    });

    dialog.addEventListener('close', onClosed);
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close(); // backdrop click
      if (e.target.closest('[data-modal-close]')) close();
    });

    // One delegated listener powers every consultation CTA on the site
    doc.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-open-consultation]');
      if (!trigger) return;
      e.preventDefault();
      var location = trigger.getAttribute('data-open-consultation') || 'unspecified';
      TTA.track('consultation_cta_click', { cta_location: location });
      open(location, false);
      lastTrigger = trigger;
    });

    scheduleAutoOpen();

    window.TTAConsultation = { open: function (src) { open(src || 'api', false); }, close: close };
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
