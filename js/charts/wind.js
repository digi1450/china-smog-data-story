import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from '../core.js?v=20261030-3';

function drawWind() {
  const order = ['cv','SE','NW','NE'], name = {cv:'Calm/var.', SE:'South-east', NW:'North-west', NE:'North-east'};
  const rows = order.map(k => D.wind.find(w => w.wd === k));
  const W = widthOf('wind'), narrow = W < 520, m = {t:18, r: narrow ? 86 : 150, b:26, l: narrow ? 74 : 96}, rh = 52;
  const H = m.t + rows.length * rh + m.b;
  const svg = svgFor('wind', W, H);
  const x = d3.scaleLinear().domain([0, 180]).range([m.l, W - m.r]);
  svg.append('g').attr('class','grid').selectAll('line').data(x.ticks(4)).join('line').attr('x1', d => x(d)).attr('x2', d => x(d)).attr('y1', m.t - 6).attr('y2', H - m.b);
  svg.append('g').attr('class','axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(4).tickSize(0).tickPadding(8)).call(g => g.select('.domain').remove());
  svg.append('text').attr('class','lbl').attr('x', W - m.r + 12).attr('y', m.t - 4).text('Share of days');
  rows.forEach((r, k) => {
    const cy = m.t + k * rh + rh/2;
    svg.append('text').attr('class','lbl-strong').attr('x', 0).attr('y', cy + 4).text(name[r.wd]);
    svg.append('line').attr('x1', x(r.before)).attr('x2', x(r.after)).attr('y1', cy).attr('y2', cy).style('stroke','var(--ink-3)').style('stroke-width', 2);
    const tipHtml = `<b>${name[r.wd]} wind, Beijing</b><br>2011–2012: ${fmt(r.before)} µg/m³ (${r.before_n} days)<br>2014–2015: ${fmt(r.after)} µg/m³ (${r.after_n} days)<br>Change: ${Math.round((r.after/r.before-1)*100)}%`;
    [['before','var(--before)'],['after','var(--accent)']].forEach(([p, col]) => {
      svg.append('circle').attr('cx', x(r[p])).attr('cy', cy).attr('r', 7).style('fill', col).style('stroke','var(--surface)').style('stroke-width', 2)
        .on('pointermove', ev => showTip(tipHtml, ev)).on('pointerleave', hideTip);
    });
    svg.append('text').attr('class','lbl').attr('x', x(r.before)).attr('y', cy - 13).attr('text-anchor', 'middle').text(Math.round(r.before));
    svg.append('text').attr('class','lbl-strong').attr('x', x(r.after)).attr('y', cy + 22).attr('text-anchor', 'middle').text(Math.round(r.after));
    svg.append('text').attr('class','lbl-strong').attr('x', W - m.r + 12).attr('y', cy + 4).text(`${Math.round(r.before_share)}% → ${Math.round(r.after_share)}%`);
  });
}


export {drawWind};
