import { reducedMotion } from '../motion.js?v=20261029-2';
let revealed = false;
import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js?v=20261029-2';

function drawScore() {
  const W = widthOf('score'), narrow = W < 560, m = {t:8, r: narrow ? 8 : 230, b:26, l: narrow ? 8 : 96}, rh = narrow ? 70 : 54;
  const H = m.t + CITIES.length * rh + m.b;
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
    const cy = m.t + k * rh + (narrow ? 40 : rh / 2);
    const nameX = narrow ? m.l : 0, nameY = narrow ? cy - 22 : cy + 4;
    row.append('text').attr('class','lbl-strong').attr('x', nameX).attr('y', nameY).text(c);
    const ch = Math.round(chRaw);
    const status = ch <= -5 ? `${'−'}${Math.abs(ch)}% · lower mean` : ch >= 0 ? `${ch > 0 ? '+' : '±'}${Math.abs(ch)}% · higher mean` : `−${Math.abs(ch)}% · slightly lower`;
    const col = ch <= -5 ? 'var(--good)' : ch >= 0 ? 'var(--bad)' : 'var(--ink)';
    row.append('line').attr('class','score-link').attr('data-start',x(base.mean)).attr('data-end',x(a15.mean)).attr('x1', x(base.mean)).attr('x2', x(a15.mean)).attr('y1', cy).attr('y2', cy).style('stroke', 'var(--ink-3)').style('stroke-width', 2);
    const tipHtml = `<b>${c}</b><br>2014: ${base.mean} µg/m³ (${base.days} days)<br>2015: ${a15.mean} µg/m³ (${a15.days} days)<br>Change: ${ch > 0 ? '+' : ''}${ch}%`;
    row.append('circle').attr('cx', x(base.mean)).attr('cy', cy).attr('r', 6).style('fill', 'var(--before)').style('stroke', 'var(--surface)').style('stroke-width', 2)
      .on('pointermove', ev => showTip(revealed ? tipHtml : `<b>${c}</b><br>2014: ${fmt(base.mean)} µg/m³ (${base.days} days)`, ev)).on('pointerleave', hideTip);
    row.append('circle').attr('class','score-end').attr('data-start',x(base.mean)).attr('data-end',x(a15.mean)).attr('cx', x(a15.mean)).attr('cy', cy).attr('r', 8).style('fill', cvar(c)).style('stroke', 'var(--ink)').style('stroke-width', 1.5)
      .on('pointermove', ev => showTip(revealed ? tipHtml : `<b>${c}</b><br>2014: ${fmt(base.mean)} µg/m³ (${base.days} days)`, ev)).on('pointerleave', hideTip);
    const left = a15.mean < base.mean;
    const baseAtRight = x(base.mean) > W - 90;
    row.append('text').attr('class','lbl').attr('x', x(base.mean) + (baseAtRight ? -4 : 4)).attr('y', cy + 20).attr('text-anchor', baseAtRight ? 'end' : 'start').text(`${base.year} · ${fmt(base.mean)}`);
    row.append('text').attr('class','lbl-strong score-after').attr('x', x(a15.mean) + (left ? -12 : 12)).attr('y', cy + 4).attr('text-anchor', left ? 'end' : 'start').text(fmt(a15.mean));
    row.append('text').attr('class','lbl-strong score-after').attr('x', narrow ? W - m.r : W - m.r + 18).attr('y', narrow ? nameY : cy + 4)
      .attr('text-anchor', narrow ? 'end' : 'start').style('fill', col).text(status);
  });
  applyStage(false);
}

function applyStage(animate) {
  const svg = d3.select('#score svg');
  const duration = animate && !reducedMotion() ? 850 : 0;
  document.getElementById('results-section').classList.toggle('score-baseline', !revealed);
  svg.selectAll('.score-link').interrupt('reveal').transition('reveal').duration(duration)
    .attr('x2', function(){return revealed ? this.dataset.end : this.dataset.start;});
  svg.selectAll('.score-end').interrupt('reveal').transition('reveal').duration(duration)
    .attr('cx', function(){return revealed ? this.dataset.end : this.dataset.start;});
  svg.selectAll('.score-after, .score-end, .score-link').style('opacity', revealed ? 1 : 0)
    .style('pointer-events', revealed ? null : 'none').attr('visibility', revealed ? null : 'hidden').attr('aria-hidden', String(!revealed));
  svg.selectAll('.score-row').attr('aria-label', function(){
    return `${this.dataset.city}, 2014: ${this.dataset.base}${revealed ? ', 2015: '+this.dataset.after : ''} micrograms per cubic metre`;
  });
  const button = document.getElementById('scoreReveal');
  button.textContent = revealed ? '↺ Back to 2014' : 'Reveal 2015 →';
  button.setAttribute('aria-pressed', String(revealed));
  document.getElementById('scoreStage').textContent = revealed
    ? 'Three station means fell. Two rose slightly. Hover or focus a city to follow its change.'
    : 'Start with 2014. Reveal the next year to see what changed.';
}

export function toggleScoreReveal() {
  revealed = !revealed;
  applyStage(true);
}

export {drawScore};
