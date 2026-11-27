<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Apply for funding | Infrastructure Grant Portal</title>
    <link rel="stylesheet" href="/portal.css">
    <script src="/portal.js" defer></script>
</head>
<body>
<a role="link" href="#main" class="skip">Skip to main content</a>
<header class="site-header">
    <div class="shell">
        <a class="brand" href="/apply">Infrastructure Grant Portal</a>
        <nav aria-label="Primary">
            <a href="/apply" aria-current="page">Application</a>
            <a href="#requirements">Requirements</a>
            <a href="#contact">Contact</a>
        </nav>
    </div>
</header>
<main class="shell" id="main" tabindex="-1">
    <div class="intro">
        <h1>Apply for infrastructure funding</h1>
        <p>Submit a preliminary request for municipal water, road, or public facility improvements.</p>
    </div>
    <div class="columns">
        <section class="application" aria-labelledby="form-title">
            <h2 id="form-title">Project application</h2>
            <p>All three fields are required.</p>
            <p id="receipt" <?= $reference === null ? 'hidden' : '' ?>><?= $reference === null ? '' : 'Application received. Reference #' . (int) $reference . '.' ?></p>
            <form action="/apply" method="post" novalidate>
                <div class="field">
                    <div class="field-label">Municipality</div>
                    <input id="municipality" name="municipality" value="<?= escape($input->values['municipality']) ?>">
                    <p class="error" data-error="municipality"><?= escape($errors['municipality'] ?? '') ?></p>
                </div>
                <div class="field">
                    <label for="email">Contact email</label>
                    <input id="email" type="email" name="email" autocomplete="email" value="<?= escape($input->values['email']) ?>">
                    <p class="error" data-error="email"><?= escape($errors['email'] ?? '') ?></p>
                </div>
                <div class="field">
                    <label for="summary">Project summary</label>
                    <p class="hint">Include the proposed work and who it will serve.</p>
                    <textarea id="summary" name="summary" rows="5"><?= escape($input->values['summary']) ?></textarea>
                    <p class="error" data-error="summary"><?= escape($errors['summary'] ?? '') ?></p>
                </div>
                <p id="request-error" role="alert" hidden></p>
                <button class="submit">Submit application</button>
            </form>
        </section>
        <aside aria-label="Applicant information">
            <section id="requirements" tabindex="-1">
                <h4>Before you apply</h4>
                <p>Check whether your project fits the program before you submit.</p>
                <button class="help-trigger" data-help style="color:white;text-decoration:none;">Open eligibility guide</button>
            </section>
            <section id="contact">
                <h3>Contact the program office</h3>
                <p>For questions about a submitted request, include your reference number.</p>
                <div class="support-links">
                    <a href="mailto:grants@example.invalid">Email</a>
                    <a href="tel:+12025550148">Call</a>
                    <a href="#requirements">FAQ</a>
                </div>
            </section>
        </aside>
    </div>
</main>
<dialog id="guide" aria-labelledby="guide-title">
    <h2 id="guide-title">Eligibility guide</h2>
    <p>Eligible requests are sponsored by a municipality and describe improvements to public infrastructure.</p>
    <form method="dialog"><button>Close guide</button></form>
</dialog>
<footer class="shell">Infrastructure Grant Portal · Training environment</footer>
</body>
</html>
