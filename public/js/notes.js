// notes.js - Gestion des notes

const moveModal = document.getElementById('move-modal');
const folderSelect = document.getElementById('folder-select');
const confirmMoveBtn = document.getElementById('confirm-move');
const cancelMoveBtn = document.getElementById('cancel-move');
let noteToMove = null;


const notesList = document.querySelector('.sidebar .sidebar-nav');
const newNoteBtn = document.querySelector('.new-note-btn');
const noteTitleInput = document.querySelector('.note-title');
const editorContent = document.querySelector('.editor-content');

let notes = JSON.parse(localStorage.getItem('notes')) || [];
let noteIdCounter = notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1;
let noteCount = notes.length;
let currentNoteElement = null;
let currentSearchQuery = '';

// Utilitaires pour la recherche
function normalize(str = '') {
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .trim();
}

function htmlToText(html = '') {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerText || '';
}

function saveNotesToLocalStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function updateFolderCount(folderName, count) {
  // Met à jour le compteur affiché dans la sidebar pour un dossier donné
  const folders = document.querySelectorAll('.folders-section .nav-item');
  folders.forEach(folder => {
    const label = folder.querySelector('.nav-label');
    const countElem = folder.querySelector('.nav-count');
    if (label && label.textContent.trim() === folderName) {
      if (countElem) {
        countElem.textContent = count;
      } else if (count > 0) {
        const span = document.createElement('span');
        span.classList.add('nav-count');
        span.textContent = count;
        folder.appendChild(span);
      }
    }
  });



  


  

  // Gestion compteur "Mes Notes" (notes sans dossier)
  if (folderName === null) {
    const mesNotesCount = document.getElementById('mes-notes-count');
    if (mesNotesCount) mesNotesCount.textContent = count;
  }

  // Tu peux étendre ici pour Favoris, Archives si besoin
  if (folderName === 'Favoris') {
  const favorisCount = document.getElementById('favoris-count');
  if (favorisCount) favorisCount.textContent = count;
}
if (folderName === 'Archives') {
  const archivesCount = document.getElementById('archives-count');
  if (archivesCount) archivesCount.textContent = count;
}

}

function clearContainer(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

function createSidebarNote(title = `Nouvelle note ${noteCount}`, id = noteIdCounter++) {
  const noteItem = document.createElement('div');
  noteItem.classList.add('nav-item');
  noteItem.dataset.id = id;

  noteItem.innerHTML = `
    <i class="fas fa-file-alt"></i>
    <span class="nav-label">${title}</span>
    <div class="note-options">
      <button class="options-btn"><i class="fas fa-ellipsis-h"></i></button>
      <div class="options-menu hidden">
        <div class="option" data-action="deplacer">Déplacer</div>
        <div class="option" data-action="favoris">Favoris</div>
        <div class="option" data-action="archiver">Archiver</div>
        <div class="option" data-action="supprimer">Supprimer</div>
      </div>
    </div>
  `;

  // Clic sur la note pour la sélectionner et afficher son contenu
  noteItem.addEventListener('click', () => {
    document.querySelectorAll('.nav-subitems .nav-item').forEach(n => n.classList.remove('active'));
    noteItem.classList.add('active');
    currentNoteElement = noteItem;

    const noteId = parseInt(noteItem.dataset.id);
    setActiveNote(noteId);
  });

  // Gestion du menu options
  const optionsBtn = noteItem.querySelector('.options-btn');
  const optionsMenu = noteItem.querySelector('.options-menu');

  optionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.options-menu.visible').forEach(m => {
      if (m !== optionsMenu) m.classList.remove('visible');
    });
    optionsMenu.classList.toggle('visible');
  });


  // Actions dans le menu options
 // Actions dans le menu options 
optionsMenu.querySelectorAll('.option').forEach(option => {
  option.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const noteId = parseInt(noteItem.dataset.id);
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (action === 'supprimer') {
      notes = notes.filter(n => n.id !== noteId);
      saveNotesToLocalStorage();
      renderAllNotes();
    } else if (action === 'deplacer') {
      // Ouvre la modale de déplacement
      noteToMove = note; // noteToMove est une variable globale
      moveModal.classList.remove('hidden');
    } else if (action === 'favoris') {
      note.folder = 'Favoris';
      saveNotesToLocalStorage();
      renderAllNotes();
    } else if (action === 'archiver') {
      note.folder = 'Archives';
      saveNotesToLocalStorage();
      renderAllNotes();
    }
  });
});




  // Drag & Drop (optionnel)
  noteItem.setAttribute('draggable', true);
  noteItem.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', noteItem.dataset.id);
  });

  // Touch longue pression pour déplacement
  let touchStartTime = 0;
  noteItem.addEventListener('touchstart', () => {
    touchStartTime = Date.now();
  });
  noteItem.addEventListener('touchend', () => {
    const duration = Date.now() - touchStartTime;
    if (duration > 500) {
      const folderName = prompt("Dans quel dossier déplacer cette note ?");
      const noteId = parseInt(noteItem.dataset.id);
      const note = notes.find(n => n.id === noteId);
      if (note && folderName) {
        note.folder = folderName;
        saveNotesToLocalStorage();
        window.showToast && window.showToast(`Note déplacée dans "${folderName}"`, "success");
        renderAllNotes();
      }
    }
  });

  return noteItem;
}

