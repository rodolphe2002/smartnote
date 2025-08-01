document.addEventListener('DOMContentLoaded', () => {
    const toggleSummary = document.getElementById('toggle-summary');
    const summaryPanel = document.querySelector('.summary-panel');
    const closeSummary = document.querySelector('.close-summary');
    toggleSummary?.addEventListener('click', () => summaryPanel?.classList.toggle('hidden'));
    closeSummary?.addEventListener('click', () => summaryPanel?.classList.remove('hidden'));

    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    menuToggle?.addEventListener('click', () => sidebar?.classList.toggle('hidden'));
});
