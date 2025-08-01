document.addEventListener('DOMContentLoaded', () => {
  // Assure que 'notes' et 'saveNotesToLocalStorage' sont accessibles dans ce scope
  // Si ces variables/fonctions sont définies ailleurs, assure-toi qu'elles sont importées ou globales

  // Applique les événements drag & drop et clics à chaque dossier dans la section dossiers
  document.querySelectorAll('.folders-section .nav-item').forEach(folderItem => {
    const folderName = folderItem.querySelector('.nav-label').textContent;
    folderItem.setAttribute('data-folder', folderName);

    folderItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      folderItem.classList.add('drag-over');
    });

    folderItem.addEventListener('dragleave', () => {
      folderItem.classList.remove('drag-over');
    });

    folderItem.addEventListener('drop', (e) => {
      e.preventDefault();
      folderItem.classList.remove('drag-over');

      // Récupère l'id de la note déplacée
      const noteId = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (isNaN(noteId)) return; // sécurité : ignore si id invalide

                            // Trouve la note correspondante dans la liste globale "notes"
                            const note = notes.find(n => n.id === noteId);
                            if (note) {
                                note.folder = folderName;
                                saveNotesToLocalStorage();
                                showNotesInFolder(folderName);
                            }
    });

    // Au clic sur un dossier, affiche les notes qui lui sont associées
    folderItem.addEventListener('click', () => {
      showNotesInFolder(folderName);
    });
  });

        // Gestion clics sur les dossiers "spéciaux" hors section dossiers
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.addEventListener('click', () => {
            const label = nav.querySelector('.nav-label')?.textContent;
            if (['Travail', 'Études', 'Idées', 'Courses', 'Favoris', 'Archives'].includes(label)) {
                showNotesInFolder(label);
            }
            });
        });
});


 

// Fonction qui affiche les notes du dossier passé en paramètre
function showNotesInFolder(folderName) {
  const mesNotesContainer = document.getElementById('mes-notes-subitems');
  if (!mesNotesContainer) return; // sécurité : container introuvable

  mesNotesContainer.innerHTML = '';

  // Filtre les notes selon le dossier
  const filteredNotes = notes.filter(n => n.folder === folderName);

  // Affiche chaque note filtrée dans la sidebar (fonction à définir dans ton code)
  filteredNotes.forEach(n => renderNoteToSidebar(n));
}
