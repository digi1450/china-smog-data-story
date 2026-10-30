// Charts request explorer changes without importing the application controller.
export const EXPLORER_EVENTS = {
  city: 'explorer:city',
  month: 'explorer:month',
  pause: 'explorer:pause'
};

export function selectCity(city) {
  document.dispatchEvent(new CustomEvent(EXPLORER_EVENTS.city, {detail: {city}}));
}

export function setMonth(month) {
  document.dispatchEvent(new CustomEvent(EXPLORER_EVENTS.month, {detail: {month}}));
}

export function stopPlay() {
  document.dispatchEvent(new CustomEvent(EXPLORER_EVENTS.pause));
}
