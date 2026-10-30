import { D, DAY0, fmt, bandOf } from './core.js?v=aab38014ca01';
import { reducedMotion } from './motion.js?v=aab38014ca01';
import { createWheelIntent } from './wheel-intent.js?v=aab38014ca01';
import { replayScoreReveal } from './charts/score.js?v=aab38014ca01';

const chapters = [
  ['top', 'The question', '2010–2015'],
  ['explorer', 'Five cities', 'Explore'],
  ['crisis-section', 'The crisis', 'Jan 2013'],
  ['results-section', 'The change', '2014 → 2015'],
  ['extremes-section', 'The extremes', '2014 → 2015'],
  ['wind-section', 'The weather', 'Before / after'],
  ['verdict-section', 'The answer', 'Through 2015'],
  ['trend-section', 'Q&A · The timeline', '2010–2015'],
  ['daily-section', 'Q&A · Every day', '2010–2015'],
  ['trust-section', 'Q&A · The cross-check', 'Paired days'],
  ['coverage-section', 'Q&A · Data coverage', 'The record'],
  ['sources', 'Q&A · Sources & method', 'References']
];

let navigate = () => false;
export const navigateToScene = (target, instant = false) => navigate(target, instant);

export function setupPresentation() {
  const scenes = chapters.map(([id]) => document.getElementById(id));
  const deck = document.createElement('main');
  deck.className = 'story-deck'; deck.setAttribute('aria-label', 'Interactive data story');
  scenes[0].before(deck);
  scenes.forEach((scene, i) => {
    scene.classList.add('story-scene');
    scene.dataset.chapter = String(i + 1).padStart(2, '0');
    scene.setAttribute('tabindex', '-1');
    deck.append(scene);
  });
  document.documentElement.classList.add('deck-ready');
  const nav = document.createElement('nav');
  nav.className = 'story-rail'; nav.setAttribute('aria-label', 'All story chapters');
  nav.innerHTML = chapters.map(([id, label], i) => `<a href="#${id}" aria-label="${i + 1}. ${label}"><span class="rail-label">${label}</span><span class="rail-dot" aria-hidden="true"></span></a>`).join('');
  document.body.append(nav);
  const controls = document.createElement('nav');
  controls.className = 'story-controls'; controls.setAttribute('aria-label', 'Move through the story');
  controls.innerHTML = '<a class="story-prev" aria-label="Previous chapter">←</a><span class="story-position"><span class="story-count"></span><span class="story-label"></span></span><a class="story-next" aria-label="Next chapter">→</a><span class="story-progress" aria-hidden="true"></span>';
  document.body.append(controls);
  const dots = [...nav.querySelectorAll('a')];
  const previous = controls.querySelector('.story-prev'), next = controls.querySelector('.story-next');
  let active = 0, transitioning = false, transitionTimer;
  let scrollingUntil = 0;
  const wheelIntent = createWheelIntent();
  const update = (instant = false) => {
    scenes.forEach((scene, i) => {
      scene.style.transitionDuration = instant || reducedMotion() ? '0ms' : '';
      scene.style.transform = `translate3d(0, ${(i - active) * 100}%, 0)`;
      scene.inert = i !== active;
      scene.setAttribute('aria-hidden', String(i !== active));
      scene.classList.toggle('is-current', i === active);
    });
    dots.forEach((dot, i) => {
      if (i === active) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
      dot.classList.toggle('is-read', i < active);
    });
    controls.querySelector('.story-count').textContent = `${String(active + 1).padStart(2, '0')} / ${scenes.length}`;
    controls.querySelector('.story-label').textContent = chapters[active][1];
    controls.style.setProperty('--story-progress', `${(active + 1) / scenes.length * 100}%`);
    [[previous, active - 1], [next, active + 1]].forEach(([link, destination]) => {
      const available = destination >= 0 && destination < scenes.length;
      if (available) link.setAttribute('href', '#' + chapters[destination][0]); else link.removeAttribute('href');
      link.setAttribute('aria-disabled', String(!available));
    });
    document.dispatchEvent(new CustomEvent('storychange', {detail:{id:chapters[active][0]}}));
  };
  const go = (index, instant = false) => {
    if (index < 0 || index >= scenes.length || (transitioning && !instant)) return false;
    if (index === active) return true;
    active = index; transitioning = !instant && !reducedMotion();
    wheelIntent.consume();
    clearTimeout(transitionTimer);
    scenes[active].scrollTop = 0;
    update(instant);
    scenes[active].focus({preventScroll:true});
    transitionTimer = setTimeout(() => { transitioning = false; }, transitioning ? 740 : 0);
    return true;
  };
  navigate = (target, instant) => {
    const index = scenes.indexOf(target);
    if (index === -1) return false;
    // A known destination remains handled while a transition is in progress.
    go(index, instant);
    return true;
  };
  // Let long references, expanded evidence and nested tables scroll before
  // moving on. A short boundary pause separates reading from changing slides.
  const canScroll = (target, direction) => {
    for (let el = target instanceof Element ? target : null; el && deck.contains(el); el = el.parentElement) {
      if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue;
      if (direction > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 6 : el.scrollTop > 2) return el;
    }
    return false;
  };
  window.addEventListener('wheel', event => {
    if (document.querySelector('dialog[open]')) return;
    if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    if (event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
    const now = performance.now(), direction = Math.sign(event.deltaY);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const intentional = wheelIntent.sample(delta, now);
    if (transitioning) { wheelIntent.consume(); return; }
    const target = scenes[active].contains(event.target) ? event.target : scenes[active];
    const scroller = canScroll(target, direction);
    if (scroller) {
      scroller.scrollBy({top:delta, behavior:'instant'});
      scrollingUntil = now + 180;
      wheelIntent.consume();
      return;
    }
    if (now < scrollingUntil) { wheelIntent.consume(); return; }
    if (intentional) go(active + direction);
  }, {passive:false, capture:true});
  let touchStart = null;
  deck.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY, target:event.target} : null;
  }, {passive:true});
  deck.addEventListener('touchmove', event => {
    if (document.querySelector('dialog[open]')) return;
    if (!touchStart || event.touches.length !== 1) return;
    const dx = touchStart.x - event.touches[0].clientX, dy = touchStart.y - event.touches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) || touchStart.target.closest('input, select, textarea')) return;
    if (canScroll(touchStart.target, Math.sign(dy))) { touchStart.scrolling = true; return; }
    if (touchStart.scrolling) { event.preventDefault(); return; }
    event.preventDefault();
    if (Math.abs(dy) >= 55) { go(active + Math.sign(dy)); touchStart = null; }
  }, {passive:false});
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        event.target.closest('input, select, textarea, button, summary, a, [contenteditable="true"], [role="slider"], .score-row')) return;
    let index;
    if (['PageDown','ArrowDown',' '].includes(event.key)) index = active + (event.key === ' ' && event.shiftKey ? -1 : 1);
    else if (['PageUp','ArrowUp'].includes(event.key)) index = active - 1;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = scenes.length - 1;
    else return;
    const direction = index > active ? 1 : -1;
    if (event.key !== 'Home' && event.key !== 'End' && canScroll(scenes[active], direction)) return;
    event.preventDefault(); go(index);
  });
  document.getElementById('scoreReveal').addEventListener('click', replayScoreReveal);
  drawFingerprint(); update(true);
}

function drawFingerprint() {
  const start = d3.timeDay.count(DAY0, new Date(2013, 0, 1));
  const days = D.daily.Beijing.slice(start, start + 31);
  const peak = d3.max(days);
  const peakDay = days.indexOf(peak) + 1;
  document.getElementById('airPeak').innerHTML = `<span>Highest daily mean · ${peakDay} Jan</span><strong>${fmt(peak)} <small>µg/m³</small></strong>`;
  const fingerprint = document.getElementById('airFingerprint');
  fingerprint.innerHTML = days.map((v, i) => `<span${i + 1 === peakDay ? ' class="is-peak"' : ''} style="--height:${v == null ? 2 : Math.max(3, v / peak * 100)}%;--bar-colour:var(--b${v == null ? 0 : bandOf(v)});--delay:${i * 18}ms" title="${i + 1} Jan: ${v == null ? 'No data' : fmt(v)+' µg/m³'}">${i + 1 === peakDay ? `<span class="air-peak-day">${peakDay} Jan</span>` : ''}</span>`).join('');
  if (!reducedMotion()) fingerprint.classList.add('is-animated');
}
