(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const message = document.getElementById('form-message');
        const submit = form.querySelector('[type="submit"]');
        const clear = document.getElementById('clearBtn');
        const startedAt = form.querySelector('[name="_started_at"]');
        let startedTracked = false;

        if (startedAt) startedAt.value = String(Date.now());

        form.addEventListener('input', function () {
            if (startedTracked) return;
            startedTracked = true;
            window.NorCalAnalytics?.track('offer_start', { form_name: 'vehicle_offer' });
        }, { once: true });

        if (clear) {
            clear.addEventListener('click', function () {
                form.reset();
                if (startedAt) startedAt.value = String(Date.now());
                if (message) {
                    message.textContent = '';
                    message.className = 'form-message';
                }
            });
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                if (message) {
                    message.textContent = 'Please complete the required fields.';
                    message.className = 'form-message error';
                }
                return;
            }

            if (submit) submit.disabled = true;
            if (message) {
                message.textContent = 'Sending your request...';
                message.className = 'form-message';
            }

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new URLSearchParams(new FormData(form)),
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin'
                });
                const rawBody = (await response.text()).trim();
                let body = rawBody;
                if (response.headers.get('content-type')?.includes('application/json')) {
                    body = JSON.parse(rawBody).message === 'Request received' ? 'success' : rawBody;
                }

                if (!response.ok || body !== 'success') {
                    throw new Error('Submission rejected');
                }

                if (message) {
                    message.textContent = 'Request received. We will contact you soon.';
                    message.className = 'form-message success';
                }
                window.NorCalAnalytics?.track('generate_lead', { form_name: 'vehicle_offer' });
                form.reset();
                if (startedAt) startedAt.value = String(Date.now());
            } catch (_) {
                if (message) {
                    message.textContent = 'We could not send your request. Please call 279-675-1575.';
                    message.className = 'form-message error';
                }
            } finally {
                if (submit) submit.disabled = false;
            }
        });
    });
}());
