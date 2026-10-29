import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js?v=20261029-2';
import { worstDay } from '../app.js?v=20261029-2';

function drawCalendar() {
  const c = state.city;
  document.getElementById('stripeCity').textContent = c;
  document.getElementById('stripeTitle').textContent = `Daily PM2.5, ${c}, 2010–2015`;
  const W = widthOf('cal'), m = {t:20, r:6, b:6, l:40};
  const years = [2010,2011,2012,2013,2014,2015], rowH = W < 520 ? 22 : 30, stride = rowH + 20;
  const H = m.t + years.length * stride + m.b;
  const svg = svgFor('cal', W, H);
  const x = d3.scaleLinear().domain([0, 366]).range([m.l, W - m.r]);
  const arr = D.daily[c];
  [0,31,59,90,120,151,181,212,243,273,304,334].forEach((o,i) => { if (W < 520 && i % 2) return;
    svg.append('text').attr('class','lbl').attr('x', x(o)).attr('y', 12).text(MON[i]); });
  const sw = Math.max(1, x(1) - x(0) + 0.4);
  const doy = d => d3.timeDay.count(d3.timeYear(d), d);
  years.forEach((yr, k) => {
    const y0 = m.t + k * stride, g = svg.append('g');
    g.append('text').attr('class','lbl-strong').attr('x', 0).attr('y', y0 + rowH/2 + 4).text(yr);
    const rows = [];
    for (let d = new Date(yr,0,1); d.getFullYear() === yr; d = d3.timeDay.offset(d, 1)) rows.push({d, v: arr[d3.timeDay.count(DAY0, d)]});
    g.selectAll('rect').data(rows).join('rect')
      .attr('x', r => x(doy(r.d))).attr('y', y0).attr('width', sw).attr('height', rowH).attr('shape-rendering','crispEdges')
      .style('fill', r => r.v == null ? 'var(--na)' : `var(--b${bandOf(r.v)})`);
    const hl = g.append('rect').attr('class','day-cursor').attr('x',m.l).attr('y', y0 - 3).attr('height', rowH + 6).attr('width', Math.max(2, sw))
      .style('fill','none').style('stroke','var(--ink)').style('stroke-width',1.5).attr('visibility','hidden').attr('pointer-events','none');
    g.append('rect').attr('x', m.l).attr('y', y0).attr('width', W - m.l - m.r).attr('height', rowH).style('fill','transparent').style('cursor','crosshair')
      .on('pointermove', ev => {
        const i = Math.max(0, Math.min(rows.length - 1, Math.floor(x.invert(d3.pointer(ev)[0])))), r = rows[i];
        hl.attr('visibility','visible').attr('x', x(i) - 0.5);
        showTip(r.v == null ? `${fmtDate(r.d)}<br>No reading` : `${fmtDate(r.d)}<br><b>${fmt(r.v)}</b> µg/m³ · ${BANDS[bandOf(r.v)].r}<br>${(r.v/15).toFixed(1)}× WHO 24-h guideline`, ev);
      })
      .on('pointerleave', () => { hideTip(); hl.attr('visibility','hidden'); });
  });
  const w = worstDay(c), k = years.indexOf(w.d.getFullYear()), y0 = m.t + k * stride, xx = x(doy(w.d)) + sw/2, end = xx > W * 0.6;
  svg.append('line').attr('x1', xx).attr('x2', xx).attr('y1', y0 + rowH).attr('y2', y0 + rowH + 6).style('stroke','var(--ink)');
  svg.append('text').attr('class','lbl-strong').attr('x', end ? xx - 4 : xx + 4).attr('y', y0 + rowH + 15).attr('text-anchor', end ? 'end' : 'start')
    .text(`Worst day · ${d3.timeFormat('%-d %b')(w.d)} · ${fmt(w.v)}`);
}


export {drawCalendar};
