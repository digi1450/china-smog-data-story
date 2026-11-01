import { introduceChart, revealLine } from '../motion.js?v=bc46f842bc35';
import { D, CITIES, cvar, DAY0, fmt, svgFor, widthOf, showTip, hideTip, annualOf, fmtDate } from '../core.js?v=bc46f842bc35';

function drawCrisis() {
  const W=widthOf('crisis'), H=Math.max(100,document.getElementById('crisis').clientHeight), m={l:42,r:18,t:24,b:32};
  const rows=d3.timeDays(new Date(2013,0,1),new Date(2013,1,1)).map(d=>({d,v:D.daily.Beijing[d3.timeDay.count(DAY0,d)]}));
  const svg=svgFor('crisis',W,H);
  const x=d3.scaleTime().domain([rows[0].d,rows.at(-1).d]).range([m.l,W-m.r]);
  const y=d3.scaleLinear().domain([0,d3.max(rows,r=>r.v)*1.16]).nice().range([H-m.b,m.t]);
  svg.append('g').attr('class','grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1',m.l).attr('x2',W-m.r).attr('y1',y).attr('y2',y);
  svg.append('g').attr('class','axis').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(H<220?3:5).tickSize(0));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${H-m.b})`).call(d3.axisBottom(x).ticks(W<500?4:8).tickFormat(d3.timeFormat('%d Jan')).tickSizeOuter(0));
  [25,15].forEach((v,i)=>svg.append('line').attr('x1',m.l).attr('x2',W-m.r).attr('y1',y(v)).attr('y2',y(v)).style('stroke','var(--ink-2)').style('stroke-dasharray',i?'2,3':'7,4'));
  svg.append('path').attr('class','story-line').datum(rows).attr('d',d3.line().defined(r=>r.v!=null).x(r=>x(r.d)).y(r=>y(r.v))).style('fill','none').style('stroke',cvar('Beijing')).style('stroke-width',2);
  svg.selectAll('circle').data(rows.filter(r=>r.v!=null)).join('circle').attr('cx',r=>x(r.d)).attr('cy',r=>y(r.v)).attr('r',3.5).style('fill',cvar('Beijing'))
    .on('pointermove',(e,r)=>showTip(`${fmtDate(r.d)}<br>${fmt(r.v)} µg/m³`,e)).on('pointerleave',hideTip);
  const peak=d3.greatest(rows,r=>r.v??-1), px=x(peak.d);
  const py=y(peak.v), labelX=Math.min(W-155,px+26), labelY=Math.max(20,py-44);
  svg.append('circle').attr('cx',px).attr('cy',py).attr('r',6).style('fill',cvar('Beijing')).style('stroke','var(--bg)').style('stroke-width',2);
  svg.append('line').attr('x1',px+5).attr('y1',py-7).attr('x2',labelX).attr('y2',labelY+14).style('stroke','var(--ink-3)');
  const annotation=svg.append('g').attr('transform',`translate(${labelX},${labelY})`).attr('class','crisis-peak');
  annotation.append('text').attr('class','lbl').text(`${d3.timeFormat('%-d %b')(peak.d)} · ${W<500?'daily peak':'highest daily mean'}`);
  annotation.append('text').attr('y',35).style('font-family','var(--f-display)').style('font-size',W<500?'28px':'40px').style('font-weight',700).style('fill','var(--ink)').text(fmt(peak.v));
  annotation.append('text').attr('class','lbl').attr('x',W<500?87:126).attr('y',35).text('µg/m³');
  introduceChart(svg,'crisis',chart=>revealLine(chart));
}

let exceedMode = 'share';
function drawExceed() {
  const W = widthOf('exceed'), narrow = W < 600;
  const m = {l:narrow?78:110,r:narrow?53:75,t:8,b:26};
  const H = Math.max(150, document.getElementById('exceed').clientHeight);
  const rh = (H-m.t-m.b)/5, step = Math.min(18,rh*.38), barHeight = Math.min(12,step-3);
  const rows = CITIES.map(c=>({c, years:[2014,2015].map(y=>annualOf(c,y))}));
  const metric = a => exceedMode === 'count' ? a.above150 : 100*a.above150/a.days;
  const caption = document.getElementById('extreme-caption');
  caption.textContent = exceedMode === 'count' ? 'Observed days above 150 µg/m³ · count' : 'Share of valid days above 150 µg/m³ · %';
  const improved = rows.filter(r => metric(r.years[1]) < metric(r.years[0])).length;
  document.getElementById('extremeFinding').innerHTML = `<strong class="accent-number">${improved} of 5</strong> monitors had ${exceedMode === 'count' ? 'fewer observed high-pollution days' : 'lower shares'} in 2015. <span>${exceedMode === 'count' ? 'Valid-day totals differ; compare shares too.' : 'Missing days are excluded.'}</span>`;
  const maxValue = exceedMode === 'count' ? d3.max(rows.flatMap(r=>r.years.map(metric)))*1.13 : 25;
  const svg = svgFor('exceed', W, H).attr('aria-label',caption.textContent), x = d3.scaleLinear().domain([0,maxValue]).range([m.l,W-m.r]);
  svg.append('g').attr('class','grid').selectAll('line').data(x.ticks(5)).join('line').attr('x1',x).attr('x2',x).attr('y1',m.t).attr('y2',H-m.b);
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${H-m.b})`)
    .call(d3.axisBottom(x).ticks(narrow?3:5).tickFormat(v=>exceedMode==='share'?v+'%':d3.format('d')(v)).tickSizeOuter(0));
  rows.forEach(({c,years},k)=>{
    const cy=m.t+k*rh+(rh-step-barHeight)/2;
    const group=svg.append('g').attr('class','extreme-row').attr('tabindex',0).attr('role','group').attr('aria-label',`${c}, 2014 ${fmt(metric(years[0]))}${exceedMode === 'count' ? ' days' : '%'}, 2015 ${fmt(metric(years[1]))}${exceedMode === 'count' ? ' days' : '%'}`);
    group.append('rect').attr('class','row-hit').attr('x',0).attr('y',m.t+k*rh).attr('width',W).attr('height',rh).style('fill','transparent');
    group.append('text').attr('class','lbl-strong').attr('x',0).attr('y',cy+(step+barHeight)/2+4).text(c);
    years.forEach((a,j)=>{
      const value=metric(a),yy=cy+j*step;
      group.append('rect').attr('class','exceed-bar').attr('x',x(0)).attr('y',yy).attr('height',barHeight).attr('rx',2).attr('width',Math.max(0,x(value)-x(0)))
        .attr('data-target-width',Math.max(0,x(value)-x(0)))
        .style('fill',j?cvar(c):'var(--before)');
      group.append('text').attr('class','lbl').attr('x',x(value)+5).attr('y',yy+barHeight/2+3).text(exceedMode==='share'?`${fmt(value)}%`:`${a.above150} ${a.above150 === 1 ? 'day' : 'days'}`);
    });
    const tip=`<b>${c}</b><br>`+years.map(a=>`${a.year}: ${a.above150} of ${a.days} valid days (${fmt(100*a.above150/a.days)}%)`).join('<br>');
    group.on('pointerenter focusin',e=>{svg.selectAll('.extreme-row').classed('is-dim',function(){return this!==group.node()}); if(e.type==='pointerenter')showTip(tip,e)})
      .on('pointermove',e=>showTip(tip,e)).on('pointerleave focusout',()=>{svg.selectAll('.extreme-row').classed('is-dim',false);hideTip()});
  });
  const animate=()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    svg.selectAll('.exceed-bar').interrupt()
      .attr('width',0).transition().duration(680).delay((d,i)=>i*52).ease(d3.easeCubicOut)
      .attr('width',function(){return +this.dataset.targetWidth});
  };
  introduceChart(svg,'exceed',animate);
  document.getElementById('extremeReplay').onclick=animate;
  document.querySelectorAll('[data-exceed-mode]').forEach(btn=>{
    const active=btn.dataset.exceedMode===exceedMode;
    btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));
    btn.onclick=()=>{if(exceedMode===btn.dataset.exceedMode)return;exceedMode=btn.dataset.exceedMode;drawExceed()};
  });
  const tableRows=CITIES.flatMap(c=>[2014,2015].map(y=>{const a=annualOf(c,y);return [c,y,a.above150,`${fmt(100*a.above150/a.days)}%`,a.days,a.missing]}));
  document.getElementById('exceedTable').innerHTML=table(['City','Year','Days >150','Share of valid days','Valid days','Missing days'],tableRows,'Grey bars: 2014. City-coloured bars: 2015.');
}

