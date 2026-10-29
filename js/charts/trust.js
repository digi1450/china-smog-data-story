import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js';

const sel = document.getElementById('stationSel');
sel.innerHTML = D.trust.map((t, i) => `<option value="${i}">${t.city} · ${t.station}</option>`).join('');
sel.addEventListener('change', drawTrust);
function drawTrust() {
  const t = D.trust[+sel.value || 0];
  const S = Math.min(widthOf('trust'), innerWidth >= 1000 ? Math.max(280, Math.min(420, innerHeight * .44)) : 480), m = {t:12, r:12, b:40, l:46};
  const svg = svgFor('trust', S, S);
  d3.select('#trust svg').style('max-width', S + 'px');
  const mx = Math.ceil(d3.max(t.pts, p => Math.max(p[0], p[1])) / 100) * 100;
  const x = d3.scaleLinear().domain([0, mx]).range([m.l, S - m.r]), y = d3.scaleLinear().domain([0, mx]).range([S - m.b, m.t]);
  svg.append('g').attr('class','grid').selectAll('line').data(x.ticks(5)).join('line').attr('x1', m.l).attr('x2', S - m.r).attr('y1', d => y(d)).attr('y2', d => y(d));
  svg.append('g').attr('class','axis').attr('transform', `translate(0,${S - m.b})`).call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));
  svg.append('g').attr('class','axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(6)).call(g => g.select('.domain').remove());
  svg.append('text').attr('class','lbl').attr('x', S - m.r).attr('y', S - 6).attr('text-anchor','end').text('US monitor, µg/m³ →');
  svg.append('text').attr('class','lbl').attr('x', m.l + 4).attr('y', m.t + 10).text(`↑ ${t.station}, µg/m³`);
  svg.append('line').attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(mx)).attr('y2', y(mx)).style('stroke','var(--ink-3)');
  svg.append('g').selectAll('circle').data(t.pts).join('circle').attr('cx', p => x(p[0])).attr('cy', p => y(p[1])).attr('r', 2.6).style('fill', cvar(t.city)).style('opacity', 0.45);
  const del = d3.Delaunay.from(t.pts, p => x(p[0]), p => y(p[1]));
  const hl = svg.append('circle').attr('r', 5).style('fill', cvar(t.city)).style('stroke','var(--surface)').style('stroke-width',2).attr('hidden', true);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', S - m.l - m.r).attr('height', S - m.t - m.b).style('fill','transparent')
    .on('pointermove', ev => { const [px, py] = d3.pointer(ev), p = t.pts[del.find(px, py)];
      hl.attr('hidden', null).attr('cx', x(p[0])).attr('cy', y(p[1]));
      showTip(`US monitor: <b>${fmt(p[0])}</b><br>${t.station}: <b>${fmt(p[1])}</b><br>${p[2]}<br>Gap: ${p[1]-p[0] > 0 ? '+' : ''}${fmt(p[1]-p[0])} µg/m³`, ev); })
    .on('pointerleave', () => { hideTip(); hl.attr('hidden', true); });
  const diff = (t.meanCN - t.meanUS).toFixed(1);
  document.getElementById('trustStat').textContent = `${t.city} · ${t.station}: ${t.n} shared days · r = ${t.r.toFixed(3)} · mean ${fmt(t.meanCN)} vs US ${fmt(t.meanUS)} (signed bias ${diff > 0 ? '+' : ''}${diff} µg/m³); MAE ${fmt(t.mae)} µg/m³; ${t.pts.length} of ${t.n} paired days plotted`;
}


export {drawTrust};
