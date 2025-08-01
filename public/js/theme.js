document.addEventListener('DOMContentLoaded', () => {
      // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
            themeToggle.querySelector('.nav-label').textContent = 'Mode clair';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.querySelector('.nav-label').textContent = 'Mode sombre';
        }
    });

});
