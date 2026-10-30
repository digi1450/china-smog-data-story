import { createPlayback } from './playback.js?v=20261030-9';
import { setupScrollMotion, setupDisclosureMotion, reducedMotion } from './motion.js?v=20261030-9';
import { setupPresentation, navigateToScene } from './presentation.js?v=20261030-9';
import { D, GEO, CITIES, CK, cvar, INFO, BANDS, bandOf, MON, MONTHS, PLAN_I, DAY0, fmtDate, ym, COMMON_I, state, MV, annualOf, fmt, showTip, hideTip, svgFor, widthOf } from './core.js?v=20261030-9';
import { drawMap,updateMap } from './charts/map.js?v=20261030-9';
import { drawMini,updateMiniMarker } from './charts/mini.js?v=20261030-9';
import { drawCalendar } from './charts/calendar.js?v=20261030-9';
import { drawScore } from './charts/score.js?v=20261030-9';
import { drawWind } from './charts/wind.js?v=20261030-9';
import { drawTrust } from './charts/trust.js?v=20261030-9';
import { drawCrisis,drawTrend,drawExceed,fillEvidence } from './charts/story.js?v=20261030-9';

const bandLegendHTML = BANDS.map((b,i) => `<span><i style="background:var(--b${i})"></i>${b.r}</span>`).join('');
document.getElementById('bandLegend').innerHTML = bandLegendHTML;
document.getElementById('mapLegend').innerHTML = bandLegendHTML + '<span><i class="dot" style="background:transparent;border:1.5px solid var(--ink-3)"></i>insufficient data</span>';
function layoutTrack() {
  const span = 71 - state.min;
  document.getElementById('planMark').style.left = ((PLAN_I - state.min) / span * 100) + '%';
  const ticks = state.min === 0 ? [[0,'2010'],[12,'2011'],[24,'2012'],[36,'2013'],[48,'2014'],[60,'2015']] : [[40,'May 2013'],[48,'2014'],[60,'2015']];
  document.getElementById('ticks').innerHTML = ticks.map(([i, y]) =>
    `<span style="left:${(i - state.min) / span * 100}%;${i === state.min ? '' : 'transform:translateX(-50%)'}">${y}</span>`).join('');
  slider.min = state.min;
}
document.getElementById('rangeBtn').addEventListener('click', e => {
  const all = state.min === COMMON_I;
  state.min = all ? 0 : COMMON_I;
  e.currentTarget.setAttribute('aria-pressed', all);
  e.currentTarget.textContent = all ? 'Common period only' : 'Show 2010–2013 too';
  document.getElementById('rangeNote').textContent = all
    ? 'Showing all months. Before May 2013 some monitors were not running yet, so not every city can be compared.'
    : 'Showing May 2013 – Dec 2015, a shared calendar window; with missing months still excluded.';
  stopPlay(); layoutTrack(); setMonth(all ? 36 : COMMON_I);
});

/* city chips */
const chipEl = document.getElementById('cityChips');
chipEl.innerHTML = CITIES.map(c => `<button class="chip" id="chip-${CK[c]}" data-c="${c}" aria-pressed="${c === state.city}"><i style="background:${cvar(c)}"></i>${c}</button>`).join('');
chipEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) selectCity(b.dataset.c); });


const slider = document.getElementById('month');
const whenEl = document.getElementById('when');
function setMonth(i) {
  state.month = Math.max(state.min, Math.min(71, i)); slider.value = state.month;
  const after = state.month >= PLAN_I;
  const n = CITIES.filter(c => MV[c][state.month] != null).length;
  const sub = (state.month === PLAN_I ? 'Transition month: plan issued September 2013' : after ? 'After the plan was issued' : 'Before the Action Plan') + (n < 5 ? ` · only ${n} of 5 cities have data` : '');
  whenEl.innerHTML = `${d3.timeFormat('%B %Y')(MONTHS[state.month])}<small class="${n < 5 ? 'warn' : ''}">${sub}</small>`;
  whenEl.classList.toggle('after', after);
  updateMap(); updatePanelMonth(); updateMiniMarker();
}
slider.addEventListener('input', () => { stopPlay(); setMonth(+slider.value); });
const playBtn = document.getElementById('play');
let playback;
function stopPlay() { playback?.pause(); }
playBtn.addEventListener('click', () => playback?.toggle());
document.getElementById('replay').addEventListener('click', () => {
  setMonth(state.min); playback?.play();
});

function setupPlayback() {
  playback = createPlayback({
    atEnd: () => state.month >= 71,
    advance: () => setMonth(state.month + 1),
    reset: () => setMonth(state.min),
    onState: ({requested, active, blockers}) => {
      playBtn.textContent = requested ? '❚❚ Pause' : '▶ Play';
      playBtn.setAttribute('aria-label', requested ? 'Pause the months' : 'Play the months');
      playBtn.setAttribute('aria-pressed', String(requested));
      document.getElementById('panel').setAttribute('aria-live', requested ? 'off' : 'polite');
      document.getElementById('playbackStatus').textContent = requested
        ? active ? 'Playing month by month · loops at December 2015' : 'Playback paused while the map is out of view'
        : 'Paused · select a month or press Play to explore';
    }
  });
  playback.suspend('hidden', document.hidden);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      playback.suspend('offscreen', !entry.isIntersecting);
    }, {threshold:0});
    observer.observe(document.querySelector('#explorer'));
  }
  document.addEventListener('visibilitychange', () => playback.suspend('hidden',document.hidden));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {if (e.matches) stopPlay();});
}

