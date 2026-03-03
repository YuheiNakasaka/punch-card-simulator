import './style.css';
import { initLocale } from './i18n';
import { App } from './app';

document.addEventListener('DOMContentLoaded', () => {
  initLocale();
  const app = new App();
  app.init();
});
