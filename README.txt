QUIDGET SITE — UPDATE PACK
===========================

Drop the folders into the root of your Quidget site and let them merge.
This pack replaces only the files that changed.

LATEST CHANGES (this round)
---------------------------
"Prescribing" language removed from:

1. /treatments/index.html (8 spots cleaned)
   - LegitScript badge description: "...telehealth and prescribing"
     → "...telehealth and patient care"
   - Weight Loss intro: "metabolic prescriptions" → "metabolic Rx support"
   - Longevity intro: "longevity-focused prescribing"
     → "longevity-focused care"
   - Longevity card title: "Longevity Prescribing" → "Longevity Rx Support"
   - Wellness card subtitle: "Wellness prescribing" → "Wellness Rx support"
   - Sexual Wellness card subtitle: "Regenerative & prescribing"
     → "Regenerative & Rx"
   - Acute & Everyday card subtitle: "Fast-turnaround prescribing"
     → "Fast-turnaround Rx support"
   - Urgent Care H2: "On-demand prescribing for acute conditions"
     → "On-demand care for acute conditions"

2. /index.html (1 spot)
   - Pharmacy network section: "Prescriptions route to..."
     → "Medication orders route to..."

3. /404.html (1 spot)
   - Medical pun reworked: "This page wasn't prescribed."
     → "This page wasn't on the chart."

NOT TOUCHED YET — needs your call
---------------------------------
Two other surfaces still contain prescribing language, but I didn't
remove them because they're structural to what's being described:

A. /weight-loss/index.html — 15 occurrences
   The GLP-1 landing page describes the end-to-end flow
   (intake → provider visit → prescription → pharmacy → shipping).
   The word is woven through the product explanation, the "How it
   works" steps, the FAQ, and the pharmacy-routing copy. Removing it
   requires a substantive rewrite of the product messaging, not a
   simple find/replace. Let me know if you want me to take a pass
   and I'll reframe to "Rx / medication / treatment" language.

B. /help/index.html — 1 occurrence
   A support FAQ titled "Prescription not created after approval" —
   a troubleshooting topic admins search for. Renaming it may break
   expected-error-label recognition. Your call whether to rename.

Setup wizard (/get-started/) also has a few internal references
in the admin onboarding (e.g. "Test Prescription Approve" button
label inside Qualiphy's admin UI, not customer-facing on the
marketing site) — also left untouched.

FILES IN THIS PACK
------------------
- /treatments/index.html ............ prescribing removed (latest)
- /index.html ....................... prescribing removed (latest)
- /404.html ......................... prescribing removed (latest)
- /weight-loss/index.html ........... hover bridge only (unchanged copy)
- /help/index.html .................. hover bridge only
- /changelog/index.html ............. hover bridge only
- /thank-you/index.html ............. hover bridge only
- /assets/legitscript-certified.png . transparent PNG

CUMULATIVE CHANGES STILL IN THIS PACK
-------------------------------------
- Treatments page: 7 anchor-linked sections, sticky sub-nav pills,
  two-column hero, "From $27.99" / "From $49.99" pricing language
  throughout, 48 states + D.C. coverage claim, category chips without
  01-07 numbers.
- Nav "Treatments" item on all 6 pages has a 7-item hover dropdown
  with an invisible hover-bridge fix + nested mobile submenu.
- LegitScript badge is a proper transparent PNG (hexagon only).

FILES NOT TOUCHED AT ALL
------------------------
- /get-started/ (React onboarding wizard — no public nav)
- All other CSS, images, fonts
