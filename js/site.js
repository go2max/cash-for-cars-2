(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-current-year]').forEach(function (element) {
            element.textContent = new Date().getFullYear();
        });

        const toggle = document.querySelector('[data-menu-toggle]');
        const menu = document.querySelector('[data-mobile-menu]');

        if (toggle && menu) {
            toggle.addEventListener('click', function () {
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', String(!expanded));
                menu.hidden = expanded;
            });

            menu.addEventListener('click', function (event) {
                if (!event.target.closest('a')) return;
                toggle.setAttribute('aria-expanded', 'false');
                menu.hidden = true;
            });
        }
    });
}());
