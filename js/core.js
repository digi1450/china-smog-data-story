import { D } from './data.js';
export { D, GEO } from './data.js';
const CITIES = ['Beijing','Shenyang','Chengdu','Shanghai','Guangzhou'];
const CK = {Beijing:'bj',Shenyang:'sy',Chengdu:'cd',Shanghai:'sh',Guangzhou:'gz'};
const cvar = c => `var(--c-${CK[c]})`;
const INFO = {
 Beijing: {lon:116.40,lat:39.90,side:'left',region:'Capital · Beijing–Tianjin–Hebei',
  policy:'Regional 2017 goal: ~25% below 2012; Beijing annual PM2.5 ~60 µg/m³.',
  why:'<b>Reading this record:</b> Beijing is the only U.S. post here with readings throughout 2010–2015. It is the case study for the January 2013 episode and the wind sensitivity check.'},
 Shenyang: {lon:123.43,lat:41.80,side:'right',region:'North-east · Liaoning',
  policy:'No separate Shenyang PM2.5 target is evaluated here. This does not imply that no local target existed.',
  why:'<b>Reading this record:</b> U.S. post readings begin in April 2013. A partial 2013 must not be compared with a full year as if coverage were equal.'},
 Chengdu: {lon:104.07,lat:30.67,side:'left',region:'South-west · Sichuan Basin',
  policy:'No separate Chengdu PM2.5 target is evaluated here. This does not imply that no local target existed.',
  why:'<b>Reading this record:</b> U.S. post readings begin in 2012. Use 2014–2015 for the shared five-city comparison, with valid-day counts visible.'},
 Shanghai: {lon:121.47,lat:31.23,side:'right',region:'East coast · Yangtze River Delta',
  policy:'Yangtze River Delta 2017 regional goal: ~20% below 2012.',
  why:'<b>Reading this record:</b> U.S. post readings begin in late 2011. A nearby Chinese station can cross-check overlapping days, but neither reading represents the whole city.'},
 Guangzhou: {lon:113.26,lat:23.13,side:'right',region:'South · Pearl River Delta',
  policy:'Pearl River Delta 2017 regional goal: ~15% below 2012.',
  why:'<b>Reading this record:</b> The supplied City Station column duplicates the U.S. series exactly. It is excluded from independent station comparisons.'}
};
const BANDS = [
  {max:35,name:'',r:'≤35'},{max:75,name:'',r:'>35–75'},{max:115,name:'',r:'>75–115'},
  {max:150,name:'',r:'>115–150'},{max:250,name:'',r:'>150–250'},{max:Infinity,name:'',r:'>250'}];
const bandOf = v => BANDS.findIndex(b => v <= b.max);
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS = d3.timeMonths(new Date(2010,0,1), new Date(2016,0,1));
const PLAN_I = 44; // Sep 2013
const DAY0 = new Date(2010,0,1);
const fmtDate = d3.timeFormat('%-d %b %Y');
const fmt = d3.format('.1f');
const ym = d3.timeFormat('%Y-%m');

const COMMON_I = 40; // May 2013: first month all five monitors report
const state = { city: 'Beijing', month: COMMON_I, min: COMMON_I };

/* monthly lookup */
const MV = {};
CITIES.forEach(c => { const m = new Map(D.monthly[c]); MV[c] = MONTHS.map(d => m.has(ym(d)) ? m.get(ym(d)) : null); });
const annualOf = (c, y) => D.annual[c].find(a => a.year === y);


/* Shared chart utilities */

const tip = document.getElementById('tip');
function showTip(html, ev) {
  tip.innerHTML = html; tip.hidden = false;
  const r = tip.getBoundingClientRect(), pad = 12;
  let x = ev.clientX + 14, y = ev.clientY + 14;
  if (x + r.width > innerWidth - pad) x = ev.clientX - r.width - 14;
  if (y + r.height > innerHeight - pad) y = ev.clientY - r.height - 14;
  tip.style.left = Math.max(pad, x) + 'px'; tip.style.top = Math.max(pad, y) + 'px';
}
const hideTip = () => { tip.hidden = true; };
function svgFor(id, w, h) {
  const el = d3.select('#' + id); el.selectAll('*').remove();
  return el.append('svg').attr('role','img').attr('aria-label', document.getElementById(id).closest('figure')?.querySelector('figcaption b')?.textContent || id + ' chart').attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h);
}
const widthOf = id => Math.max(280, document.getElementById(id).clientWidth);


export { CITIES,CK,cvar,INFO,BANDS,bandOf,MON,MONTHS,PLAN_I,DAY0,fmtDate,ym,COMMON_I,state,MV,annualOf,fmt,showTip,hideTip,svgFor,widthOf };
