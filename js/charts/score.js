import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js';

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
    const cy = m.t + k * rh + (narrow ? 40 : rh / 2);
    const nameX = narrow ? m.l : 0, nameY = narrow ? cy - 22 : cy + 4;
    svg.append('text').attr('class','lbl-strong').attr('x', nameX).attr('y', nameY).text(c);
    const ch = Math.round(chRaw);
    const status = ch <= -5 ? `${'−'}${Math.abs(ch)}% · lower mean` : ch >= 0 ? `${ch > 0 ? '+' : '±'}${Math.abs(ch)}% · higher mean` : `−${Math.abs(ch)}% · slightly lower`;
    const col = ch <= -5 ? 'var(--good)' : ch >= 0 ? 'var(--bad)' : 'var(--ink)';
    svg.append('line').attr('x1', x(base.mean)).attr('x2', x(a15.mean)).attr('y1', cy).attr('y2', cy).style('stroke', 'var(--ink-3)').style('stroke-width', 2);
    const tipHtml = `<b>${c}</b><br>2014: ${base.mean} µg/m³ (${base.days} days)<br>2015: ${a15.mean} µg/m³ (${a15.days} days)<br>Change: ${ch > 0 ? '+' : ''}${ch}%`;
    svg.append('circle').attr('cx', x(base.mean)).attr('cy', cy).attr('r', 6).style('fill', 'var(--before)').style('stroke', 'var(--surface)').style('stroke-width', 2)
      .on('pointermove', ev => showTip(tipHtml, ev)).on('pointerleave', hideTip);
    svg.append('circle').attr('cx', x(a15.mean)).attr('cy', cy).attr('r', 8).style('fill', cvar(c)).style('stroke', 'var(--ink)').style('stroke-width', 1.5)
      .on('pointermove', ev => showTip(tipHtml, ev)).on('pointerleave', hideTip);
    const left = a15.mean < base.mean;
    const baseAtRight = x(base.mean) > W - 90;
    svg.append('text').attr('class','lbl').attr('x', x(base.mean) + (baseAtRight ? -4 : 4)).attr('y', cy + 20).attr('text-anchor', baseAtRight ? 'end' : 'start').text(`${base.year} · ${fmt(base.mean)}`);
    svg.append('text').attr('class','lbl-strong').attr('x', x(a15.mean) + (left ? -12 : 12)).attr('y', cy + 4).attr('text-anchor', left ? 'end' : 'start').text(fmt(a15.mean));
    svg.append('text').attr('class','lbl-strong').attr('x', narrow ? W - m.r : W - m.r + 18).attr('y', narrow ? nameY : cy + 4)
      .attr('text-anchor', narrow ? 'end' : 'start').style('fill', col).text(status);
  });
}


export {drawScore};
