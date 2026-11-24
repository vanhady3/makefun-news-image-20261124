# News in One Image — 24 November 2026

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-2fd06a)](https://make.fun/r/6yqrkbx0)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A program that draws one image summing up the world's news of
**Tuesday 24 November 2026** — a bold poster, not a wall of text.

## The day, in one image

- **HUANG IS BACK** — Nvidia reinstates Jensen Huang as CEO 11 days after he
  resigned; shares soar 31% as the Nasdaq jumps 6.5%, the S&P 500 4.7% and the
  Dow 3%. (Reuters)
- **CLIMATE TALKS COLLAPSE** — COP31 in Antalya ends with no deal on fossil
  fuels. (Guardian / NYT / CNN)
- **WARSHIP ABLAZE** — a Russian missile corvette is destroyed at Benghazi
  port after a suspected Ukrainian drone strike. (Al Jazeera / Guardian)
- **A POISONED LAND** — Oxfam and CEOBS: Gaza's air, soil and water are laced
  with heavy metals, explosive residue, asbestos and dioxins for decades.
- Also: Bitcoin rebounds off its 2-year low back above $61,000; Sudan drone
  strikes kill four near Khartoum; Indonesia factory fire kills 24; Lisbon
  marches over living costs.

## Run it

```sh
node main.ts out/entry.png
```

Node 22+ stdlib only — no dependencies, no network. The program draws the
1024×1024 PNG with its own rasterizer, 5×7 bitmap font and PNG encoder.
Every run writes identical bytes.

## Entry

Built for the [make.fun](https://make.fun/r/6yqrkbx0) bounty
`news-image-20261124` — sum up 24 November's world news in one image.