// Gestion de la modale de déplacement (bind une seule fois au niveau global)
confirmMoveBtn.addEventListener('click', () => {
  if (noteToMove) {
    noteToMove.folder = folderSelect.value;
    saveNotesToLocalStorage();
    renderAllNotes();
  }
  moveModal.classList.add('hidden');
  noteToMove = null;
});

cancelMoveBtn.addEventListener('click', () => {
  moveModal.classList.add('hidden');
  noteToMove = null;
});

function createNewNoteFromUI() {
  noteCount++;
  const defaultTitle = `Nouvelle note ${noteCount}`;
  noteTitleInput.value = defaultTitle;
  editorContent.innerHTML = `<p></p>`;

  const newNote = {
    id: noteIdCounter++,
    title: defaultTitle,
    content: `<p></p>`,
    folder: null
  };
  notes.unshift(newNote);
  saveNotesToLocalStorage();

  renderAllNotes();

  // Sélectionne la nouvelle note créée
  setActiveNote(newNote.id);
}

function setActiveNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  currentNoteElement = document.querySelector(`.nav-item[data-id="${id}"]`);
  document.querySelectorAll('.nav-subitems .nav-item').forEach(n => n.classList.remove('active'));
  if (currentNoteElement) currentNoteElement.classList.add('active');

  noteTitleInput.value = note.title;
  editorContent.innerHTML = note.content || '<p></p>';

  noteTitleInput.oninput = () => {
    note.title = noteTitleInput.value.trim() || 'Sans titre';
    if (currentNoteElement) {
      currentNoteElement.querySelector('.nav-label').textContent = note.title;
    }
    saveNotesToLocalStorage();
  };

  editorContent.oninput = () => {
    note.content = editorContent.innerHTML;
    saveNotesToLocalStorage();
  };
  localStorage.setItem('lastOpenedNoteId', id);

}

function renderAllNotes() {
  // Vider container Mes Notes
  clearContainer('mes-notes-subitems');

  // Notes sans dossier affichées dans "Mes Notes"
  const mesNotesContainer = document.getElementById('mes-notes-subitems');
  const q = normalize(currentSearchQuery);
  const mesNotes = notes.filter(n => !n.folder).filter(n => {
    if (!q) return true;
    const inTitle = normalize(n.title).includes(q);
    const inContent = normalize(htmlToText(n.content || '')).includes(q);
    return inTitle || inContent;
  });
  mesNotes.forEach(note => {
    const noteElem = createSidebarNote(note.title, note.id);
    mesNotesContainer.appendChild(noteElem);
  });
  updateFolderCount(null, mesNotes.length);

  // Rendre "Mes Notes" droppable (pour enlever une note d'un dossier)
  attachDropHandlers(null, [
    mesNotesContainer,
    // Item de navigation "Mes Notes" si présent
    Array.from(document.querySelectorAll('.sidebar .nav-item')).find(el => el.querySelector('.nav-label')?.textContent?.trim() === 'Mes Notes')
  ].filter(Boolean));

  // Liste des dossiers
  const folders = ['Travail', 'Études', 'Idées', 'Courses', 'Favoris', 'Archives'];

  folders.forEach(folderName => {
    // Id container spécifique dossier (par ex. travail-subitems)
    let folderContainer = document.getElementById(folderName.toLowerCase() + '-subitems');

    // Si pas présent, on le crée dynamiquement sous le dossier correspondant
    if (!folderContainer) {
      folderContainer = document.createElement('div');
      folderContainer.id = folderName.toLowerCase() + '-subitems';
      folderContainer.classList.add('nav-subitems');

      // Trouver l'élément dossier dans la sidebar
      const folderNavItem = Array.from(document.querySelectorAll('.folders-section .nav-item'))
        .find(el => el.querySelector('.nav-label').textContent.trim() === folderName);

      if (folderNavItem) folderNavItem.after(folderContainer);
    } else {
      folderContainer.innerHTML = '';
    }

    // Notes dans ce dossier
    const notesInFolder = notes.filter(n => n.folder === folderName).filter(n => {
      if (!q) return true;
      const inTitle = normalize(n.title).includes(q);
      const inContent = normalize(htmlToText(n.content || '')).includes(q);
      return inTitle || inContent;
    });
    notesInFolder.forEach(note => {
      const noteElem = createSidebarNote(note.title, note.id);
      folderContainer.appendChild(noteElem);
    });

    updateFolderCount(folderName, notesInFolder.length);

    // Activer le drop sur le conteneur et l'item de navigation du dossier
    const folderNavItem = Array.from(document.querySelectorAll('.folders-section .nav-item'))
      .find(el => el.querySelector('.nav-label')?.textContent?.trim() === folderName);
    attachDropHandlers(folderName, [folderContainer, folderNavItem].filter(Boolean));
  });
}

