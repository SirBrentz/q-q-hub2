QUIDGET SITE — UPDATE PACK
===========================

Drop the folders into the root of your Quidget site and let them merge.
This pack replaces only the files that changed.

LATEST CHANGES (this round, treatments page only)
-------------------------------------------------
1. Removed the "Coverage" block (dark section that sat between the
   Good Faith Exams section and the pricing block). Its copy was
   mostly restating the hero. Gone.

2. Removed the final "Ready when you are / Launch your full treatment
   menu" CTA block. The sticky CTA bar handles that job already.

3. Replaced the hero kicker chip. Was "GFE · From $27.99 • LegitScript
   certified · nationwide". Now matches the homepage pattern:
   "v1.1.0 • Now live on clinic stores nationwide", with the version
   chip pulling dynamically from the Qualiphy roadmap API (same JS
   as the homepage, falling back to the static v1.1.0 if the API is
   unreachable).

New page flow:
  Hero → Sticky sub-nav pills → 7 treatment sections
  (Weight Loss through Good Faith Exams) → Pricing + ROI → Footer

CUMULATIVE CHANGES STILL IN THIS PACK
-------------------------------------
- /robots.txt, /sitemap.xml, /llms.txt at site root
- Treatment category order site-wide (new order: Weight Loss, Men's
  Health, Women's Health, Urgent Care, Longevity, Wellness, Good
  Faith Exams at the bottom)
- Semrush audit fixes (broken CSS removed, static h1 on /get-started/,
  email obfuscation bypass on demo mockups, em dashes removed from
  treatments page and llms.txt)
- Prescribing language removed from treatments, homepage, 404
- Two-column hero with LegitScript badge, "From $XX.XX" pricing,
  48 states + D.C. coverage claim
- Nav "Treatments" dropdown with hover bridge on all 6 pages
- LegitScript badge as proper transparent PNG

FILES IN THIS PACK
------------------
- /robots.txt
- /sitemap.xml
- /llms.txt
- /index.html
- /weight-loss/index.html
- /get-started/index.html
- /treatments/index.html            (latest: 2 blocks removed, hero chip swapped)
- /404.html
- /help/index.html
- /changelog/index.html
- /thank-you/index.html
- /assets/legitscript-certified.png

STILL TO DO (hosting/dashboard, not code)
-----------------------------------------
- HSTS: Cloudflare → SSL/TLS → Edge Certificates → enable HSTS
