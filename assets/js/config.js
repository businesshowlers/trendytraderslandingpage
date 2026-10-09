/**
 * Trendy Traders Academy — site configuration
 * ------------------------------------------------------------------
 * Every business value that changes over time lives here, so updates
 * (batch dates, enrol links, form endpoint) are a one-file edit.
 *
 * Elements with data-config="<key>" are filled from `display` below,
 * e.g. <span data-config="nextBatch">30 October 2026</span>.
 * Keep the static text in the HTML in sync as a no-JS / SEO fallback.
 *
 * NEVER put API keys, CRM tokens or CAPTCHA *secret* keys in this file.
 * It is public. Secrets belong on the server (backend: to be connected).
 */
window.TTA_CONFIG = {
  siteUrl: 'https://trendytraders.in',

  display: {
    nextBatch: '30 October 2026',
    nextBatchShort: '30 Oct 2026',
    /* Personal Diamond Membership duration. Leave empty until the business
       confirms it; the card then shows "Duration to be confirmed". */
    diamondDuration: '',
    phone: '+91 72200 22266',
    email: 'update@trendytraders.in'
  },

  contact: {
    phoneHref: 'tel:+917220022266',
    emailHref: 'mailto:update@trendytraders.in',
    whatsapp: 'https://wa.me/917220022266'
  },

  /*
   * Enrol / Buy Course destinations, keyed by data-enrol="<key>".
   * The current live site routes "Join Now" to this WhatsApp link.
   * Replace with the checkout / payment page URL for each course.
   */
  enrolUrls: {
    'technical-analysis': 'https://wa.link/r1hf3x',
    'complete-combo': 'https://wa.link/r1hf3x',
    'diamond-membership': 'https://wa.link/r1hf3x',
    'classroom-program': 'https://wa.link/r1hf3x'
  },

  form: {
    /*
     * POST endpoint that receives the consultation enquiry as JSON.
     * Leave empty until the backend is connected: the form will then
     * show an honest "not connected" message instead of fake success.
     * Example: 'https://your-backend.example/enquiry'
     */
    endpoint: '',
    timeoutMs: 15000
  },

  /*
   * Optional CAPTCHA. Supported provider: 'turnstile' (Cloudflare).
   * Only the PUBLIC site key goes here. The secret key is verified
   * server-side by the backend.
   */
  captcha: {
    provider: '',
    siteKey: ''
  },

  popup: {
    /* Automatic popup: first at 5 s, then again at 25 s after landing
       (skipped if the visitor already submitted or is busy typing). */
    autoOpenDelaysMs: [5000, 25000]
  },

  analytics: {
    /* Set true to also fire fbq('track', 'Lead') on confirmed success
       when the Meta Pixel is already installed on the page. */
    metaPixelLead: false
  },

  /*
   * Genuine, permission-cleared testimonials only (not shown on the
   * current landing layout; kept for future use).
   * { quote: '', name: '', detail: 'Technical Analysis learner', sourceLabel: 'Google review', sourceUrl: 'https://...' }
   */
  testimonials: []
};
