# Did China Win Its War on Smog?

An interactive data visualization exploring PM2.5 readings in Beijing, Shenyang, Chengdu, Shanghai and Guangzhou from 2010 to 2015. It follows the January 2013 pollution episode in Beijing, compares changes across the five monitors, and examines how missing data and wind conditions affect the interpretation.

The website is hosted on GitHub Pages. It is built with HTML, CSS, JavaScript and D3.js, using precomputed JSON data.

## Run locally

Serve the project directory with any static HTTP server. For example, with Python 3 installed:

```sh
git clone https://github.com/digi1450/china-smog-data-story.git
cd china-smog-data-story
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://127.0.0.1:8000) in a browser. Stop the server with Ctrl+C. Depending on the installation, the Python command may be `python` or `py` instead of `python3`.

An HTTP server is needed because the site uses JavaScript modules and loads JSON files. There is no build step or package installation. The `npm start` shortcut runs the same Python server.

After editing JavaScript or CSS, run `python3 scripts/version_assets.py` (or `npm run assets`) to update content-based cache versions. The script updates the style entry point and local module URLs together. `npm run assets:check` checks them without changing files.

Run `npm test` to check module dependencies, asset versioning and scroll intent. Data verification is available separately through `npm run check` and requires the raw source files.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html` | Page content and source references |
| `css/` | Theme, shared styles, layouts, explorer and presentation scenes; `style.css` loads them in order |
| `js/app.js` | Application initialization and rendering |
| `js/explorer.js`, `js/actions.js` | Explorer controls and requests from charts |
| `js/presentation.js`, `js/navigation.js` | Slide movement and internal links |
| `js/charts/` | Individual chart renderers |
| `assets/vendor/` | D3.js and its licence |
| `data/processed/` | Data used by the website |
| `data/raw/` | Downloaded source files, kept locally and ignored by Git |
| `scripts/` | Data preparation and verification scripts |

## Data

The project uses [PM2.5 Data of Five Chinese Cities](https://archive.ics.uci.edu/dataset/394/pm2%2B5%2Bdata%2Bof%2Bfive%2Bchinese%2Bcities) from the UCI Machine Learning Repository. The dataset is also available on [Kaggle](https://www.kaggle.com/uciml/pm25-data-for-five-chinese-cities). Calculations in this repository use the UCI download.

The dataset contains hourly PM2.5 measurements and meteorological variables. The main charts use one U.S. diplomatic-post monitoring series per city; nearby Chinese monitoring series are used for comparison. Source data are licensed under CC BY 4.0.

Citation: Chen, S. (2016). *PM2.5 Data of Five Chinese Cities* [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C52K58.

### Rebuild the chart data

The processed data are included, so downloading the raw files is only necessary to recalculate or verify the results. The scripts require Python 3.10 or later and use the standard library.

1. Download [the UCI archive](https://archive.ics.uci.edu/static/public/394/pm2%2B5%2Bdata%2Bof%2Bfive%2Bchinese%2Bcities.zip).
2. Extract the ZIP, then extract `FiveCitiePMData.rar` inside it using an archive tool that supports RAR files.
3. Place these five files directly in `data/raw/`:

```text
BeijingPM20100101_20151231.csv
ChengduPM20100101_20151231.csv
GuangzhouPM20100101_20151231.csv
ShanghaiPM20100101_20151231.csv
ShenyangPM20100101_20151231.csv
```

From the project directory, run:

```sh
python3 scripts/prepare_data.py
python3 scripts/verify_data.py
```

The preparation script writes `data/processed/analysis.json`. The verification script checks calculations against the raw files and validates their SHA-256 hashes against the processed manifest. Keep the source files unchanged.

## Method

- Daily means require at least 18 valid hourly readings. Monthly means require at least 15 valid days. Annual means weight valid days equally.
- Missing, negative and non-finite readings are excluded. Missing values are not replaced with zero.
- The five-city annual comparison uses 2014 and 2015, with valid-day counts shown. A separate comparison pairs calendar dates available in both years to examine the effect of missing days.
- High-pollution-day shares count daily means above 150 µg/m³ and divide by the number of valid days.
- The Beijing wind comparison uses 2011–2012 and 2014–2015. A sensitivity check applies common weights to matching calendar-month and wind-category groups with at least five eligible days per period.

## Interpretation

The records describe individual monitors rather than citywide or national averages. Both years in the five-city comparison are after the September 2013 Action Plan, and the dataset ends before the plan's 2017 deadline. These comparisons describe observed changes; they do not establish a causal policy effect or whether the plan met its targets.

Missing observations and weather differences can affect the results. The wind sensitivity check accounts for month and wind-category composition, rather than all meteorological factors. WHO 2021 guideline values are labelled as retrospective references when applied to these historical measurements.

Policy, research and WHO references are listed in the website's **Sources & method** section.
