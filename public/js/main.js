import './theme.js';
import './ai.js';
import './sidebar.js';
import { initNotes } from './notes.js';
import './folders.js';

document.addEventListener('DOMContentLoaded', () => {
  initNotes(); // Initialise la gestion des notes
});
