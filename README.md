# Did China Win Its War on Smog?

An English-language, buildless D3 data story about early PM2.5 changes at five U.S. diplomatic-post monitors in China, 2010–2015. The supplied prototype's typography, colours, map explorer and chart layout are retained. This repository contains the source and reproducible data pipeline; the website has not been deployed.

## Open in VS Code

Open this folder, right-click `index.html`, then **Open with Live Server**.

Alternatively, from this directory:

```sh
npm start
```

Open [the local preview](http://127.0.0.1:8000). Stop the server with Ctrl+C. Do not double-click `index.html`: ES modules and JSON fetches need HTTP. No npm install, backend, API key, Python packages or bundler is needed.

## Files to edit

| Path | Purpose |
| --- | --- |
| `index.html` | English narrative, chapter structure, sources |
| `css/style.css` | Original visual style plus responsive additions |
| `js/main.js` | Startup and visible loading-error handling |
| `js/app.js` | City selection, timeline, playback and detail panel |
| `js/core.js` | Shared state, labels, concentration bins and utilities |
| `js/data.js` | Load local JSON and map geometry |
| `js/charts/` | Map, monthly mini-chart, daily stripes, comparison, wind, station agreement and added story charts |
| `data/raw/` | UCI archive and original five CSV files |
| `data/processed/` | Calculated observations, statistics and map geometry |
| `scripts/prepare_data.py` | Reproducible calculation pipeline; Python standard library only |
| `scripts/verify_data.py` | Independent numerical checks from raw files |
| `assets/vendor/` | Local D3 7.9.0 and licence |

## Recompute and verify

```sh
npm run data
npm run check
```

Run these after changing calculation rules. The site reads the resulting JSON, and all main numerical findings update from it. Raw CSV files are deliberately preserved. Display rounding does not determine classification thresholds.

## Evidence boundaries

- Five monitors are not citywide means or a national sample.
- 2014 and 2015 are both after the plan; this comparison is descriptive.
- Beijing's wind check uses 2011–2012 and 2014–2015, excluding 2013.
- The month × wind weighting is a limited sensitivity check, not a causal estimate or a reproduction of the paper's full meteorological adjustment.
- Missingness remains relevant even with completeness rules. Shenyang's small change reverses direction in the paired-calendar check.
- UCI files were downloaded and checked. Kaggle file equivalence has not been established.
- D3, JSON and map geometry are local. Google Fonts is optional; system fonts are the fallback when offline.

## Data and method

Measurements come from [UCI dataset 394](https://archive.ics.uci.edu/dataset/394/pm2%2B5%2Bdata%2Bof%2Bfive%2Bchinese%2Bcities), licensed CC BY 4.0. Cite Chen, S. (2016), *PM2.5 Data of Five Chinese Cities*, doi:10.24432/C52K58. Each CSV's SHA-256 hash and columns are recorded in `data/processed/analysis.json` under `manifest`.

Daily means require at least 18 valid hourly readings; monthly means require at least 15 valid days. Annual means weight valid days equally. Missing, negative and non-finite values are excluded, never replaced with zero. These are project completeness rules, not regulatory certification. High-pollution-day shares count unrounded daily means above 150 µg/m³ and divide by valid days.

The Beijing sensitivity check uses dominant recorded wind categories, excluding tied modes. Shared calendar-month × wind groups need at least five eligible days in each period. Both periods receive the same weights: the average of each group's share of retained days in the two periods. This adjusts composition for month and wind category only.

The website's **Sources & reproducible method** section contains policy and WHO references, aggregation rules and limitations. The calculation and verification scripts remain available in this repository.

## Future submission

The static entry point is `index.html`; it can be hosted on GitHub Pages with its relative assets unchanged. Deployment is not part of this revision. The assignment's two-page design rationale PDF and presentation have not been produced in this task.
