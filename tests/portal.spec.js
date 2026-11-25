const { test, expect } = require('@playwright/test');

const applicant = {
    municipality: 'Example Township',
    email: 'clerk@example.org',
    summary: 'Replace failing culverts on two municipal roads.',
};

async function fillApplication(page) {
    await page.locator('#municipality').fill(applicant.municipality);
    await page.getByLabel('Contact email').fill(applicant.email);
    await page.getByLabel('Project summary').fill(applicant.summary);
}

test('submits an application and shows its reference', async ({ page, request }) => {
    const before = await (await request.get('/api/applications')).json();
    await page.goto('/apply');
    await fillApplication(page);
    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page.locator('#receipt')).toHaveText(/Application received. Reference #\d+\./);
    const after = await (await request.get('/api/applications')).json();
    expect(after.applicationCount).toBe(before.applicationCount + 1);
});

test('validates on the server and preserves input without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
        const page = await context.newPage();
        await page.goto('/apply');
        await page.locator('#municipality').fill(applicant.municipality);
        await page.getByRole('button', { name: 'Submit application' }).click();
        await expect(page.getByText('Enter a contact email.')).toBeVisible();
        await expect(page.locator('#municipality')).toHaveValue(applicant.municipality);

        await fillApplication(page);
        await page.getByRole('button', { name: 'Submit application' }).click();
        await expect(page.locator('#receipt')).toHaveText(/Application received. Reference #\d+\./);
        await page.reload();
        await expect(page.locator('#receipt')).toBeHidden();
    } finally {
        await context.close();
    }
});

test('the JSON API returns useful validation and protocol errors', async ({ request }) => {
    const invalid = await request.post('/api/applications', { data: { email: 'bad' } });
    expect(invalid.status()).toBe(422);
    expect(await invalid.json()).toEqual({ errors: {
        municipality: 'Enter your municipality.',
        email: 'Enter an email in the format name@example.org.',
        summary: 'Describe the proposed project.',
    } });
    for (const data of ['{', '[]', 'null']) {
        const response = await request.post('/api/applications', {
            headers: { 'Content-Type': 'application/json' },
            data,
        });
        expect(response.status()).toBe(400);
    }
    expect((await request.post('/api/applications', { data: 'text' })).status()).toBe(415);
    expect((await request.delete('/api/applications')).status()).toBe(405);
});
