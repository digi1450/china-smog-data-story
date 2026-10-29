import { introduceChart, revealLine } from '../motion.js';
import { selectCity } from '../app.js';
import {D,CITIES,cvar,state,MV,MONTHS,PLAN_I,DAY0,fmt,svgFor,widthOf,showTip,hideTip,annualOf,fmtDate} from '../core.js';

function drawCrisis() {
  const W=widthOf('crisis'), H=300, m={l:48,r:18,t:36,b:32};
  const rows=d3.timeDays(new Date(2013,0,1),new Date(2013,1,1)).map(d=>({d,v:D.daily.Beijing[d3.timeDay.count(DAY0,d)]}));
  const svg=svgFor('crisis',W,H);
  const x=d3.scaleTime().domain([rows[0].d,rows.at(-1).d]).range([m.l,W-m.r]);
  const y=d3.scaleLinear().domain([0,d3.max(rows,r=>r.v)*1.16]).nice().range([H-m.b,m.t]);
  svg.append('g').attr('class','grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1',m.l).attr('x2',W-m.r).attr('y1',y).attr('y2',y);
  svg.append('g').attr('class','axis').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(0));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${H-m.b})`).call(d3.axisBottom(x).ticks(W<500?4:8).tickFormat(d3.timeFormat('%d Jan')).tickSizeOuter(0));
  [25,15].forEach((v,i)=>svg.append('line').attr('x1',m.l).attr('x2',W-m.r).attr('y1',y(v)).attr('y2',y(v)).style('stroke','var(--ink-2)').style('stroke-dasharray',i?'2,3':'7,4'));
  svg.append('path').attr('class','story-line').datum(rows).attr('d',d3.line().defined(r=>r.v!=null).x(r=>x(r.d)).y(r=>y(r.v))).style('fill','none').style('stroke',cvar('Beijing')).style('stroke-width',2);
  svg.selectAll('circle').data(rows.filter(r=>r.v!=null)).join('circle').attr('cx',r=>x(r.d)).attr('cy',r=>y(r.v)).attr('r',3.5).style('fill',cvar('Beijing'))
    .on('pointermove',(e,r)=>showTip(`${fmtDate(r.d)}<br>${fmt(r.v)} µg/m³`,e)).on('pointerleave',hideTip);
  const peak=d3.greatest(rows,r=>r.v??-1), px=x(peak.d);
  svg.append('text').attr('class','lbl-strong').attr('x',px).attr('y',y(peak.v)-13).attr('text-anchor',px>W-130?'end':px<120?'start':'middle').text(`${fmtDate(peak.d)} · ${fmt(peak.v)}`);
  introduceChart(svg,'crisis',chart=>revealLine(chart));
}

function drawTrend() {
  const W=widthOf('trend'),H=320,m={l:46,r:18,t:28,b:30};
  const svg=svgFor('trend',W,H);
  const x=d3.scaleTime().domain([MONTHS[0],MONTHS.at(-1)]).range([m.l,W-m.r]);
  const y=d3.scaleLinear().domain([0,d3.max(CITIES.flatMap(c=>MV[c]))*1.1]).nice().range([H-m.b,m.t]);
  const boundary=x(MONTHS[PLAN_I]);
  svg.append('rect').attr('x',boundary).attr('y',m.t).attr('width',W-m.r-boundary).attr('height',H-m.b-m.t).style('fill','var(--accent)').style('opacity',.055);
  svg.append('g').attr('class','grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1',m.l).attr('x2',W-m.r).attr('y1',y).attr('y2',y);
  svg.append('g').attr('class','axis').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(0));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${H-m.b})`).call(d3.axisBottom(x).ticks(d3.timeYear.every(W<500?2:1)).tickFormat(d3.timeFormat('%Y')).tickSizeOuter(0));
  svg.append('line').attr('x1',boundary).attr('x2',boundary).attr('y1',m.t).attr('y2',H-m.b).style('stroke','var(--ink-2)').style('stroke-dasharray','4,3');
  svg.append('text').attr('class','lbl').attr('x',boundary+5).attr('y',m.t-9).text(W<500?'Sep 2013':'Action Plan · Sep 2013');
  const line=d3.line().defined(v=>v!=null).x((v,i)=>x(MONTHS[i])).y(v=>y(v));
  [...CITIES.filter(c=>c!==state.city),state.city].forEach(c=>svg.append('path').attr('class','trend-series').attr('data-city',c).attr('d',line(MV[c])).style('fill','none').style('stroke',cvar(c)).style('stroke-width',c===state.city?2.8:1.5).style('opacity',c===state.city?1:.55));
  const highlight=svg.append('g').attr('hidden',true);
  highlight.append('line').attr('y1',m.t).attr('y2',H-m.b).style('stroke','var(--ink-3)');
  svg.append('rect').attr('x',m.l).attr('y',m.t).attr('width',W-m.r-m.l).attr('height',H-m.b-m.t).style('fill','transparent')
    .on('pointermove',e=>{
      const dt=x.invert(d3.pointer(e)[0]); const i=Math.max(0,Math.min(71,Math.round(d3.timeMonth.count(MONTHS[0],dt))));
      highlight.attr('hidden',null).select('line').attr('x1',x(MONTHS[i])).attr('x2',x(MONTHS[i]));
      showTip(`<b>${d3.timeFormat('%b %Y')(MONTHS[i])}</b><br>`+CITIES.map(c=>`${c}: ${MV[c][i]==null?'no data':fmt(MV[c][i])+' µg/m³'}`).join('<br>'),e);
    }).on('pointerleave',()=>{highlight.attr('hidden',true);hideTip();});
  const legend=document.getElementById('trendLegend');
  legend.innerHTML=CITIES.map(c=>`<button type="button" data-city="${c}" aria-pressed="${c===state.city}"><i style="background:${cvar(c)}"></i>${c}</button>`).join('');
  const emphasize=c=>svg.selectAll('.trend-series').style('opacity',function(){return this.dataset.city===c?1:.18;}).style('stroke-width',function(){return this.dataset.city===c?2.8:1.5;});
  legend.querySelectorAll('button').forEach(button=>{
    button.addEventListener('click',()=>selectCity(button.dataset.city));
    button.addEventListener('pointerenter',()=>emphasize(button.dataset.city));
    button.addEventListener('focus',()=>emphasize(button.dataset.city));
    button.addEventListener('pointerleave',()=>emphasize(state.city));
    button.addEventListener('blur',()=>emphasize(state.city));
  });
  introduceChart(svg,'trend',chart=>{
    chart.selectAll('.trend-series').each(function(){revealLine(d3.select(this.parentNode),`path[data-city="${this.dataset.city}"]`);});
  });
}

