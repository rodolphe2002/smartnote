document.addEventListener('DOMContentLoaded', () => {
    // === Toast helper ===
    const ensureToastContainer = () => {
        let c = document.querySelector('.toast-container');
        if (!c) {
            c = document.createElement('div');
            c.className = 'toast-container';
            document.body.appendChild(c);
        }
        return c;
    };

    window.showToast = (message, type = 'info', timeout = 2800) => {
        const container = ensureToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-exclamation' : 'fa-info-circle';
        toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;
        container.appendChild(toast);
        // auto remove
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.25s ease forwards';
            setTimeout(() => toast.remove(), 260);
        }, timeout);
    };

    // === Theme Toggle ===
    const themeToggle = document.getElementById('theme-toggle');
    const THEME_KEY = 'smartnote_theme'; // 'dark' | 'light'

    const applyThemeUI = (isDark) => {
        const icon = themeToggle?.querySelector('i');
        const label = themeToggle?.querySelector('.nav-label');
        if (!icon || !label) return;
        if (isDark) {
            icon.className = 'fas fa-sun';
            label.textContent = 'Mode clair';
        } else {
            icon.className = 'fas fa-moon';
            label.textContent = 'Mode sombre';
        }
    };

    // Init from localStorage
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    }
    // If no saved theme, keep default (light) as in CSS; update UI accordingly
    applyThemeUI(document.body.classList.contains('dark-mode'));

    // Toggle + persist
    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        applyThemeUI(isDark);
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
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Forcer la visibilité du bouton hamburger via style inline selon la largeur
    const updateMenuToggleVisibility = () => {
        if (!menuToggle) return;
        if (window.innerWidth >= 769) {
            menuToggle.style.display = 'none';
        } else {
            menuToggle.style.display = 'block';
        }
    };

    updateMenuToggleVisibility();
    window.addEventListener('resize', updateMenuToggleVisibility);

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

    // === PWA: Service Worker + Install Flow ===
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').then(() => {
            // SW registered
        }).catch((err) => {
            console.warn('Service Worker registration failed:', err);
        });
    }

    // Handle install prompt
    let deferredPrompt = null;
    const installBtn = document.getElementById('install-app-btn');
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar on mobile
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'inline-flex';
        window.showToast && window.showToast('Vous pouvez installer SmartNote.', 'info');
    });

    installBtn?.addEventListener('click', async () => {
        // iOS: no beforeinstallprompt, show instructions
        if (isIos && !isStandalone) {
            window.showToast && window.showToast("Sur iPhone: appuyez sur le bouton Partager, puis 'Ajouter à l’écran d’accueil'.", 'info', 6000);
            return;
        }
        if (!deferredPrompt) {
            window.showToast && window.showToast("Installation non disponible pour le moment.", 'info');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            window.showToast && window.showToast('Installation en cours...', 'success');
        } else {
            window.showToast && window.showToast("Installation annulée.", 'info');
        }
        deferredPrompt = null;
        if (installBtn) installBtn.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
        window.showToast && window.showToast('SmartNote installé !', 'success');
        if (installBtn) installBtn.style.display = 'none';
    });

    // iOS: show the button proactively when not standalone
    if (isIos && !isStandalone && installBtn) {
        installBtn.style.display = 'inline-flex';
    }

    // iOS: generate and inject a 180x180 PNG apple-touch-icon from our SVG to keep the exact same icon
    (async function ensureAppleTouchIcon() {
        if (!isIos) return;
        // If an apple-touch-icon already exists, keep it
        const existing = document.querySelector('link[rel~="apple-touch-icon"]');
        if (existing) return;
        try {
            const svgUrl = '/icons/icon-512.svg';
            const res = await fetch(svgUrl, { credentials: 'same-origin' });
            if (!res.ok) return;
            const svgText = await res.text();
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                try {
                    const size = 180;
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, size, size);
                    // draw SVG scaled to fit
                    const scale = Math.min(size / img.width, size / img.height);
                    const dw = img.width * scale;
                    const dh = img.height * scale;
                    const dx = (size - dw) / 2;
                    const dy = (size - dh) / 2;
                    ctx.drawImage(img, dx, dy, dw, dh);
                    const dataUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('link');
                    link.rel = 'apple-touch-icon';
                    link.sizes = '180x180';
                    link.href = dataUrl;
                    document.head.appendChild(link);

                    // also set precomposed to prevent gloss effects on older iOS
                    const link2 = document.createElement('link');
                    link2.rel = 'apple-touch-icon-precomposed';
                    link2.sizes = '180x180';
                    link2.href = dataUrl;
                    document.head.appendChild(link2);
                } finally {
                    URL.revokeObjectURL(url);
                }
            };
            img.onerror = () => URL.revokeObjectURL(url);
            img.src = url;
        } catch (e) {
            // silent fail; iOS will use fallback meta if present
        }
    })();
});
