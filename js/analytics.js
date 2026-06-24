(function () {
    'use strict';

    const measurementId = 'G-7D8R0SJ1WY';
    const storageKey = 'norcal_analytics_consent';
    let loaded = false;

    function getConsent() {
        try {
            return window.localStorage.getItem(storageKey);
        } catch (_) {
            return null;
        }
    }

    function setConsent(value) {
        try {
            window.localStorage.setItem(storageKey, value);
        } catch (_) {
            // Consent remains valid for this page even if storage is unavailable.
        }
    }

    function loadAnalytics() {
        if (loaded || getConsent() !== 'granted') return;
        loaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        document.head.appendChild(script);
    }

    function track(name, parameters) {
        if (getConsent() !== 'granted' || typeof window.gtag !== 'function') return;
        window.gtag('event', name, parameters || {});
    }

    function updateBanner() {
        const banner = document.getElementById('analytics-consent');
        if (!banner) return;
        banner.hidden = getConsent() === 'granted' || getConsent() === 'denied';
    }

    function revokeAnalytics() {
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', { analytics_storage: 'denied' });
        }
        document.cookie.split(';').forEach(function (cookie) {
            const name = cookie.split('=')[0].trim();
            if (name === '_ga' || name.startsWith('_ga_')) {
                document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        const accept = document.getElementById('analytics-accept');
        const decline = document.getElementById('analytics-decline');
        const manage = document.getElementById('analytics-manage');

        if (accept) {
            accept.addEventListener('click', function () {
                setConsent('granted');
                updateBanner();
                loadAnalytics();
            });
        }

        if (decline) {
            decline.addEventListener('click', function () {
                revokeAnalytics();
                setConsent('denied');
                updateBanner();
            });
        }

        if (manage) {
            manage.addEventListener('click', function () {
                const banner = document.getElementById('analytics-consent');
                if (banner) banner.hidden = false;
            });
        }

        document.addEventListener('click', function (event) {
            const link = event.target.closest('[data-analytics]');
            if (!link) return;
            track(link.dataset.analytics, {
                link_location: link.dataset.analyticsLocation || 'page'
            });
        });

        updateBanner();
    });

    window.NorCalAnalytics = { track: track };
    loadAnalytics();
}());
