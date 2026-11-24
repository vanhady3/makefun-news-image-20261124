# Design brief — news-image-20261124 (REVISED 24 Nov 07:42 WIB per user: SE-MENARIK MUNGKIN)

## Competition
"Sum up 24 November's world news in one image". $100 pot, 50 places.
Program: main.ts (Node, stdlib only), writes one 1024x1024 PNG (<=1 MiB) to
/output/entry.png. No network at runtime. Two runs must be byte-identical.
Judge: AI picture editor, pairwise; image must NAME the day (24 November 2026),
show the day's most consequential stories across regions/fields, read clearly,
stay faithful to reported facts, one clean composition, legible at ~300px.

## USER DIRECTION (24 Nov 07:42 WIB)
Make it AS ATTRACTIVE AS POSSIBLE — news AND image, no sloppiness. Pick the
BIGGEST, MOST VISUAL stories that read straight from the picture. Strong
composition, clear subject, good contrast, tidy visual hierarchy, LITTLE text,
BIG and readable. The image must stand out at first glance against hundreds
of others. Critically inspect the result and fix anything messy, cut off, or
slapped together before finishing.

## Verified stories (live search, 24 Nov 2026 morning)
1. LEAD — NVIDIA / JENSEN HUANG RETURNS: board reinstates Huang as CEO 11 days
   after he resigned; Nvidia shares +31% on Monday; Nasdaq +6.5%, S&P +4.7%,
   Dow +3%. Trump pressed for the return; Democrats raised corruption concerns.
2. COP31 COLLAPSES: climate summit in Antalya, Turkiye ends without a deal on
   fossil fuels; draft text drops any mention of phasing them out.
3. WARSHIP ABLAZE AT BENGHAZI: Russian Navy missile corvette (believed Merkury)
   destroyed by explosion and fire at Benghazi port after a suspected Ukrainian
   drone strike; Kyiv claims hits on two Russian ships off Libya; Russian cargo
   ship Sparta II ablaze off Finland after a drone attack.
4. GAZA — A POISONED LAND: Oxfam + CEOBS report: Israel's assault left Gaza's
   air, soil and water laced with heavy metals, explosive residue, asbestos and
   dioxins — dangerous for decades.
5. FOOTER BRIEFS: Bitcoin rebounds off its 2-year low (weekend low ~$55,100,
   lowest since Sept 2024) back above $61,000; Sudan drone strikes kill four
   near Khartoum; Indonesia factory fire kills 24 in Banten; Lisbon thousands
   march over living costs. (Crypto CHECKED live 24 Nov 07:43 WIB: the BTC
   bounce is real and big, but the Nvidia day is bigger and cleaner as the
   lead — +31% in one day, Nasdaq +6.5% — so crypto is NOT forced as lead;
   it earns the first footer slot as the day's other big markets story.)

## Layout (1024x1024, BOLD POSTER — dark navy, gold, bright green)
- Background deep navy #0f1c33 full bleed; gold frame inset 12, 4px.
- Top: "TUESDAY 24 NOVEMBER 2026" gold scale 3 centred (y36), thin gold rules
  either side. The day is named big and first.
- HERO panel x28..996 y84..600, lighter navy #16263f, steel frame:
  headline "HUANG IS BACK" white scale 8 centred (y104); subhead gold scale 2
  "NVIDIA BRINGS BACK ITS FOUNDER AS CEO" (y172); stat line bright-green
  scale 2 "SHARES +31% | NASDAQ +6.5% | S&P +4.7% | DOW +3%" (y198);
  LEFT: giant green chip (230px) labelled NVDA / NVIDIA with gold pins
  (x110 y250); RIGHT: steep rising chart, bright-green 6px polyline with
  arrowhead, axes + faint grid, "+31%" scale 9 top-left of chart area;
  one body line scale 1 centred (y572): "THE BOARD BOWED TO PRESSURE FROM
  TRUMP AND INVESTORS".
- Gold divider y618.
- BOTTOM ROW y640..940, three panels w304 (x28 / 360 / 692), lighter navy,
  steel frame: kicker gold scale 1, headline white scale 3 centred (2-3 lines),
  ONE clear illustration each, one body line scale 1:
  1. COP31 "CLIMATE / TALKS / COLLAPSE" — orange sun + cracked brown ground;
     body "ANTALYA: NO FOSSIL-FUEL DEAL".
  2. BENGHAZI "WARSHIP / ABLAZE" — dark ship silhouette on blue sea, orange
     flames, grey smoke; body "RUSSIAN CORVETTE SUNK OFF LIBYA".
  3. GAZA "A POISONED / LAND" — gold warning triangle with "!";
     body "OXFAM: TAINTED FOR DECADES".
- Footer y962 scale 1 centred grey: "ALSO: BITCOIN REBOUNDS OFF 2-YEAR LOW,
  BACK ABOVE $61,000 | SUDAN DRONE STRIKES KILL FOUR | INDONESIA FACTORY
  FIRE KILLS 24 | LISBON MARCHES OVER PRICES".

## Implementation (fresh code, stdlib only)
- Own rasterizer: RGB buffer, fillRect, Bresenham line, filled circle,
  triangle fill, 5x7 bitmap font (own glyphs, A-Z 0-9 punctuation), word wrap.
- PNG encoder: node:zlib deflateSync level 9, filter 0, colour type 2, own CRC32.
- No Date, no Math.random, no network: every coordinate and colour fixed.
- Output path: argv[2] or "/output/entry.png"; create parent dir if missing.
- Verify: run twice, sha256 equal, 1024x1024, <= 1 MiB, VIEW the image and
  fix anything messy/cut off before finishing.