function table(headers,rows,caption) {
  return `<table><caption>${caption}</caption><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>i===0?`<th scope="row">${v}</th>`:`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function fillEvidence() {
  const crisis=D.daily.Beijing.slice(d3.timeDay.count(DAY0,new Date(2013,0,1)),d3.timeDay.count(DAY0,new Date(2013,1,1))).filter(v=>v!=null);
  document.getElementById('crisisFinding').textContent=`The highest valid daily mean in January 2013 was ${fmt(d3.max(crisis))} µg/m³. ${crisis.filter(v=>v>25).length} of ${crisis.length} valid days exceeded the WHO 2005 24-hour reference of 25 µg/m³.`;
  document.getElementById('crisisSummary').textContent=`${crisis.filter(v=>v>25).length} of ${crisis.length} valid days above the WHO 2005 reference.`;
  const delta=c=>(annualOf(c,2015).mean/annualOf(c,2014).mean-1)*100;
  document.getElementById('scoreFinding').textContent=`From 2014 to 2015: Guangzhou ${fmt(delta('Guangzhou'))}%, Beijing ${fmt(delta('Beijing'))}%, Chengdu ${fmt(delta('Chengdu'))}%; Shenyang +${fmt(delta('Shenyang'))}% and Shanghai +${fmt(delta('Shanghai'))}%. These are monitor averages, not national results.`;
  const paired=D.pairedCalendar.Shenyang;
  document.getElementById('missingSensitivity').textContent=`Missing-day sensitivity: pairing the same month/day with valid readings in both years changes Shenyang's result from +${fmt(delta('Shenyang'))}% to ${fmt((paired.after/paired.before-1)*100)}% (${paired.days} paired dates). Its small change is not robust to this coverage choice. The other four cities keep the same direction. Matching dates does not hold weather constant.`;
  document.getElementById('pairedTable').innerHTML=table(['City','Paired dates','2014 mean','2015 mean','Change'],CITIES.map(c=>{const p=D.pairedCalendar[c],ch=(p.after/p.before-1)*100;return [c,p.days,fmt(p.before),fmt(p.after),`${ch>0?'+':''}${fmt(ch)}%`];}),'Sensitivity only: identical calendar dates observed in both years; µg/m³.');
  const se=D.wind.find(r=>r.wd==='SE'),cv=D.wind.find(r=>r.wd==='cv');
  document.getElementById('windFinding').textContent=`On SE-category days, mean PM2.5 changed from ${fmt(se.before)} to ${fmt(se.after)} µg/m³; on calm/variable days, from ${fmt(cv.before)} to ${fmt(cv.after)}. Periods: 2011–2012 versus 2014–2015, with the same data rules.`;
  const w=D.weatherCheck;
  document.getElementById('weatherFinding').textContent=`Reweighting matching calendar-month × wind groups to the same distribution gives ${fmt(w.before)} versus ${fmt(w.after)} µg/m³ (${fmt((w.after/w.before-1)*100)}%). The check retains ${w.before_n}/${w.eligibleBefore} eligible pre-plan days and ${w.after_n}/${w.eligibleAfter} post-plan days across ${w.strata.length} shared groups. This reduces two sources of composition difference; it does not identify what caused the change.`;
  const rmin=d3.min(D.trust,t=>t.r),rmax=d3.max(D.trust,t=>t.r);
  document.getElementById('trustFinding').textContent=`Across ${D.trust.length} non-duplicate station comparisons, daily correlation ranges from ${rmin.toFixed(2)} to ${rmax.toFixed(2)}. Station summaries include signed bias and mean absolute error as well as correlation.`;
  document.getElementById('verdict').textContent=`From 2014 to 2015, annual means fell at ${CITIES.filter(c=>delta(c)<0).length} of five U.S. posts. All five 2015 station means remained above the WHO 2021 annual reference of 5 µg/m³ (and the WHO 2005 reference of 10). This is evidence of uneven improvement in observed concentrations, not proof that the plan caused it.`;
  document.getElementById('coverageTable').innerHTML=table(['City','First valid hour (date)','First qualifying day','2014 valid days','2015 valid days'],CITIES.map(c=>[c,D.coverage[c].firstHour,D.coverage[c].firstDay,`${annualOf(c,2014).days}/365`,`${annualOf(c,2015).days}/365`]),'Coverage calculated from the downloaded UCI CSV files.');
}

export {drawCrisis,drawExceed,fillEvidence};