/* ---------------- PANEL ---------------- */
function worstDay(c) {
  const arr = D.daily[c]; let best = -1, bi = -1;
  arr.forEach((v, i) => { if (v != null && v > best) { best = v; bi = i; } });
  return { v: best, d: d3.timeDay.offset(DAY0, bi) };
}
function selectCity(c) {
  stopPlay();
  state.city = c;
  chipEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === c));
  updateMap(); updatePanel(); drawMini(); drawCalendar(); drawTrend();
  if (!reducedMotion()) document.querySelector('#panel .cityhead').animate(
    [{opacity:.3, transform:'translateY(5px)'},{opacity:1, transform:'translateY(0)'}],
    {duration:280, easing:'ease-out'});
}
function updatePanelMonth() {
  const c = state.city, v = MV[c][state.month];
  document.getElementById('sMonthK').textContent = d3.timeFormat('%b %Y')(MONTHS[state.month]);
  document.getElementById('sMonth').textContent = v == null ? '–' : Math.round(v);
  document.getElementById('sMonthS').innerHTML = v == null ? 'no data' : `<span class="pill"><i style="background:var(--b${bandOf(v)})"></i>${BANDS[bandOf(v)].r} µg/m³</span>`;
}
function updatePanel() {
  const c = state.city, I = INFO[c];
  document.getElementById('pDot').style.background = cvar(c);
  document.getElementById('pEn').textContent = c;
  document.getElementById('pRegion').textContent = I.region;
  updatePanelMonth();
  const a15 = annualOf(c, 2015);
  document.getElementById('s2015').textContent = Math.round(a15.mean);
  document.getElementById('s2015S').textContent = `${(a15.mean / 5).toFixed(1)}× WHO 2021 annual reference`;
  const w = worstDay(c);
  document.getElementById('sWorst').textContent = fmt(w.v);
  document.getElementById('sWorstS').textContent = fmtDate(w.d);
  const m = document.getElementById('meter');
  const a14 = annualOf(c, 2014);
  const chg = (a15.mean / a14.mean - 1) * 100;
  m.innerHTML = `<div class="top"><span>Station change, 2014 → 2015</span><b>${chg > 0 ? '+' : ''}${fmt(chg)}%</b></div>
    <div class="top"><span>${fmt(a14.mean)} → ${fmt(a15.mean)} µg/m³ · ${a14.days}/${a15.days} valid days</span></div>`;
  document.getElementById('stationPolicy').innerHTML = `<b>Policy context:</b> ${I.policy} Data end in 2015; target attainment is not evaluated.`;
  document.getElementById('why').innerHTML = I.why;
}


function renderAll() {
 layoutTrack(); drawMap(); updatePanel(); drawMini(); drawCalendar(); drawScore(); drawWind(); drawTrust();
 drawCrisis(); drawTrend(); drawExceed(); setMonth(state.month);
}
function setupStoryNavigation() {
 const targetFor = hash => {
   try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
   catch { return null; }
 };
 const clearFragment = () => {
   if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
 };
 // Keep real anchor destinations as a fallback, without adding scroll stops
 // to browser history during normal in-page navigation.
 document.addEventListener('click', event => {
   if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
   const link = event.target.closest('a[href^="#"]');
   if (!link) return;
   const target = targetFor(link.getAttribute('href'));
   if (!target) return;
   event.preventDefault();
   clearFragment();
   if (navigateToScene(target)) return;
   if (!target.hasAttribute('tabindex')) {
     target.setAttribute('tabindex', '-1');
     target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once:true});
   }
   target.focus({preventScroll:true});
   target.scrollIntoView({behavior:reducedMotion() ? 'auto' : 'smooth', block:'start'});
 });
 // An incoming bookmarked section still opens at its destination, then the
 // address is normalized without reloading or adding another history entry.
 const openIncomingSection = () => {
   if (!location.hash) return;
   const incomingTarget = targetFor(location.hash);
   clearFragment();
   if (incomingTarget && !navigateToScene(incomingTarget, true)) incomingTarget.scrollIntoView({behavior:'instant', block:'start'});
 };
 openIncomingSection();
 addEventListener('hashchange', openIncomingSection);
}
function boot() {
 fillEvidence(); setupPresentation(); renderAll(); document.getElementById('loadStatus').hidden = true;
 setupPlayback(); setupScrollMotion(); setupDisclosureMotion(); setupStoryNavigation();
 document.querySelectorAll('[data-dialog]').forEach(button => {
   button.addEventListener('click', () => document.getElementById(button.dataset.dialog).showModal());
 });
 const themeButton = document.getElementById('theme');
 const themes = ['auto','light','dark'];
 themeButton.addEventListener('click', () => {
   const theme = themes[(themes.indexOf(document.documentElement.dataset.theme || 'auto')+1)%themes.length];
   if (theme === 'auto') delete document.documentElement.dataset.theme;
   else document.documentElement.dataset.theme = theme;
   themeButton.textContent = `Theme: ${theme[0].toUpperCase()+theme.slice(1)}`;
 });
 let rt, lastW = innerWidth, lastH = innerHeight;
 addEventListener('resize', () => {
   if (innerWidth === lastW && innerHeight === lastH) return;
   const heightOnly = innerWidth === lastW && innerWidth < 1000;
   lastW=innerWidth; lastH=innerHeight;
   clearTimeout(rt); rt=setTimeout(heightOnly ? () => {drawCrisis(); drawScore();} : renderAll,150);
 });
 addEventListener('scroll',hideTip,{passive:true});
 document.addEventListener('storychange',hideTip);
}
export {boot,selectCity,setMonth,stopPlay,worstDay};
