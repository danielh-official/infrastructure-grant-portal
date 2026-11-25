const form = document.querySelector('form[action="/apply"]');
const receipt = document.querySelector('#receipt');
const requestError = document.querySelector('#request-error');
const submit = form.querySelector('button');
const guide = document.querySelector('#guide');

document.querySelector('[data-help]').addEventListener('click', () => guide.showModal());

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;

    const payload = Object.fromEntries(new FormData(form));
    receipt.hidden = true;
    requestError.hidden = true;
    for (const element of form.querySelectorAll('[data-error]')) {
        element.textContent = '';
    }

    submit.disabled = true;
    try {
        const response = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (response.status === 422) {
            const { errors } = await response.json();
            for (const element of form.querySelectorAll('[data-error]')) {
                element.textContent = errors[element.dataset.error] ?? '';
            }
            return;
        }

        if (!response.ok) throw new Error('Submission failed');
        const { reference } = await response.json();
        form.reset();
        receipt.textContent = 'Application received. Reference #' + reference + '.';
        receipt.hidden = false;
    } catch {
        requestError.hidden = false;
        requestError.textContent = 'We could not confirm your submission. Contact the program office for help.';
    } finally {
        submit.disabled = false;
    }
});
