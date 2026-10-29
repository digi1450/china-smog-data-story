const preference = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => preference.matches;
const completed = new Set();
let chartObserver;

export function setupDisclosureMotion() {
  const running = new WeakMap();
  // Capture the closed layout before the native summary click changes height.
  document.addEventListener('click', event => {
    const summary = event.target.closest('summary');
    const scene = summary?.closest('.story-deck > .story-scene');
    if (!scene || scene.classList.contains('disclosure-anchored') || event.defaultPrevented) return;
    const top = Math.min(...[...scene.children].map(child => child.getBoundingClientRect().top));
    const border = parseFloat(getComputedStyle(scene).borderTopWidth) || 0;
    scene.style.setProperty('--disclosure-top', `${top - scene.getBoundingClientRect().top + scene.scrollTop - border}px`);
    scene.classList.add('disclosure-anchored');
  }, true);
  addEventListener('resize', () => {
    document.querySelectorAll('.disclosure-anchored').forEach(scene => {
      scene.classList.remove('disclosure-anchored');
      scene.style.removeProperty('--disclosure-top');
    });
  });
  const cancel = details => {
    running.get(details)?.forEach(animation => animation.cancel());
    running.delete(details);
    details.removeAttribute('data-opening');
  };
  document.addEventListener('toggle', event => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement)) return;
    cancel(details);
    if (!details.open || reducedMotion()) return;
    // Nested disclosures keep their own animation and native open/close state.
    for (let parent = details.parentElement?.closest('details'); parent; parent = parent.parentElement?.closest('details')) cancel(parent);
    const summary = details.querySelector(':scope > summary');
    const items = [...details.querySelectorAll('p, caption, thead, tbody tr, details > summary')]
      .filter(item => item !== summary && (item.closest('details') === details ||
        (item.tagName === 'SUMMARY' && item.parentElement.parentElement.closest('details') === details)));
    const animations = items.map((item, index) => item.animate([
      {opacity:0, transform:'translateY(-6px)', clipPath:'inset(0 0 100% 0)'},
      {opacity:1, transform:'translateY(0)', clipPath:'inset(0 0 0 0)'}
    ], {duration:480, delay:Math.min(index * 85, 510), easing:'cubic-bezier(.2,.65,.3,1)', fill:'backwards'}));
    const style = getComputedStyle(details);
    const closedHeight = summary.getBoundingClientRect().height +
      ['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0);
    const openHeight = details.getBoundingClientRect().height;
    details.setAttribute('data-opening','');
    const expand = details.animate([{height:`${closedHeight}px`}, {height:`${openHeight}px`}],
      {duration:Math.min(480 + items.length * 65, 850), easing:'cubic-bezier(.2,.65,.3,1)'});
    animations.push(expand);
    running.set(details, animations);
    expand.onfinish = () => details.removeAttribute('data-opening');
  }, true);
  preference.addEventListener('change', () => {
    if (reducedMotion()) document.querySelectorAll('details').forEach(cancel);
  });
}

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
