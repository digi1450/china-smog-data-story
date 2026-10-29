"""Independent raw-file checks for consequential calculations; no pipeline import."""
import csv
import hashlib
import json
import math
from collections import defaultdict
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

root=Path(__file__).resolve().parents[1]
d=json.loads((root/'data/processed/analysis.json').read_text())
start=date(2010,1,1)
for record in d['manifest']:
    assert hashlib.sha256((root/'data/raw'/record['file']).read_bytes()).hexdigest()==record['sha256']

for city, stored in d['daily'].items():
    sums=defaultdict(float); counts=defaultdict(int)
    with (root/'data/raw'/f'{city}PM20100101_20151231.csv').open(newline='') as f:
        for row in csv.DictReader(f):
            try: v=float(row['PM_US Post'])
            except ValueError: continue
            if not math.isfinite(v) or v<0: continue
            dt=date(int(row['year']),int(row['month']),int(row['day']))
            sums[dt]+=v; counts[dt]+=1
    computed={dt:sums[dt]/counts[dt] for dt in counts if counts[dt]>=18}
    assert len(stored)==2191
    for i,value in enumerate(stored):
        expected=computed.get(start+timedelta(days=i))
        assert (value is None)==(expected is None)
        if value is not None: assert abs(value-expected)<0.000001
    for row in d['annual'][city]:
        valid=[v for dt,v in computed.items() if dt.year==row['year']]
        assert len(valid)==row['days']
        assert sum(v>150 for v in valid)==row['above150']
        assert sum(row['bands'])==len(valid)
        if valid: assert abs(sum(valid)/len(valid)-row['mean'])<0.000001
        assert row['days']+row['missing']==(366 if row['year']==2012 else 365)
    for label,value in d['monthly'][city]:
        year,month=map(int,label.split('-'))
        valid=[v for dt,v in computed.items() if dt.year==year and dt.month==month]
        if len(valid)<15: assert value is None
        else: assert abs(sum(valid)/len(valid)-value)<0.000001
    # Matched-calendar sensitivity recomputed directly from raw daily means.
    paired=[]
    for dt,v in computed.items():
        if dt.year==2014 and (other:=computed.get(date(2015,dt.month,dt.day))) is not None:
            paired.append((v,other))
    p=d['pairedCalendar'][city]
    assert p['days']==len(paired)
    assert abs(sum(x for x,y in paired)/len(paired)-p['before'])<0.000001
    assert abs(sum(y for x,y in paired)/len(paired)-p['after'])<0.000001
    print(city, ': all daily, monthly, annual and paired-calendar calculations verified')

w=d['weatherCheck']
assert abs(sum(s['weight'] for s in w['strata'])-1)<1e-10
for period in ('before','after'):
    assert all(s[period+'_n']>=5 for s in w['strata'])
    assert sum(s[period+'_n'] for s in w['strata'])==w[period+'_n']
    assert abs(sum(s[period]*s['weight'] for s in w['strata'])-w[period])<1e-9
assert len(d['trust'])==10
assert d['excludedStations']==[{'city':'Guangzhou','station':'PM_City Station','reason':'Identical to PM_US Post, including missingness'}]
assert all(-1<=t['r']<=1 and t['mae']>=abs(t['bias'])-1e-5 for t in d['trust'])
print('Hashes, completeness, thresholds, weighting arithmetic and station-summary consistency passed.')

# A separate pass reconstructs station pairs using raw sums/counts rather than
# importing the production pipeline or trusting its stored scatter samples.
for city in d['daily']:
    totals=defaultdict(lambda:defaultdict(float))
    ns=defaultdict(lambda:defaultdict(int))
    windhours=defaultdict(list)
    with (root/'data/raw'/f'{city}PM20100101_20151231.csv').open(newline='') as f:
        reader=csv.DictReader(f)
        cols=[c for c in reader.fieldnames if c.startswith('PM_')]
        identical={c:True for c in cols if c!='PM_US Post'}
        for row in reader:
            dt=date(int(row['year']),int(row['month']),int(row['day']))
            for col in cols:
                if col!='PM_US Post' and row[col]!=row['PM_US Post']: identical[col]=False
                try: v=float(row[col])
                except ValueError: continue
                if not math.isfinite(v) or v<0: continue
                totals[col][dt]+=v; ns[col][dt]+=1
                if col=='PM_US Post' and city=='Beijing' and row['cbwd'] in ('NE','NW','SE','cv'):
                    windhours[dt].append(row['cbwd'])
    means={col:{dt:totals[col][dt]/n for dt,n in ns[col].items() if n>=18} for col in cols}
    for t in [t for t in d['trust'] if t['city']==city]:
        col='PM_'+t['station']; shared=sorted(means[col].keys()&means['PM_US Post'].keys())
        pairs=[(means['PM_US Post'][dt],means[col][dt]) for dt in shared]
        n=len(pairs); ax=sum(a for a,b in pairs)/n; by=sum(b for a,b in pairs)/n
        sx=sum((a-ax)**2 for a,b in pairs); sy=sum((b-by)**2 for a,b in pairs)
        correlation=sum((a-ax)*(b-by) for a,b in pairs)/math.sqrt(sx*sy)
        assert t['n']==n and abs(t['r']-correlation)<1e-6
        assert abs(t['mae']-sum(abs(b-a) for a,b in pairs)/n)<1e-6
        assert abs(t['bias']-(by-ax))<1e-6
        assert abs(t['rmse']-math.sqrt(sum((b-a)**2 for a,b in pairs)/n))<1e-6
    assert [c for c,equal in identical.items() if equal]==(['PM_City Station'] if city=='Guangzhou' else [])
    if city!='Beijing': continue
    rebuilt=defaultdict(list)
    for dt,hours in windhours.items():
        if dt not in means['PM_US Post'] or len(hours)<18 or dt.year not in (2011,2012,2014,2015):continue
        counts=Counter(hours); largest=max(counts.values()); modes=[k for k,v in counts.items() if v==largest]
        if len(modes)!=1:continue
        period='before' if dt.year<2013 else 'after'
        rebuilt[dt.month,modes[0],period].append(means['PM_US Post'][dt])
    for row in d['wind']:
        for period in ('before','after'):
            vals=[v for (month,wd,p),xs in rebuilt.items() if wd==row['wd'] and p==period for v in xs]
            total=sum(len(xs) for (month,wd,p),xs in rebuilt.items() if p==period)
            assert len(vals)==row[period+'_n']
            assert abs(sum(vals)/len(vals)-row[period])<1e-6
            assert abs(100*len(vals)/total-row[period+'_share'])<1e-6
    eligible={(m,wd) for (m,wd,p),xs in rebuilt.items() if p=='before' and len(xs)>=5 and len(rebuilt[m,wd,'after'])>=5}
    assert eligible=={(s['month'],s['wd']) for s in w['strata']}
    for s in w['strata']:
        for p in ('before','after'):
            vals=rebuilt[s['month'],s['wd'],p]
            assert len(vals)==s[p+'_n'] and abs(sum(vals)/len(vals)-s[p])<1e-9
print('Independent raw-file station correlation/bias/MAE/RMSE, duplicated-column and wind-group checks passed.')
