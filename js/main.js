// Load the application and report initialization failures.
import('./app.js?v=20261030-3').then(({boot}) => boot()).catch(error => {
  console.error(error);
  const el = document.getElementById('loadStatus');
  el.hidden = false;
  el.textContent = 'The charts could not load. Refresh the page or try again later.';
});
