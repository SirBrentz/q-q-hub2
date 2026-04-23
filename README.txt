QUIDGET SITE — UPDATE PACK
===========================

Drop the folders into the root of your Quidget site and let them merge.
This pack replaces only the files that changed.

LATEST CHANGE (this round)
--------------------------
/treatments/index.html — all em dashes (—) removed.

Replaced 11 em dashes across the page, including 4 in <title>/meta
tags (title, description, og:title, twitter:title) and 7 in body
copy. Each replacement chose the cleanest punctuation for context:

- Title delimiters (4x): em dash → colon
- Hero sub-copy (1x): em dash → period (shorter beats)
- Weight Loss intro (1x): em dash → comma (additive)
- GFE intro (1x): em dash → period (enumeration)
- Wellness intro (1x): em dash → comma (flow)
- Women's Health intro (1x): em dash → period
- Pricing callout (1x): em dash → period + "That's"
- Sticky CTA (2x, paired): em dashes → commas (three-item sequence)

Zero em dashes remain anywhere on the page.

NOTE FOR FUTURE EDITS
---------------------
Em dashes are off-limits on this site. Any future copy changes
should avoid the — character (U+2014) and its HTML entities
(&mdash;, &#8212;, &#x2014;). Use periods, colons, commas, or
parentheses depending on context.

CUMULATIVE CHANGES IN THIS PACK
-------------------------------
- Semrush audit fixes: /robots.txt, /sitemap.xml, /llms.txt at root,
  broken CSS link removed from /get-started/, static h1 added for
  crawlers, Cloudflare email obfuscation bypassed on demo emails.
- Prescribing language removed from treatments page, homepage, 404.
- Treatments page: 7 anchor-linked sections, sticky sub-nav pills,
  two-column hero with LegitScript badge, "From $XX.XX" pricing,
  48 states + D.C. coverage claim, no category numbering.
- Nav "Treatments" dropdown with hover bridge on all 6 pages.
- LegitScript badge is a proper transparent PNG.

FILES IN THIS PACK
------------------
- /robots.txt
- /sitemap.xml
- /llms.txt
- /index.html
- /weight-loss/index.html
- /get-started/index.html
- /treatments/index.html            (em dashes removed, this round)
- /404.html
- /help/index.html
- /changelog/index.html
- /thank-you/index.html
- /assets/legitscript-certified.png

STILL TO DO (hosting/dashboard, not code)
-----------------------------------------
- HSTS: Cloudflare → SSL/TLS → Edge Certificates → enable HSTS
