const { test, expect } = require('@playwright/test');
const axe = require('axe-core');

test.beforeEach(async ({ page }) => {
    await page.goto('/apply');
});

test('axe reports no violations within this rule set', async ({ page }) => {
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
        const result = await window.axe.run({
            runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
        });
        return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }));
    });
    expect(violations).toEqual([]);
});

test('the first tab reaches a bypass link that moves focus to main', async ({ page }) => {
    await page.keyboard.press('Tab');
    const bypass = page.getByRole('link', { name: /skip to (main )?content/i });
    await expect(bypass).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
});

test('the keyboard can open and close the guide and return to its control', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open eligibility guide' });
    await expect(trigger).toHaveCount(1);
    for (let tab = 0; tab < 20 && !(await trigger.evaluate(node => node === document.activeElement)); tab++) {
        await page.keyboard.press('Tab');
    }
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Eligibility guide' });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
});

test('invalid submission moves focus to either the error summary or an invalid field', async ({ page }) => {
    const submit = page.getByRole('button', { name: 'Submit application' });
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Enter a contact email.')).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
        const focused = document.activeElement;
        return focused.matches('input[aria-invalid="true"], textarea[aria-invalid="true"]')
            || focused.textContent.includes('Enter a contact email.');
    })).toBe(true);
});

test('the requirements jump leaves its focused destination visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 340 });
    const link = page.getByRole('link', { name: 'Requirements' });
    await link.focus();
    await page.keyboard.press('Enter');
    const requirements = page.locator('#requirements');
    await expect(requirements).toBeFocused();

    await expect.poll(() => requirements.evaluate(node => {
        const item = node.getBoundingClientRect();
        const banner = document.querySelector('header').getBoundingClientRect();
        return item.bottom > banner.bottom && item.top < window.innerHeight;
    })).toBe(true);
});
