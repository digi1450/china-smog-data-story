// Compare recent wheel strength with its longer trend. Samples continue during
// transitions so a decaying trackpad tail is still recognized afterwards.
export function createWheelIntent() {
  let samples = [], previousTime = -Infinity, direction = 0, distance = 0;
  return {
    sample(delta, time) {
      const nextDirection = Math.sign(delta);
      if (!nextDirection) return false;
      if (time - previousTime > 200 || nextDirection !== direction) {
        samples = []; distance = 0;
      }
      previousTime = time; direction = nextDirection;
      const strength = Math.abs(delta);
      samples.push(strength);
      if (samples.length > 70) samples.shift();
      const mean = count => {
        const tail = samples.slice(-count);
        return tail.reduce((sum, value) => sum + value, 0) / tail.length;
      };
      const intentional = strength >= .7 && mean(4) >= mean(16) * .95;
      distance = intentional ? distance + strength : 0;
      return intentional && distance >= 10;
    },
    consume() { distance = 0; }
  };
}
