import { reducedMotion } from './motion.js?v=aab38014ca01';
import { navigateToScene } from './presentation.js?v=aab38014ca01';

export function setupStoryNavigation() {
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
