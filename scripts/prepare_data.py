"""Rebuild every analytical input using only Python's standard library.

Run from any directory: python3 scripts/prepare_data.py
Definitions, exclusions and sources are documented in docs/METHODOLOGY.md.
"""
from pathlib import Path
from collections import Counter, defaultdict
from datetime import date, timedelta
import csv
import hashlib
import json
import math
import statistics as stats

ROOT = Path(__file__).resolve().parents[1]
START, END = date(2010, 1, 1), date(2016, 1, 1)
DATES = [START + timedelta(days=i) for i in range((END-START).days)]
CITIES = ['Beijing', 'Shenyang', 'Chengdu', 'Shanghai', 'Guangzhou']
THRESHOLDS = [35, 75, 115, 150, 250]
MIN_HOURS, MIN_DAYS = 18, 15


def number(s):
    try:
        n = float(s)
        return n if math.isfinite(n) and n >= 0 else None
    except (ValueError, TypeError):
        return None


def avg(xs):
    return stats.mean(xs) if xs else None


def band(n):
    return sum(n > t for t in THRESHOLDS)


def rounded(n):
    return round(n, 6) if n is not None else None


out = {k: {} for k in ['monthly', 'annual', 'daily', 'coverage']}
out.update(wind=[], trust=[], excludedStations=[], manifest=[])
beijing_weather = []
for city in CITIES:
    p = ROOT / 'data/raw' / f'{city}PM20100101_20151231.csv'
    with p.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fields = reader.fieldnames
    pmcols = [k for k in fields if k.startswith('PM_')]
    assert 'PM_US Post' in pmcols
    seen = set()
    byday = defaultdict(list)
    for r in rows:
        timestamp = tuple(int(r[k]) for k in ('year', 'month', 'day', 'hour'))
        assert timestamp not in seen, (city, timestamp, 'duplicate hour')
        seen.add(timestamp)
        dt = date(*timestamp[:3])
        assert START <= dt < END
        byday[dt].append(r)
    assert len(rows) == len(DATES)*24, (city, len(rows))
    station_daily = {}
    for col in pmcols:
        vals = {}
        for dt, hours in byday.items():
            valid = [n for r in hours if (n := number(r[col])) is not None]
            vals[dt] = avg(valid) if len(valid) >= MIN_HOURS else None
        station_daily[col] = vals
    us = station_daily['PM_US Post']
    out['daily'][city] = [rounded(us[d]) for d in DATES]
    monthly = []
    for y in range(2010, 2016):
        for m in range(1, 13):
            xs = [v for d, v in us.items() if d.year == y and d.month == m and v is not None]
            monthly.append([f'{y}-{m:02}', rounded(avg(xs)) if len(xs) >= MIN_DAYS else None])
    out['monthly'][city] = monthly
    annual = []
    for y in range(2010, 2016):
        xs = [v for d, v in us.items() if d.year == y and v is not None]
        counts = Counter(band(v) for v in xs)
        annual.append(dict(year=y, mean=rounded(avg(xs)), days=len(xs),
                           months=sum(v is not None for k,v in monthly if k.startswith(str(y))),
                           bands=[counts[i] for i in range(6)],
                           above150=sum(v > 150 for v in xs),
                           above15=sum(v > 15 for v in xs),
                           above25=sum(v > 25 for v in xs),
                           missing=(366 if y == 2012 else 365)-len(xs)))
    out['annual'][city] = annual
    validhours = [r for r in rows if number(r['PM_US Post']) is not None]
    validdays = [d for d,v in us.items() if v is not None]
    out['coverage'][city] = dict(rows=len(rows), validHours=len(validhours),
        firstHour='-'.join([validhours[0]['year'], validhours[0]['month'].zfill(2), validhours[0]['day'].zfill(2)]),
        firstDay=min(validdays).isoformat(), validDays=len(validdays),
        firstMonth=next(k for k,v in monthly if v is not None),
        invalidNonMissing=sum(r['PM_US Post'] not in ('NA','') and number(r['PM_US Post']) is None for r in rows))
    out['manifest'].append(dict(file=p.name, sha256=hashlib.sha256(p.read_bytes()).hexdigest(), rows=len(rows), columns=fields))
    for col in pmcols:
        if col == 'PM_US Post':
            continue
        # Exclude a duplicated series, not an independent validation monitor.
        if all(number(r[col]) == number(r['PM_US Post']) for r in rows):
            out['excludedStations'].append(dict(city=city, station=col, reason='Identical to PM_US Post, including missingness'))
            continue
        pairs = [(d, us[d], station_daily[col][d]) for d in DATES
                 if us[d] is not None and station_daily[col][d] is not None]
        a, b = [x[1] for x in pairs], [x[2] for x in pairs]
        gaps = [y-x for x,y in zip(a,b)]
        # Deterministic, evenly spaced plotting sample; statistics use all pairs.
        ids = sorted(set(round(i*(len(pairs)-1)/min(399,len(pairs)-1)) for i in range(min(400,len(pairs)))))
        out['trust'].append(dict(city=city, station=col.removeprefix('PM_'), n=len(pairs),
            r=rounded(stats.correlation(a,b)), meanUS=rounded(avg(a)), meanCN=rounded(avg(b)),
            bias=rounded(avg(gaps)), mae=rounded(avg([abs(x) for x in gaps])),
            rmse=rounded(math.sqrt(avg([x*x for x in gaps]))),
            pts=[[rounded(pairs[i][1]),rounded(pairs[i][2]),pairs[i][0].isoformat()] for i in ids]))
    if city == 'Beijing':
        for dt, hours in byday.items():
            if us[dt] is None or dt.year not in (2011, 2012, 2014, 2015):
                continue
            # Use directions during valid PM observations; no arbitrary tie-break.
            directions = [r['cbwd'] for r in hours if number(r['PM_US Post']) is not None and r['cbwd'] in ('NW','NE','SE','cv')]
            if len(directions) < MIN_HOURS:
                continue
            common = Counter(directions).most_common()
            if len(common) > 1 and common[0][1] == common[1][1]:
                continue
            beijing_weather.append(dict(date=dt.isoformat(), month=dt.month,
                period='before' if dt.year < 2013 else 'after', wd=common[0][0], pm=us[dt]))

