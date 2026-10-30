import { hideTip } from './core.js?v=aab38014ca01';
import { setupScrollMotion, setupDisclosureMotion } from './motion.js?v=aab38014ca01';
import { setupPresentation } from './presentation.js?v=aab38014ca01';
import { setupStoryNavigation } from './navigation.js?v=aab38014ca01';
import { setupExplorer, renderExplorer } from './explorer.js?v=aab38014ca01';
import { drawScore } from './charts/score.js?v=aab38014ca01';
import { drawWind } from './charts/wind.js?v=aab38014ca01';
import { drawTrust } from './charts/trust.js?v=aab38014ca01';
import { drawCrisis, drawTrend, drawExceed, fillEvidence } from './charts/story.js?v=aab38014ca01';

function renderAll() {
  renderExplorer();
  drawScore();
  drawWind();
  drawTrust();
  drawCrisis();
  drawTrend();
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
    timer = setTimeout(heightOnly ? () => { drawCrisis(); drawScore(); } : renderAll, 150);
  });
}
