/**
 * Trendy Traders Academy — consultation form validation
 * ------------------------------------------------------------------
 * Pure validation rules + inline error rendering. Submission lives in
 * popup.js. Native constraint validation is disabled on the form
 * (novalidate) so every message is consistent and screen-reader
 * friendly; the server must still re-validate everything.
 */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var NAME_RE = /^[\p{L}\p{M} .'-]+$/u;

  /** Normalise an Indian mobile number to 10 digits (or return null). */
  function normalizePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
    else if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  }

  var rules = {
    fullName: function (v) {
      v = v.trim();
      if (!v) return 'Please enter your full name.';
      if (v.length < 2) return 'Your name looks too short.';
      if (v.length > 80) return 'Please keep your name under 80 characters.';
      if (!NAME_RE.test(v)) return 'Please use letters only (spaces, dots and hyphens are fine).';
      return '';
    },
    email: function (v) {
      v = v.trim();
      if (!v) return 'Please enter your email address.';
      if (!EMAIL_RE.test(v)) return 'Please enter a valid email address, e.g. name@example.com.';
      return '';
    },
    phone: function (v) {
      if (!v.trim()) return 'Please enter your mobile number.';
      if (!normalizePhone(v)) return 'Please enter a valid 10-digit Indian mobile number.';
      return '';
    },
    age: function (v) {
      v = v.trim();
      if (!v) return 'Please enter your age.';
      if (!/^\d{1,3}$/.test(v)) return 'Please enter your age in whole years.';
      var n = parseInt(v, 10);
      if (n < 18) return 'Our programmes are open to adults only. You must be 18 or older to enquire.';
      if (n > 100) return 'Please enter a valid age.';
      return '';
    },
    tradeAmount: function (v) { return v ? '' : 'Please choose the amount you plan to trade with.'; },
    occupation: function (v) { return v ? '' : 'Please choose your occupation.'; }
  };

  function fieldWrap(form, name) {
    var el = form.elements[name];
    if (!el) return null;
    var node = el.length && !el.tagName ? el[0] : el;
    return node.closest('.field');
  }

  function setError(form, name, message) {
    var wrap = fieldWrap(form, name);
    if (!wrap) return;
    var input = form.elements[name];
    var errorEl = wrap.querySelector('.field__error');
    wrap.classList.toggle('is-invalid', !!message);
    if (input && input.setAttribute) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) errorEl.querySelector('span').textContent = message || '';
  }

  function validateField(form, name) {
    var rule = rules[name];
    var el = form.elements[name];
    if (!rule || !el) return '';
    var message = rule(el.value || '');
    setError(form, name, message);
    return message;
  }

  /**
   * Validate the given fields (default: every rule) and return the
   * names of the invalid ones. Used per step by the two-step popup.
   */
  function validateForm(form, names) {
    return (names || Object.keys(rules)).filter(function (name) { return !!validateField(form, name); });
  }

  /**
   * Live behaviour: validate on blur once a value exists, and re-check
   * a field as the visitor corrects it. Never shows errors on fields the
   * visitor has not touched yet.
   */
  function attach(form) {
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      el.addEventListener('blur', function () {
        if (el.value.trim() || fieldWrap(form, name).classList.contains('is-invalid')) validateField(form, name);
      });
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
        if (fieldWrap(form, name).classList.contains('is-invalid')) validateField(form, name);
      });
    });

    // Digits-only friendliness for the phone field
    var phone = form.elements.phone;
    if (phone) {
      phone.addEventListener('input', function () {
        var cleaned = phone.value.replace(/[^\d\s-]/g, '');
        if (cleaned !== phone.value) phone.value = cleaned;
      });
    }
  }

  function clearAll(form) {
    Object.keys(rules).forEach(function (name) { setError(form, name, ''); });
  }

  window.TTAFormValidation = {
    attach: attach,
    validateForm: validateForm,
    validateField: validateField,
    normalizePhone: normalizePhone,
    clearAll: clearAll
  };
})();
