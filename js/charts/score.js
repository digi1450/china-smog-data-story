import { reducedMotion } from '../motion.js?v=aab38014ca01';
import { CITIES, cvar, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js?v=aab38014ca01';

let revealed = true;

function drawScore() {
  const W = widthOf('score'), narrow = W < 560, m = {t:8, r: narrow ? 48 : 200, b:26, l: narrow ? 74 : 110};
  const H = Math.max(160,document.getElementById('score').clientHeight), rh = (H-m.t-m.b)/CITIES.length, compact = narrow && rh < 40;
  const svg = svgFor('score', W, H);
  const x = d3.scaleLinear().domain([0, 110]).range([m.l, W - m.r]);
  svg.append('rect').attr('x', x(0)).attr('y', m.t).attr('width', x(5) - x(0)).attr('height', H - m.t - m.b).style('fill', 'var(--grid)');
  svg.append('g').attr('class','grid').selectAll('line').data([25, 50, 75, 100]).join('line').attr('x1', d => x(d)).attr('x2', d => x(d)).attr('y1', m.t).attr('y2', H - m.b);
  svg.append('g').attr('class','axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100]).tickSize(0).tickPadding(8)).call(g => g.select('.domain').remove());
  const rows = CITIES.map(c => ({c, base: annualOf(c, 2014), a15: annualOf(c, 2015)}))
    .map(r => ({...r, ch: (r.a15.mean / r.base.mean - 1) * 100})).sort((a, b) => a.ch - b.ch);
  rows.forEach(({c, base, a15, ch: chRaw}, k) => {
    const row = svg.append('g').attr('class','score-row').attr('tabindex',0).attr('data-city',c).attr('data-base',fmt(base.mean)).attr('data-after',fmt(a15.mean));
    row.on('pointerenter focusin', () => svg.selectAll('.score-row').classed('is-dim',function(){return this !== row.node();}))
      .on('pointerleave focusout', () => svg.selectAll('.score-row').classed('is-dim',false));
    const cy = m.t + k * rh + rh / 2;
    const nameX = 0, nameY = cy + 4;
    row.append('text').attr('class','lbl-strong').attr('x', nameX).attr('y', nameY).style('font-size',narrow?'10px':null).text(c);
    const ch = Math.round(chRaw);
    const status = ch <= -5 ? `${'−'}${Math.abs(ch)}% · lower mean` : ch >= 0 ? `${ch > 0 ? '+' : '±'}${Math.abs(ch)}% · higher mean` : `−${Math.abs(ch)}% · slightly lower`;
    const col = ch <= -5 ? 'var(--good)' : ch >= 0 ? 'var(--bad)' : 'var(--ink)';
    row.append('line').attr('class','score-link').attr('data-start',x(base.mean)).attr('data-end',x(a15.mean)).attr('x1', x(base.mean)).attr('x2', x(a15.mean)).attr('y1', cy).attr('y2', cy).style('stroke', 'var(--ink-3)').style('stroke-width', 2);
    const tipHtml = `<b>${c}</b><br>2014: ${base.mean} µg/m³ (${base.days} days)<br>2015: ${a15.mean} µg/m³ (${a15.days} days)<br>Change: ${ch > 0 ? '+' : ''}${ch}%`;
    row.append('circle').attr('cx', x(base.mean)).attr('cy', cy).attr('r', compact?4:6).style('fill', 'var(--before)').style('stroke', 'var(--surface)').style('stroke-width', 2)
      .on('pointermove', ev => showTip(revealed ? tipHtml : `<b>${c}</b><br>2014: ${fmt(base.mean)} µg/m³ (${base.days} days)`, ev)).on('pointerleave', hideTip);
    row.append('circle').attr('class','score-end').attr('data-start',x(base.mean)).attr('data-end',x(a15.mean)).attr('cx', x(a15.mean)).attr('cy', cy).attr('r', compact?6:8).style('fill', cvar(c)).style('stroke', 'var(--ink)').style('stroke-width', 1.5)
      .on('pointermove', ev => showTip(revealed ? tipHtml : `<b>${c}</b><br>2014: ${fmt(base.mean)} µg/m³ (${base.days} days)`, ev)).on('pointerleave', hideTip);
    const left = a15.mean < base.mean;
    const baseAtRight = x(base.mean) > W - 90;
    row.append('text').attr('class','lbl').attr('x', narrow ? x(base.mean) : x(base.mean) + (baseAtRight ? -4 : 4)).attr('y', cy + (compact?11:narrow?16:20)).attr('text-anchor', narrow?'middle':baseAtRight ? 'end' : 'start').style('font-size',compact?'8px':narrow?'9px':null).text(narrow?fmt(base.mean):`${base.year} · ${fmt(base.mean)}`);
    row.append('text').attr('class','lbl-strong score-after').attr('x', narrow ? x(a15.mean) : x(a15.mean) + (left ? -12 : 12)).attr('y', narrow ? cy-(compact?9:12) : cy + 4).attr('text-anchor', narrow?'middle':left ? 'end' : 'start').style('font-size',compact?'9px':narrow?'10px':null).text(fmt(a15.mean));
    row.append('text').attr('class','lbl-strong score-after').attr('x', narrow ? W - 2 : W - m.r + 18).attr('y', nameY)
      .attr('text-anchor', narrow ? 'end' : 'start').style('fill', col).style('font-size',narrow?'11px':null).text(narrow?`${ch>0?'+':ch<0?'−':'±'}${Math.abs(ch)}%`:status);
  });
  applyStage(false);
}

function applyStage(animate) {
  const svg = d3.select('#score svg');
  const duration = animate && !reducedMotion() ? 850 : 0;
  const links = svg.selectAll('.score-link').interrupt('reveal');
  const endpoints = svg.selectAll('.score-end').interrupt('reveal');
  (duration ? links.transition('reveal').duration(duration) : links)
    .attr('x2', function(){return revealed ? this.dataset.end : this.dataset.start;});
  (duration ? endpoints.transition('reveal').duration(duration) : endpoints)
    .attr('cx', function(){return revealed ? this.dataset.end : this.dataset.start;});
  svg.selectAll('.score-after, .score-end, .score-link').style('opacity', revealed ? 1 : 0)
    .style('pointer-events', revealed ? null : 'none').attr('visibility', revealed ? null : 'hidden').attr('aria-hidden', String(!revealed));
  svg.selectAll('.score-row').attr('aria-label', function(){
    return `${this.dataset.city}, 2014: ${this.dataset.base}${revealed ? ', 2015: '+this.dataset.after : ''} micrograms per cubic metre`;
  });
  const button = document.getElementById('scoreReveal');
  button.textContent = '↺ Replay change';
  document.getElementById('scoreStage').textContent = revealed
    ? 'Three station means fell. Two rose slightly. Hover or focus a city to follow its change.'
    : 'Start with 2014. Reveal the next year to see what changed.';
}

export function replayScoreReveal() {
  if (reducedMotion()) return;
  revealed = false;
  applyStage(false);
  revealed = true;
  applyStage(true);
}

export {drawScore};
