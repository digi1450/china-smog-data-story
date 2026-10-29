// ES modules and JSON require an HTTP server (VS Code Live Server works).
import('./app.js').then(({boot}) => boot()).catch(error => {
  console.error(error);
  const el = document.getElementById('loadStatus');
  el.hidden = false;
  el.textContent = 'The charts could not load. Open this folder with VS Code Live Server or run npm start. Check that the data/ and assets/ folders are present.';
});
