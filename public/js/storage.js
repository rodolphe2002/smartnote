export function saveNotes(notes) {
    localStorage.setItem('notes', JSON.stringify(notes));
}

export function loadNotes() {
    return JSON.parse(localStorage.getItem('notes')) || [];
}
