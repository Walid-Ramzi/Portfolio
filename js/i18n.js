(() => {
  // fetch() resolves relative URLs against the current PAGE's location, not
  // the script file's own location — so a plain 'js/i18n/en.json' path
  // only worked from pages at the site root. Every page one folder deeper
  // (everything under /projects/) was requesting
  // '/projects/js/i18n/en.json' (404), silently failing, and falling back
  // to English (which failed the exact same way), leaving every
  // data-i18n element showing its raw key instead of real text in all
  // three languages. document.currentScript.src gives i18n.js's own real
  // URL at parse time, so resolving against that works from any depth.
  const I18N_BASE = new URL('.', document.currentScript.src).href;

  const I18n = {
    currentLang: 'en',
    translations: {},
    observers: [],

    async init() {
      const savedLang = localStorage.getItem('lang') || 'en';
      await this.loadTranslations(savedLang);
      this.applyTranslations();
      this.setupLanguageSelector();
      // Use this.currentLang (set inside loadTranslations to whatever
      // actually loaded) rather than savedLang: if the requested
      // translation file failed to fetch/parse, loadTranslations falls
      // back to English internally, and using savedLang here would set
      // dir="rtl"/lang="ar" on an English-rendered page.
      this.updateHtmlLang(this.currentLang);
    },

    async loadTranslations(lang) {
      try {
        const response = await fetch(`${I18N_BASE}i18n/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
        this.translations = await response.json();
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        // English is kept loaded as a fallback so a key that's missing from
        // another language renders English text instead of the raw key.
        if (lang === 'en') {
          this.fallback = this.translations;
        } else if (!this.fallback) {
          try {
            const enRes = await fetch(`${I18N_BASE}i18n/en.json`);
            if (enRes.ok) this.fallback = await enRes.json();
          } catch (e) { /* fallback is best-effort */ }
        }
      } catch (error) {
        console.error('i18n load error:', error);
        if (lang !== 'en') {
          await this.loadTranslations('en');
        }
      }
    },

    lookup(source, keys) {
      let value = source;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return undefined;
        }
      }
      return typeof value === 'string' ? value : undefined;
    },

    t(key) {
      const keys = key.split('.');
      const own = this.lookup(this.translations, keys);
      if (own !== undefined) return own;
      const fb = this.fallback ? this.lookup(this.fallback, keys) : undefined;
      return fb !== undefined ? fb : key;
    },

    applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = this.t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) {
            el.placeholder = translation;
          } else {
            el.value = translation;
          }
        } else if (el.hasAttribute('data-i18n-html')) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      });

      document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const attrs = el.getAttribute('data-i18n-attr').split(',');
        attrs.forEach(attr => {
          const [attrName, key] = attr.split(':');
          if (attrName && key) {
            el.setAttribute(attrName.trim(), this.t(key.trim()));
          }
        });
      });

      this.notifyObservers();
    },

    async setLanguage(lang) {
      if (lang === this.currentLang) return;
      await this.loadTranslations(lang);
      this.applyTranslations();
      this.updateHtmlLang(this.currentLang);
      this.updateLanguageSelector(this.currentLang);
    },

    updateHtmlLang(lang) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    },

    setupLanguageSelector() {
      const selector = document.getElementById('languageSelector');
      if (!selector) return;

      selector.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });

      this.updateLanguageSelector(this.currentLang);
    },

    updateLanguageSelector(lang) {
      const selector = document.getElementById('languageSelector');
      if (selector) {
        selector.value = lang;
      }
    },

    onLanguageChange(callback) {
      this.observers.push(callback);
    },

    notifyObservers() {
      this.observers.forEach(cb => cb(this.currentLang, this.translations));
    }
  };

  window.I18n = I18n;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
  } else {
    I18n.init();
  }
})();