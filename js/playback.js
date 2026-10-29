// Timer ownership is independent of rendering. A manual pause stays paused
// when a visibility blocker is removed; only requested playback can resume.
export function createPlayback({atEnd, advance, reset, onState, schedule = setTimeout, cancel = clearTimeout}) {
  let requested = false, timer = null, first = true;
  const blockers = new Set();
  function sync() {
    if (timer !== null) cancel(timer);
    timer = null;
    if (requested && blockers.size === 0) {
      timer = schedule(() => {
        timer = null;
        first = false;
        if (atEnd()) reset(); else advance();
        sync();
      }, first ? 2000 : atEnd() ? 2500 : 950);
    }
    onState({requested, active: requested && blockers.size === 0, blockers: [...blockers]});
  }
  return {
    play(initial = false) { requested = true; first = initial; sync(); },
    pause() { requested = false; sync(); },
    toggle() { requested = !requested; first = false; sync(); },
    suspend(reason, value) { if (value) blockers.add(reason); else blockers.delete(reason); sync(); },
    dispose() { requested = false; sync(); }
  };
}
