# Infrastructure Grant Portal

A mock municipal funding application for the I-Bank technical interview. Use it as an existing codebase you’ve inherited. The application works with mouse input, and the simulated consultant report identifies eight accessibility findings for you to investigate.

## Run it

Requires PHP 8.3 or newer with PDO SQLite and mbstring. From the project directory:

```sh
php -S 127.0.0.1:8000 -t public
```

Open [the application](http://127.0.0.1:8000/apply). Use fictional applicant data. SQLite creates `var/portal.sqlite` on the first database request. Set `PORTAL_DB` to a different file if you want a clean dataset.

The checkout starts on `feature/wcag-remediation`. Use `baseline/inaccessible` to reproduce the original findings or compare your changes with `git diff baseline/inaccessible`.

## Your assignment

Start with [the simulated consultant report](AUDIT.md). Reproduce **A-02** before writing code. Submit an empty application by keyboard, then repeat with VoiceOver and Safari if available. Write down what focus does, what you hear, and whether any previously entered data stays in place.

For your mock PR, explain the user impact, where you made the change, how you tested both form paths, and what remains for consultant review. Use the [remediation report template](REMEDIATION.md) to capture the evidence.

## Application flow

| Entry point | Behavior |
| --- | --- |
| `GET /apply` | Renders the form and displays any one-time, session-backed reference from a native form submission. |
| `POST /apply` | Handles native form submissions. Invalid input re-renders the form with HTTP 422. Successful input writes to SQLite and redirects with HTTP 303. |
| `POST /api/applications` | Accepts a JSON object with `municipality`, `email`, and `summary`. Returns HTTP 201 with a reference or HTTP 422 with field errors. This path uses no PHP session. |
| `GET /api/applications` | Returns a count for checking writes during the exercise. It exposes no application records. |

`public/index.php` routes requests, `src/ApplicationInput.php` shares validation between form and API, and `src/Applications.php` persists records. The PHP template renders the form, and vanilla JavaScript enhances submission with `fetch`. Compare session state, persisted application data, and per-request API inputs when rehearsing the JD’s architecture questions.

## Checks

With Node.js 22 or newer, install the pinned test dependencies and browser:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:audit
```

The functional suite exercises DB persistence, native form fallback, and API errors. The audit suite contains deliberately failing acceptance checks. It uses axe-core plus direct Playwright checks for keyboard and focus behavior. Record screen reader observations manually. The test runner serves the app on port 8319 with an isolated database. GitHub Actions runs the functional checks on both branches and also runs the audit checks on the remediation branch and pull requests.

The current slice covers web application remediation and release checks. A later exercise can add an Office/Acrobat document findings ticket.
