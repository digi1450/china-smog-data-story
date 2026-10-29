import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js?v=20261030-3';
import { setMonth, stopPlay } from '../app.js?v=20261030-3';

let mini = null;
function drawMini() {
  const W = widthOf('mini'), H = innerWidth >= 1000 && innerHeight >= 650 ? 92 : 150, m = {t:22, r:8, b:20, l:30};
  const svg = svgFor('mini', W, H);
  const x = d3.scaleLinear().domain([0, 71]).range([m.l, W - m.r]);
  const ymax = Math.ceil(d3.max(CITIES.flatMap(c => MV[c]).filter(v => v != null))/50)*50;
  const y = d3.scaleLinear().domain([0, ymax]).range([H - m.b, m.t]);
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(4)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', d => y(d)).attr('y2', d => y(d));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues(y.ticks(3)).tickSize(0).tickPadding(5)).call(g => g.select('.domain').remove());
  [0, 12, 24, 36, 48, 60].forEach(i => svg.append('text').attr('class', 'lbl').attr('x', x(i)).attr('y', H - 4).text(2010 + i / 12));
  svg.append('line').attr('x1', x(PLAN_I)).attr('x2', x(PLAN_I)).attr('y1', m.t).attr('y2', H - m.b)
    .style('stroke', 'var(--ink-3)').style('stroke-width', 1).attr('stroke-dasharray','4 3');
  svg.append('text').attr('class','lbl').attr('x',x(PLAN_I) - 5).attr('y',12).attr('text-anchor','end').text('Plan · Sep 2013');
  const line = d3.line().defined(v => v != null).x((v, i) => x(i)).y(v => y(v));
  CITIES.filter(c => c !== state.city).forEach(c => svg.append('path').attr('d', line(MV[c])).style('fill', 'none').style('stroke', 'var(--grid)').style('stroke-width', 1.2));
  svg.append('path').attr('d', line(MV[state.city])).style('fill', 'none').style('stroke', cvar(state.city)).style('stroke-width', 2).style('stroke-linejoin', 'round');
  const mk = svg.append('g');
  mk.append('circle').attr('class', 'md').attr('r', 4.5).style('fill', cvar(state.city)).style('stroke', 'var(--surface)').style('stroke-width', 2);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).style('fill', 'transparent').style('cursor', 'pointer')
    .on('click', ev => { stopPlay(); setMonth(Math.round(x.invert(d3.pointer(ev)[0]))); })
    .on('pointermove', ev => { const i = Math.max(0, Math.min(71, Math.round(x.invert(d3.pointer(ev)[0])))), v = MV[state.city][i];
      showTip(`${d3.timeFormat('%B %Y')(MONTHS[i])}<br>${v == null ? 'No data' : `<b>${Math.round(v)}</b> µg/m³`}<br><span style="opacity:.7">Click to jump here</span>`, ev); })
    .on('pointerleave', hideTip);
  mini = { x, y, mk };
  updateMiniMarker();
}
function updateMiniMarker() {
  if (!mini) return;
  const { x, y, mk } = mini, i = state.month, v = MV[state.city][i];
  mk.select('.md').attr('cx', x(i)).attr('cy', v == null ? -20 : y(v)).style('opacity', v == null ? 0 : 1);
}


export {drawMini,updateMiniMarker};
