import { reducedMotion } from '../motion.js';
import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js';
import { selectCity } from '../app.js';

let mapSel = null;
function drawMap() {
  const W = widthOf('map'), H = Math.round(W * 0.78);
  const svg = svgFor('map', W, H);
  const china = GEO.features.find(f => f.properties.n === 'China');
  const proj = d3.geoConicConformal().parallels([25, 47]).rotate([-105, 0]).fitExtent([[W*0.03, H*0.04], [W*(W < 500 ? 0.8 : 0.9), H*0.96]], china);
  const path = d3.geoPath(proj);
  svg.append('rect').attr('width', W).attr('height', H).style('fill', 'var(--sea)');
  svg.append('g').selectAll('path').data(GEO.features.filter(f => f.properties.n !== 'China')).join('path')
    .attr('d', path).style('fill', 'var(--land-other)').style('stroke', 'var(--border)').style('stroke-width', 0.6);
  svg.append('path').datum(china).attr('d', path).style('fill', 'var(--land)').style('stroke', 'var(--ink-3)').style('stroke-width', 1);
  // haze filter
  const defs = svg.append('defs');
  defs.append('filter').attr('id', 'haze').attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%')
    .append('feGaussianBlur').attr('stdDeviation', W < 500 ? 7 : 11);
  const r = d3.scaleSqrt().domain([0, 200]).range([4, W < 500 ? 26 : 38]).clamp(true);
  const g = svg.append('g');
  const cities = g.selectAll('g').data(CITIES).join('g').attr('class', 'city-g')
    .attr('transform', c => `translate(${proj([INFO[c].lon, INFO[c].lat])})`)
    .attr('tabindex', 0).attr('role', 'button').attr('aria-label', c => `Show ${c}`)
    .on('click', (e, c) => selectCity(c))
    .on('keydown', (e, c) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCity(c); } })
    .on('pointermove', (ev, c) => { const v = MV[c][state.month];
      showTip(`<div class="row"><i style="background:${cvar(c)}"></i><b>${c}</b></div>${d3.timeFormat('%B %Y')(MONTHS[state.month])}<br>${v == null ? 'No data' : `<b>${Math.round(v)}</b> µg/m³ · ${BANDS[bandOf(v)].r} µg/m³ bin`}`, ev); })
    .on('pointerleave', hideTip);
  cities.append('circle').attr('class', 'cloud').attr('filter', 'url(#haze)');
  cities.append('circle').attr('class', 'core');
  cities.append('circle').attr('class', 'ring').style('fill', 'none');
  cities.append('circle').attr('class', 'pin').attr('r', 3.5).style('fill', c => cvar(c)).style('stroke', 'var(--surface)').style('stroke-width', 1.5);
  const lab = cities.append('g').attr('class', 'lab');

  lab.append('text').attr('class', 'en').style('font-family', 'var(--f-mono)').style('font-size', '11px').style('fill', 'var(--ink-2)').attr('dy', 0).text(c => c);
  lab.append('text').attr('class', 'val').style('font-family', 'var(--f-mono)').style('font-size', '11px').style('font-weight', 500).style('fill', 'var(--ink)').attr('dy', 15);
  mapSel = { cities, r, W };
  updateMap();
}
function updateMap() {
  if (!mapSel) return;
  const { cities, r } = mapSel, i = state.month;
  cities.each(function (c) {
    const v = MV[c][i], g = d3.select(this), rad = v == null ? 7 : r(v);
    g.select('.cloud').transition().duration(reducedMotion() ? 0 : 600).attr('r', v == null ? 0 : rad * 1.25)
      .style('fill', v == null ? 'transparent' : `var(--b${bandOf(v)})`).style('opacity', 0.75);
    g.select('.core').transition().duration(reducedMotion() ? 0 : 600).attr('r', rad)
      .style('fill', v == null ? 'transparent' : `var(--b${bandOf(v)})`).style('opacity', v == null ? 1 : 0.9)
      .style('stroke', v == null ? 'var(--ink-3)' : 'none').style('stroke-width', 1.5).style('stroke-dasharray', null);
    const sel = c === state.city;
    g.select('.ring').transition().duration(reducedMotion() ? 0 : 600).attr('r', rad + 5).style('stroke', sel ? 'var(--ink)' : 'transparent').style('stroke-width', 2);
    const side = INFO[c].side, off = rad + 9;
    g.select('.lab').attr('transform', `translate(${side === 'left' ? -off : off},-6)`)
      .selectAll('text').attr('text-anchor', side === 'left' ? 'end' : 'start');
    g.select('.val').text(v == null ? 'no data' : `${Math.round(v)} µg/m³`);

    if (sel) g.raise();
  });
}


export {drawMap,updateMap};
