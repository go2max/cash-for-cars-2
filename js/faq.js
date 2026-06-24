(function () {
    'use strict';

    function categoryFor(question) {
        const text = question.toLowerCase();
        if (/title|registration|document|paperwork|loan|lien|name isn|someone else|out of state/.test(text)) return 'paperwork';
        if (/pickup|tow|home|apartment|garage|cancel/.test(text)) return 'pickup';
        if (/paid|payment|fee|offer|quote|value|determine/.test(text)) return 'offers';
        if (/run|accident|total|missing|condition|expired|salvage|rebuilt|key|classic|antique/.test(text)) return 'condition';
        return 'general';
    }

    document.addEventListener('DOMContentLoaded', function () {
        const accordion = document.querySelector('.accordion');
        if (!accordion) return;

        const buttons = Array.from(accordion.querySelectorAll('.accordion-btn'));
        const search = document.getElementById('faq-search');
        const filters = Array.from(document.querySelectorAll('[data-faq-filter]'));
        const empty = document.getElementById('faq-empty');
        let activeCategory = 'all';

        buttons.forEach(function (button, index) {
            const panel = button.nextElementSibling;
            const id = 'faq-panel-' + (index + 1);
            button.type = 'button';
            button.dataset.category = categoryFor(button.textContent);
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-controls', id);
            panel.id = id;
            panel.hidden = true;

            button.addEventListener('click', function () {
                const expanded = button.getAttribute('aria-expanded') === 'true';
                button.setAttribute('aria-expanded', String(!expanded));
                button.classList.toggle('active', !expanded);
                panel.hidden = expanded;
            });
        });

        function applyFilters() {
            const term = (search?.value || '').trim().toLowerCase();
            let visible = 0;

            buttons.forEach(function (button) {
                const panel = button.nextElementSibling;
                const matchesCategory = activeCategory === 'all' || button.dataset.category === activeCategory;
                const matchesTerm = !term || (button.textContent + ' ' + panel.textContent).toLowerCase().includes(term);
                const show = matchesCategory && matchesTerm;
                button.hidden = !show;
                panel.hidden = true;
                button.classList.remove('active');
                button.setAttribute('aria-expanded', 'false');
                if (show) visible += 1;
            });

            if (empty) empty.hidden = visible !== 0;
        }

        filters.forEach(function (filter) {
            filter.addEventListener('click', function () {
                activeCategory = filter.dataset.faqFilter;
                filters.forEach(function (item) {
                    item.classList.toggle('active', item === filter);
                    item.setAttribute('aria-pressed', String(item === filter));
                });
                applyFilters();
            });
        });

        search?.addEventListener('input', applyFilters);
    });
}());
