import { D, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js?v=3410be10a028';

let selectedWind='all';
const WIND_LABELS={cv:'calm/variable',SE:'south-east',NW:'north-west',NE:'north-east'};
const motionOK=()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawWind() {
  const order=['cv','SE','NW','NE'], name={cv:'Calm/var.',SE:'South-east',NW:'North-west',NE:'North-east'};
  const rows=order.map(k=>D.wind.find(w=>w.wd===k));
  const W=widthOf('wind'), narrow=W<520, m={t:20,r:narrow?83:150,b:26,l:narrow?72:96};
  const H=Math.max(150,document.getElementById('wind').clientHeight),rh=(H-m.t-m.b)/rows.length;
  const svg=svgFor('wind',W,H).attr('aria-label','Beijing daily PM2.5 by wind category, 2011–2012 versus 2014–2015'),x=d3.scaleLinear().domain([0,180]).range([m.l,W-m.r]);
  svg.append('g').attr('class','grid').selectAll('line').data(x.ticks(4)).join('line').attr('x1',x).attr('x2',x).attr('y1',m.t-6).attr('y2',H-m.b);
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${H-m.b})`).call(d3.axisBottom(x).ticks(4).tickSize(0).tickPadding(8)).call(g=>g.select('.domain').remove());
  svg.append('text').attr('class','lbl').attr('x',W-m.r+12).attr('y',m.t-4).text('Share of days');
  rows.forEach((r,k)=>{
    const cy=m.t+k*rh+rh/2, active=selectedWind==='all'||selectedWind===r.wd;
    const group=svg.append('g').attr('class','wind-row').classed('is-dim',!active).attr('tabindex',0).attr('role','button').attr('data-category',r.wd).attr('aria-pressed',String(selectedWind===r.wd))
      .attr('aria-label',`Select ${name[r.wd]}; mean before ${fmt(r.before)}, after ${fmt(r.after)}`);
    group.append('rect').attr('x',0).attr('y',cy-rh/2).attr('width',W).attr('height',rh).style('fill','transparent');
    group.append('text').attr('class','lbl-strong').attr('x',0).attr('y',cy+4).text(name[r.wd]);
    const link=group.append('line').attr('class','wind-connector').attr('x1',x(r.before)).attr('x2',x(r.after)).attr('y1',cy).attr('y2',cy).style('stroke','var(--ink-3)').style('stroke-width',active?3:2);
    const tip=`<b>${name[r.wd]} wind, Beijing</b><br>2011–2012: ${fmt(r.before)} µg/m³ (${r.before_n} days)<br>2014–2015: ${fmt(r.after)} µg/m³ (${r.after_n} days)<br>Change: ${Math.round((r.after/r.before-1)*100)}%`;
    [['before','var(--before)'],['after','var(--accent)']].forEach(([period,col])=>{
      group.append('circle').attr('class','wind-marker').attr('cx',x(r[period])).attr('cy',cy).attr('r',selectedWind===r.wd?9:7)
        .style('fill',col).style('stroke','var(--surface)').style('stroke-width',2);
    });
    group.append('text').attr('class','lbl').attr('x',x(r.before)).attr('y',cy-Math.min(13,rh*.3)).attr('text-anchor','middle').text(Math.round(r.before));
    group.append('text').attr('class','lbl-strong').attr('x',x(r.after)).attr('y',cy+Math.min(22,rh*.43)).attr('text-anchor','middle').text(Math.round(r.after));
    group.append('text').attr('class','lbl-strong').attr('x',W-m.r+12).attr('y',cy+4).text(`${Math.round(r.before_share)}% → ${Math.round(r.after_share)}%`);
    group.on('click',()=>{selectedWind=selectedWind===r.wd?'all':r.wd;drawWind()})
      .on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectedWind=selectedWind===r.wd?'all':r.wd;drawWind();document.querySelector(`#wind [data-category="${r.wd}"]`).focus({preventScroll:true})}})
      .on('pointermove',e=>showTip(tip,e)).on('pointerleave',hideTip);
    if(active && motionOK()) {
      link.attr('x2',x(r.before)).transition().duration(760).delay(k*105).ease(d3.easeCubicInOut).attr('x2',x(r.after));
      group.selectAll('.wind-marker').attr('opacity',0).transition().duration(440).delay(k*105+190).attr('opacity',1);
    }
  });
  const finding=document.getElementById('windFinding');
  if (finding) {
    if(selectedWind==='all') finding.textContent='Select a wind category to compare the two periods. This is a sensitivity check, not a causal estimate.';
    else {
      const v=D.wind.find(w=>w.wd===selectedWind);
      const delta=(v.after/v.before-1)*100;
      finding.textContent=`${WIND_LABELS[selectedWind]} days: ${fmt(v.before)} → ${fmt(v.after)} µg/m³ (${delta>0?'+':''}${Math.round(delta)}%). The share of days in this category also changed.`;
    }
  }
  document.querySelectorAll('[data-wind]').forEach(btn=>{
    const active=btn.dataset.wind===selectedWind;
    btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));
    btn.onclick=()=>{selectedWind=btn.dataset.wind;hideTip();drawWind()};
  });
}


export {drawWind};
