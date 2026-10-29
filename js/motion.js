const preference = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => preference.matches;
const completed = new Set();
let chartObserver;

// Rebuilds after a resize/city change display final geometry immediately if a
// chart has already been introduced. Without observers, content stays visible.
export function introduceChart(svg, key, animate) {
  if (reducedMotion() || completed.has(key) || !('IntersectionObserver' in window)) return;
  svg.node().__introduce = () => {
    if (!reducedMotion()) animate(svg);
    completed.add(key);
  };
  chartObserver ??= new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      chartObserver.unobserve(entry.target);
      entry.target.__introduce?.();
    });
  }, {threshold: 0.18});
  chartObserver.observe(svg.node());
}

export function setupScrollMotion() {
  if (!('IntersectionObserver' in window) || reducedMotion()) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('revealed'); observer.unobserve(entry.target);
  }), {threshold:0.08});
  document.querySelectorAll('.chapter-intro, .chapter > .col, .sources-heading').forEach(el => {
    el.classList.add('reveal'); observer.observe(el);
  });
  preference.addEventListener('change', () => {
    if (reducedMotion()) document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
  });
}

export function revealLine(svg, selector='path.story-line') {
  const path = svg.select(selector).node();
  if (!path) return;
  const len = path.getTotalLength();
  d3.select(path).attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset',len)
    .transition('intro').duration(750).ease(d3.easeCubicOut).attr('stroke-dashoffset',0)
    .on('end',function(){d3.select(this).attr('stroke-dasharray',null).attr('stroke-dashoffset',null);});
}