for wd in ['NW','NE','SE','cv']:
    r = {'wd':wd}
    for period in ('before','after'):
        pool = [x for x in beijing_weather if x['period']==period]
        xs = [x['pm'] for x in pool if x['wd']==wd]
        r.update({period:rounded(avg(xs)), period+'_n':len(xs), period+'_share':rounded(100*len(xs)/len(pool))})
    out['wind'].append(r)

# A descriptive sensitivity check, not weather normalization or a causal estimator.
groups = defaultdict(list)
for r in beijing_weather:
    groups[(r['month'],r['wd'],r['period'])].append(r['pm'])
strata = []
for m in range(1,13):
    for wd in ['NW','NE','SE','cv']:
        b,a = groups[m,wd,'before'],groups[m,wd,'after']
        if min(len(b),len(a)) >= 5:
            strata.append(dict(month=m, wd=wd, before=avg(b), after=avg(a), before_n=len(b), after_n=len(a)))
nb,na = sum(r['before_n'] for r in strata),sum(r['after_n'] for r in strata)
for r in strata:
    r['weight'] = (r['before_n']/nb + r['after_n']/na)/2
out['weatherCheck'] = dict(before=sum(r['weight']*r['before'] for r in strata),
    after=sum(r['weight']*r['after'] for r in strata), before_n=nb, after_n=na,
    eligibleBefore=sum(x['period']=='before' for x in beijing_weather),
    eligibleAfter=sum(x['period']=='after' for x in beijing_weather), strata=strata,
    minimumDaysPerPeriodPerStratum=5)
out['pairedCalendar'] = {}
for city in CITIES:
    a, b = {}, {}
    for dt, value in zip(DATES, out['daily'][city]):
        if value is not None and dt.year in (2014, 2015):
            (a if dt.year == 2014 else b)[(dt.month, dt.day)] = value
    common = sorted(a.keys() & b.keys())
    out['pairedCalendar'][city] = dict(days=len(common),
        before=avg([a[k] for k in common]), after=avg([b[k] for k in common]))
out['meta'] = dict(source='UCI dataset 394', doi='10.24432/C52K58',
    dailyMinHours=MIN_HOURS, monthlyMinDays=MIN_DAYS,
    before='2011-01-01 to 2012-12-31', after='2014-01-01 to 2015-12-31',
    note='Observed station concentrations; not a citywide average or a causal policy effect.')
dest = ROOT/'data/processed/analysis.json'
dest.write_text(json.dumps(out,ensure_ascii=True,separators=(',',':'))+'\n',encoding='utf-8')
print('Wrote',dest)
for city in CITIES:
    a,b = out['annual'][city][-2:]
    print(city, '2014:', round(a['mean'],2),'2015:',round(b['mean'],2),'change %:',round((b['mean']/a['mean']-1)*100,2), 'days:',a['days'],b['days'])
print('Weather sensitivity:',json.dumps(out['weatherCheck'])[:360])
print('Excluded duplicate:',out['excludedStations'])
