# Simulated consultant report

**Scope** · Municipal project application at `/apply`, its supporting content, and the eligibility guide. Use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) when classifying findings. Priorities below reflect this portal’s primary workflow.

| ID | Priority | Observation | Acceptance evidence |
| --- | --- | --- | --- |
| A-01 | High | A screen reader announces a text field near the top of the form without identifying it as Municipality. | The field exposes its visible name in the accessibility tree and is announced when reached by keyboard. |
| A-02 | High | Submit the form with missing or invalid values. Errors appear on screen, while focus and screen reader feedback give little indication of what failed. | With keyboard and a screen reader, a user can discover the failure and identify each invalid field, correct it, and resubmit. Previously entered values are preserved. Verify the JavaScript and native form paths. |
| A-03 | Medium | Press Tab from a fresh page load. There is no visible way to skip the repeated header navigation. | A keyboard user can reach and activate a visible bypass link and arrive at the main content. |
| A-04 | High | At a 390 × 340 CSS pixel viewport, activate Requirements from the header using the keyboard. The sticky header can cover the focused destination. | The focused destination remains visible when arriving by keyboard at that viewport and at a wider viewport. |
| A-05 | Medium | The instruction under Project summary is faint against its background. | Measure the instruction’s foreground and background and record the result for normal-size text. |
| A-06 | Medium | On a touch device, the compact links inside Contact the program office are difficult to hit individually. | Measure the hit areas and adjacent spacing at a narrow viewport and record which WCAG target-size provisions apply. |
| A-07 | High | The eligibility guide opens with a pointer. A keyboard user cannot reach and activate its visible control. | Using only the keyboard, open the guide, confirm focus moves inside it, close it, and continue from the control that opened it. |
| A-08 | Medium | The headings list makes Before you apply appear to sit at the wrong level relative to nearby sections. | Review the headings list and demonstrate that levels reflect the content hierarchy across the form and sidebar. |

Please include the affected workflow, actual and expected behavior, test environment, evidence, and retest status in your response. If you need clarification, record the question you would send to the consultant and state the assumption you used for local testing.
