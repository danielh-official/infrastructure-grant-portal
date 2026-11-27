const { test, expect } = require('@playwright/test');
const axe = require('axe-core');

const messages = {
    municipality: 'Enter your municipality.',
    email: 'Enter a contact email.',
    emailFormat: 'Enter an email in the format name@example.org.',
    summary: 'Describe the proposed project.',
};

async function runAxe(page) {
    await page.addScriptTag({ content: axe.source });
    return page.evaluate(async () => {
        const result = await window.axe.run({
            runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
        });
        return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }));
    });
}

async function tabTo(page, locator, maxTabs = 30) {
    for (let tab = 0; tab < maxTabs && !(await locator.evaluate(node => node === document.activeElement)); tab++) {
        await page.keyboard.press('Tab');
    }
    await expect(locator).toBeFocused();
}

// Focus must land somewhere useful: an invalid field, or one element (e.g. an error summary) holding every message.
function focusIdentifiesFailure(page, expected) {
    return page.evaluate((expected) => {
        const focused = document.activeElement;
        if (!focused || focused === document.body || focused === document.documentElement) return false;
        return focused.matches('[aria-invalid="true"]')
            || expected.every(message => focused.textContent.includes(message));
    }, expected);
}

test.beforeEach(async ({ page }) => {
    await page.goto('/apply');
});

test('axe reports no violations within this rule set', async ({ page }) => {
    expect(await runAxe(page)).toEqual([]);
});

test('axe reports no violations with errors shown, at a narrow viewport, and with the guide open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 340 });
    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page.getByText(messages.email)).toBeVisible();
    expect(await runAxe(page)).toEqual([]);
    await page.getByRole('button', { name: 'Open eligibility guide' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await runAxe(page)).toEqual([]);
});

// A-01
test('the municipality field exposes its visible name and is announced when reached by keyboard', async ({ page }) => {
    const field = page.getByRole('textbox', { name: 'Municipality', exact: true });
    await expect(field).toHaveCount(1);
    await tabTo(page, field);
    await expect(page.locator(':focus')).toHaveAccessibleName('Municipality');
});

// A-02, JavaScript path
test('invalid submission moves focus to either the error summary or an invalid field', async ({ page }) => {
    const submit = page.getByRole('button', { name: 'Submit application' });
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(messages.email)).toBeVisible();
    await expect.poll(() => focusIdentifiesFailure(page, [messages.municipality, messages.email, messages.summary])).toBe(true);
});