// Attache les handlers de dragover/drop à une liste de zones pour déplacer une note vers targetFolderName
function attachDropHandlers(targetFolderName, zones) {
  zones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault(); // Autorise le drop
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const idStr = e.dataTransfer.getData('text/plain');
      const noteId = parseInt(idStr, 10);
      if (!Number.isFinite(noteId)) return;
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
      // Éviter de re-render si pas de changement de dossier
      const newFolder = targetFolderName || null;
      if ((note.folder || null) === newFolder) return;
      note.folder = newFolder;
      saveNotesToLocalStorage();
      renderAllNotes();
    });
  });
}

function loadNotesFromStorage() {
  renderAllNotes();
  const lastNoteId = parseInt(localStorage.getItem('lastOpenedNoteId'));
  const noteToOpen = notes.find(n => n.id === lastNoteId) || notes[0];
  if (noteToOpen) setActiveNote(noteToOpen.id);
}


// Événement bouton création
newNoteBtn.addEventListener('click', () => {
  createNewNoteFromUI();
});




// Chargement au démarrage
loadNotesFromStorage();



// Recherche: écouteur input + touche Entrée
const searchInput = document.querySelector('.search-bar');
if (searchInput) {
  const applySearch = () => {
    currentSearchQuery = searchInput.value || '';
    renderAllNotes();
  };

  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applySearch, 150);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySearch();
    }
  });
}

const globalOptionsBtn = document.getElementById('global-options-btn');
const globalOptionsMenu = document.querySelector('.global-options-menu');

globalOptionsBtn.addEventListener('click', (e) => {
  e.stopPropagation();

  // Ferme les autres menus visibles
  document.querySelectorAll('.options-menu.visible').forEach(menu => {
    if (menu !== globalOptionsMenu) {
      menu.classList.remove('visible');
      menu.classList.add('hidden');
    }
  });

  // Affiche ou cache le menu global
  const willShow = !globalOptionsMenu.classList.contains('visible');
  globalOptionsMenu.classList.toggle('visible');
  if (willShow) {
    globalOptionsMenu.classList.remove('hidden');
  } else {
    globalOptionsMenu.classList.add('hidden');
  }

  // Positionnement via CSS (top:100%; right:0) relatif à .note-actions
  globalOptionsMenu.style.top = '';
  globalOptionsMenu.style.left = '';
  globalOptionsMenu.style.position = '';
});

document.addEventListener('click', () => {
  globalOptionsMenu.classList.remove('visible');
  globalOptionsMenu.classList.add('hidden');
  // Fermer aussi tous les menus d'options de notes ouverts
  document.querySelectorAll('.options-menu.visible').forEach(menu => {
    menu.classList.remove('visible');
    menu.classList.add('hidden');
  });
});

// Actions du menu global
// Actions du menu global
globalOptionsMenu.querySelectorAll('.option').forEach(option => {
  option.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const noteId = parseInt(currentNoteElement?.dataset?.id);
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (action === 'supprimer') {
      notes = notes.filter(n => n.id !== noteId);
      saveNotesToLocalStorage();
      renderAllNotes();
    } else if (action === 'deplacer') {
      noteToMove = note; // Défini la note à déplacer
      folderSelect.value = note.folder || 'Travail'; // Pré-remplir si possible
      moveModal.classList.remove('hidden'); // Affiche le modal de déplacement
      return; // Ne pas fermer tout de suite, attendre la confirmation
    } else if (action === 'favoris') {
      note.folder = 'Favoris';
      saveNotesToLocalStorage();
      renderAllNotes();
    } else if (action === 'archiver') {
      note.folder = 'Archives';
      saveNotesToLocalStorage();
      renderAllNotes();
    }

    globalOptionsMenu.classList.remove('visible');
  });
});

