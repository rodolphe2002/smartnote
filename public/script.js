document.addEventListener('DOMContentLoaded', () => {
    // === Theme Toggle ===
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        const label = themeToggle.querySelector('.nav-label');

        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
            label.textContent = 'Mode clair';
        } else {
            icon.className = 'fas fa-moon';
            label.textContent = 'Mode sombre';
        }
    });

  

    // === Toggle Summary Panel ===
    const toggleSummary = document.getElementById('toggle-summary');
    const summaryPanel = document.querySelector('.summary-panel');
    const closeSummary = document.querySelector('.close-summary');

    if (toggleSummary && summaryPanel && closeSummary) {
        toggleSummary.addEventListener('click', () => {
            summaryPanel.classList.toggle('visible');
        });

        closeSummary.addEventListener('click', () => {
            summaryPanel.classList.remove('visible');
        });
    }

    // === Responsive Sidebar Toggle ===
    // === Responsive Sidebar Toggle ===
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');

if (menuToggle && sidebar) {
    // Toggle menu when clicking the toggle button
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Empêche la propagation pour éviter que le document clique le referme
        sidebar.classList.toggle('visible');
    });

    // Stop propagation when clicking inside the sidebar
    sidebar.addEventListener('click', (e) => {
        e.stopPropagation(); // Clique à l'intérieur du menu ne le ferme pas
    });

    // Close menu when clicking anywhere else
    document.addEventListener('click', () => {
        sidebar.classList.remove('visible');
    });
}


    // === Animate Editor Text (Simulated AI Correction) ===
    const editorContent = document.querySelector('.editor-content');

    if (editorContent) {
        const originalText = editorContent.innerHTML;

        setTimeout(() => {
            // You can replace this with corrected content later
            editorContent.innerHTML = originalText || "<p>Aucun contenu à corriger.</p>";

            const paragraphs = editorContent.querySelectorAll('p, li');
            paragraphs.forEach((p, index) => {
                p.style.opacity = 0;
                p.style.transform = 'translateY(10px)';

                setTimeout(() => {
                    p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    p.style.opacity = 1;
                    p.style.transform = 'translateY(0)';
                }, 100 + index * 100);
            });
        }, 2000);
    }

    // === Micro-interactions on Buttons ===
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });

        const resetTransform = () => {
            button.style.transform = '';
        };

        button.addEventListener('mouseup', resetTransform);
        button.addEventListener('mouseleave', resetTransform);
    });
});