function drawExceed() {
  const W=widthOf('exceed'),m={l:W<500?80:100,r:55,t:15,b:30},rh=54,H=5*rh+m.t+m.b;
  const svg=svgFor('exceed',W,H),x=d3.scaleLinear().domain([0,25]).range([m.l,W-m.r]);
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${H-m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(v=>v+'%').tickSizeOuter(0));
  CITIES.forEach((c,k)=>{
    const cy=m.t+k*rh;
    svg.append('text').attr('class','lbl-strong').attr('x',0).attr('y',cy+19).text(c);
    [2014,2015].forEach((yr,j)=>{
      const a=annualOf(c,yr),p=100*a.above150/a.days, yy=cy+j*18;
      svg.append('rect').attr('class','exceed-bar').attr('x',x(0)).attr('y',yy).attr('width',x(p)-x(0)).attr('height',12).style('fill',j?cvar(c):'var(--before)');
      svg.append('text').attr('class','lbl').attr('x',x(p)+5).attr('y',yy+10).text(`${fmt(p)}%`);
    });
  });
  introduceChart(svg,'exceed',chart=>{
    chart.selectAll('.exceed-bar').each(function(){this.dataset.width=this.getAttribute('width');})
      .attr('width',0).transition('intro').duration(600).delay((d,i)=>i*35).attr('width',function(){return this.dataset.width;});
  });
  const rows=CITIES.flatMap(c=>[2014,2015].map(y=>{const a=annualOf(c,y);return [c,y,a.above150,`${fmt(100*a.above150/a.days)}%`,a.days,a.missing];}));
  document.getElementById('exceedTable').innerHTML=table(['City','Year','Days >150','Share of valid days','Valid days','Missing days'],rows,'Grey bars: 2014. City-coloured bars: 2015.');
}

function table(headers,rows,caption) {
  return `<table><caption>${caption}</caption><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>i===0?`<th scope="row">${v}</th>`:`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function fillEvidence() {
  const crisis=D.daily.Beijing.slice(d3.timeDay.count(DAY0,new Date(2013,0,1)),d3.timeDay.count(DAY0,new Date(2013,1,1))).filter(v=>v!=null);
  document.getElementById('crisisFinding').textContent=`The highest valid daily mean in January 2013 was ${fmt(d3.max(crisis))} µg/m³. ${crisis.filter(v=>v>25).length} of ${crisis.length} valid days exceeded the WHO 2005 24-hour reference of 25 µg/m³.`;
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
  document.getElementById('trustFinding').textContent=`Across ${D.trust.length} non-duplicate station comparisons, daily correlation ranges from ${rmin.toFixed(2)} to ${rmax.toFixed(2)}. Use the selector to inspect signed bias and mean absolute error as well as correlation.`;
  document.getElementById('verdict').textContent=`From 2014 to 2015, annual means fell at ${CITIES.filter(c=>delta(c)<0).length} of five U.S. posts. All five 2015 station means remained above the WHO 2021 annual reference of 5 µg/m³ (and the WHO 2005 reference of 10). This is evidence of uneven improvement in observed concentrations, not proof that the plan caused it.`;
  document.getElementById('coverageTable').innerHTML=table(['City','First valid hour (date)','First qualifying day','2014 valid days','2015 valid days'],CITIES.map(c=>[c,D.coverage[c].firstHour,D.coverage[c].firstDay,`${annualOf(c,2014).days}/365`,`${annualOf(c,2015).days}/365`]),'Coverage calculated from the downloaded UCI CSV files.');
}

export {drawCrisis,drawTrend,drawExceed,fillEvidence};
