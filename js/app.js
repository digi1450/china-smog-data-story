import { hideTip } from './core.js?v=bc46f842bc35';
import { setupScrollMotion, setupDisclosureMotion } from './motion.js?v=bc46f842bc35';
import { setupPresentation } from './presentation.js?v=bc46f842bc35';
import { setupStoryNavigation } from './navigation.js?v=bc46f842bc35';
import { setupExplorer, renderExplorer } from './explorer.js?v=bc46f842bc35';
import { drawScore } from './charts/score.js?v=bc46f842bc35';
import { drawWind } from './charts/wind.js?v=bc46f842bc35';
import { drawCrisis, drawExceed, fillEvidence } from './charts/story.js?v=bc46f842bc35';

function renderAll() {
  renderExplorer();
  drawScore();
  drawWind();
  drawCrisis();
  drawExceed();
}

export function boot() {
  fillEvidence();
  setupPresentation();
  renderAll();
  document.getElementById('loadStatus').hidden = true;
  setupExplorer();
  setupScrollMotion();
  setupDisclosureMotion();
  setupStoryNavigation();
  setupDialogs();
  setupTheme();
  document.querySelector('.team-roster').addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) event.stopPropagation();
  });
  setupVerdictInteractions();
  setupResize();
  addEventListener('scroll', hideTip, {passive:true});
  document.addEventListener('storychange', hideTip);
}

function setupDialogs() {
  document.querySelectorAll('[data-dialog]').forEach(button => {
    button.addEventListener('click', () => document.getElementById(button.dataset.dialog).showModal());
  });
}

function setupTheme() {
  const button = document.getElementById('theme');
  const themes = ['auto', 'light', 'dark'];
  button.addEventListener('click', () => {
    const theme = themes[(themes.indexOf(document.documentElement.dataset.theme || 'auto') + 1) % themes.length];
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    button.textContent = `Theme: ${theme[0].toUpperCase() + theme.slice(1)}`;
  });
}

function setupResize() {
  let timer, lastWidth = innerWidth, lastHeight = innerHeight;
  addEventListener('resize', () => {
    if (innerWidth === lastWidth && innerHeight === lastHeight) return;
    const heightOnly = innerWidth === lastWidth && innerWidth < 1000;
    lastWidth = innerWidth;
    lastHeight = innerHeight;
    clearTimeout(timer);
    timer = setTimeout(heightOnly ? () => { drawCrisis(); drawScore(); drawExceed(); drawWind(); } : renderAll, 150);
  });
}

function setupVerdictInteractions() {
  const figure=document.querySelector('#verdict-section .verdict-visual');
  const buttons=document.querySelectorAll('[data-verdict]');
  const select=mode=>{
    figure.dataset.focus=mode;
    buttons.forEach(b=>{const active=b.dataset.verdict===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  };
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.verdict)));
  select('both');
}