test('JavaScript path: each invalid field is identified, values are kept, and a corrected form resubmits', async ({ page }) => {
    const municipality = page.getByLabel('Municipality');
    const email = page.getByLabel('Contact email');
    const summary = page.getByLabel('Project summary');
    await municipality.fill('Example Township');
    await email.fill('not-an-email');
    await page.getByRole('button', { name: 'Submit application' }).focus();
    await page.keyboard.press('Enter');

    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription(new RegExp(messages.emailFormat.replace('.', '\\.')));
    await expect(summary).toHaveAttribute('aria-invalid', 'true');
    await expect(summary).toHaveAccessibleDescription(new RegExp(messages.summary));
    await expect(municipality).not.toHaveAttribute('aria-invalid', 'true');
    await expect.poll(() => focusIdentifiesFailure(page, [messages.emailFormat, messages.summary])).toBe(true);
    await expect(municipality).toHaveValue('Example Township');
    await expect(email).toHaveValue('not-an-email');

    await email.fill('clerk@example.org');
    await summary.fill('Replace failing culverts on two municipal roads.');
    await page.getByRole('button', { name: 'Submit application' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#receipt')).toHaveText(/Application received. Reference #\d+\./);
    for (const field of [municipality, email, summary]) {
        await expect(field).not.toHaveAttribute('aria-invalid', 'true');
    }
});

// A-02, native form path
test('native path: errors are signalled on load, each invalid field is identified, values are kept', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
        const page = await context.newPage();
        await page.goto('/apply');
        const municipality = page.getByLabel('Municipality');
        const email = page.getByLabel('Contact email');
        const summary = page.getByLabel('Project summary');
        await municipality.fill('Example Township');
        await email.fill('not-an-email');
        await page.getByRole('button', { name: 'Submit application' }).focus();
        await page.keyboard.press('Enter');

        // ponytail: without JS, focus can't move, so the reloaded title is what a screen reader hears first.
        await expect(page).toHaveTitle(/^Error/i);
        await expect(email).toHaveAttribute('aria-invalid', 'true');
        await expect(email).toHaveAccessibleDescription(new RegExp(messages.emailFormat.replace('.', '\\.')));
        await expect(summary).toHaveAttribute('aria-invalid', 'true');
        await expect(summary).toHaveAccessibleDescription(new RegExp(messages.summary));
        await expect(municipality).not.toHaveAttribute('aria-invalid', 'true');
        await expect(municipality).toHaveValue('Example Township');
        await expect(email).toHaveValue('not-an-email');

        await email.fill('clerk@example.org');
        await summary.fill('Replace failing culverts on two municipal roads.');
        await page.getByRole('button', { name: 'Submit application' }).click();
        await expect(page.locator('#receipt')).toHaveText(/Application received. Reference #\d+\./);
        await expect(page).not.toHaveTitle(/^Error/i);
    } finally {
        await context.close();
    }
});

// A-03
test('the first tab reaches a bypass link that moves focus to main', async ({ page }) => {
    await page.keyboard.press('Tab');
    const bypass = page.getByRole('link', { name: /skip to (main )?content/i });
    await expect(bypass).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
});

test('the bypass link is visible when focused', async ({ page }) => {
    await page.keyboard.press('Tab');
    const bypass = page.getByRole('link', { name: /skip to (main )?content/i });
    await expect(bypass).toBeFocused();
    await expect(bypass).toBeInViewport({ ratio: 1 });
    const box = await bypass.boundingBox();
    expect(box.width).toBeGreaterThan(10);
    expect(box.height).toBeGreaterThan(10);
});

// A-04
for (const viewport of [{ width: 390, height: 340 }, { width: 1280, height: 720 }]) {
    test(`the requirements jump leaves its focused destination visible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const link = page.getByRole('banner').getByRole('link', { name: 'Requirements' });
        await link.focus();
        await page.keyboard.press('Enter');
        const requirements = page.locator('#requirements');
        await expect(requirements).toBeFocused();

        // Top edge (the heading) must clear the sticky header, not just some sliver of the section.
        await expect.poll(() => requirements.evaluate(node => {
            const item = node.getBoundingClientRect();
            const banner = document.querySelector('header').getBoundingClientRect();
            return item.top >= banner.bottom - 1 && item.top < window.innerHeight;
        })).toBe(true);
    });
}

// A-05
test('the project summary instruction meets 4.5:1 contrast for normal-size text', async ({ page }) => {
    const hint = page.getByText('Include the proposed work and who it will serve.');
    const { ratio, foreground, background, fontSize, fontWeight } = await hint.evaluate(node => {
        const parse = value => value.match(/[\d.]+/g).map(Number);
        const luminance = ([r, g, b]) => {
            const [R, G, B] = [r, g, b].map(c => {
                c /= 255;
                return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * R + 0.7152 * G + 0.0722 * B;
        };
        // ponytail: first opaque ancestor background; ignores images, gradients, and semi-transparent layers.
        let element = node;
        let background = 'rgb(255, 255, 255)';
        while (element) {
            const color = getComputedStyle(element).backgroundColor;
            const channels = parse(color);
            if (channels.length < 4 || channels[3] === 1) {
                if (channels.length >= 3 && !(channels.length === 4 && channels[3] === 0)) { background = color; break; }
            }
            element = element.parentElement;
        }
        const style = getComputedStyle(node);
        const [lighter, darker] = [luminance(parse(style.color)), luminance(parse(background))].sort((a, b) => b - a);
        return {
            ratio: (lighter + 0.05) / (darker + 0.05),
            foreground: style.color,
            background,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
        };
    });
    test.info().annotations.push({
        type: 'A-05 measurement',
        description: `${foreground} on ${background}, ${fontSize} weight ${fontWeight}: ${ratio.toFixed(2)}:1`,
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
});

// A-06
for (const width of [320, 390]) {
    test(`contact links meet WCAG 2.5.8 target size or spacing at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 700 });
        const result = await page.locator('#contact .support-links a').evaluateAll(links => {
            const rects = links.map(link => link.getBoundingClientRect());
            const centre = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
            const small = r => r.width < 24 || r.height < 24;
            const distanceToRect = (p, r) => Math.hypot(
                Math.max(r.left - p.x, 0, p.x - r.right),
                Math.max(r.top - p.y, 0, p.y - r.bottom),
            );
            return links.map((link, i) => {
                const r = rects[i];
                const size = `${link.textContent.trim()} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`;
                if (!small(r)) return { size, ok: true };
                // Spacing exception: a 24px circle on this target's centre must not touch another target or another undersized target's circle.
                const c = centre(r);
                const ok = rects.every((other, j) => j === i || (
                    distanceToRect(c, other) >= 12
                    && (!small(other) || Math.hypot(c.x - centre(other).x, c.y - centre(other).y) >= 24)
                ));
                return { size, ok };
            });
        });
        test.info().annotations.push({ type: `A-06 measurement ${width}px`, description: result.map(r => r.size).join(', ') });
        expect(result.filter(r => !r.ok).map(r => r.size)).toEqual([]);
    });
}

// A-07
test('the keyboard can open and close the guide and return to its control', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open eligibility guide' });
    await expect(trigger).toHaveCount(1);
    await tabTo(page, trigger);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Eligibility guide' });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
});

test('the guide closes from its close button by keyboard and returns focus to its control', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open eligibility guide' });
    await tabTo(page, trigger);
    await page.keyboard.press('Space');
    const dialog = page.getByRole('dialog', { name: 'Eligibility guide' });
    await expect(dialog).toBeVisible();
    await tabTo(page, dialog.getByRole('button', { name: 'Close guide' }), 5);
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
});

// A-08
test('heading levels follow the content hierarchy without skips', async ({ page }) => {
    const headings = await page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
        .filter(node => node.checkVisibility())
        .map(node => ({ level: Number(node.tagName[1]), text: node.textContent.trim() })));
    test.info().annotations.push({ type: 'A-08 outline', description: headings.map(h => `h${h.level} ${h.text}`).join(' | ') });

    expect(headings[0]).toEqual({ level: 1, text: 'Apply for infrastructure funding' });
    expect(headings.filter(h => h.level === 1)).toHaveLength(1);
    for (let i = 1; i < headings.length; i++) {
        expect(headings[i].level, `${headings[i].text} skips a level`).toBeLessThanOrEqual(headings[i - 1].level + 1);
    }
    // Sibling sidebar sections must share a level.
    const level = text => headings.find(h => h.text === text)?.level;
    expect(level('Before you apply')).toBe(level('Contact the program office'));
});
