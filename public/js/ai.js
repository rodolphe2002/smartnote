

 // Base URL alignée sur l'origine courante (évite les incohérences de port)
const base_URL = window.location.origin;

 
 
 
 document.addEventListener("DOMContentLoaded", () => {
  const editor = document.querySelector('.editor-content');

  const translateBtn = document.getElementById('btn-translate');
  let correctionLiveActive = false;

  if (translateBtn) {
    translateBtn.addEventListener('click', () => {
      correctionLiveActive = !correctionLiveActive;
      translateBtn.classList.toggle('active', correctionLiveActive);
    });
  }

  
  // ... ton code ici ...



  // Utilitaires
  function applyCommand(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus(); // Remet le focus dans l'éditeur après clic
  }

  // Déclenche la sauvegarde via le listener 'input' défini dans notes.js
  function saveEditor() {
    if (!editor) return;
    const evt = new Event('input', { bubbles: true });
    editor.dispatchEvent(evt);
  }

  // Boutons de la toolbar
  const btnBold = document.getElementById('btn-bold');
  const btnItalic = document.getElementById('btn-italic');
  const btnUnderline = document.getElementById('btn-underline');
  const btnList = document.getElementById('btn-list');
  const btnTitle = document.getElementById('btn-title');

  if (btnBold) btnBold.addEventListener('click', () => applyCommand('bold'));
  if (btnItalic) btnItalic.addEventListener('click', () => applyCommand('italic'));
  if (btnUnderline) btnUnderline.addEventListener('click', () => applyCommand('underline'));
  if (btnList) btnList.addEventListener('click', () => applyCommand('insertUnorderedList'));
  if (btnTitle) btnTitle.addEventListener('click', () => applyCommand('formatBlock', 'h2'));

  // (btn-ai reste inactif pour l’instant)


// ---------------------------------------------------------------------------------
    // Gestion de l'IA
// ---------------------------------------------------------------------------------


    let debounceTimer;


// Sauvegarde du texte précédent pour éviter des requêtes inutiles
let lastText = editor.innerText.trim();



let lastCorrected = new Map(); // Pour éviter de re-corriger un paragraphe déjà corrigé

editor.addEventListener("keydown", async (e) => {
  // On déclenche la correction seulement à l’appui de Entrée
  if (e.key === "Enter") {
    setTimeout(async () => {
      // Normaliser les noeuds texte directs en blocs pour un ciblage fiable
      const directTextNodes = Array.from(editor.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== "");
      for (const t of directTextNodes) {
        const wrap = document.createElement('div');
        wrap.innerText = t.textContent;
        editor.replaceChild(wrap, t);
      }

      // Récupérer tous les blocs textuels pertinents
      const blocks = Array.from(editor.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre'))
        .filter(el => el.innerText && el.innerText.trim() !== '');

      if (blocks.length === 0) return;

      // Cibler le bloc précédent si le dernier est vide après entrée, sinon le dernier non vide
      let target = null;
      const last = blocks[blocks.length - 1];
      if (blocks.length >= 2 && last.innerText.trim() === '') {
        target = blocks[blocks.length - 2];
      } else {
        target = last;
      }

      if (!target) return;
      const originalText = target.innerText.trim();
      if (!originalText || lastCorrected.get(target) === originalText) return;

      try {
        const response = await fetch(`${base_URL}/api/assist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: originalText })
        });

        const data = await response.json();
        const corrected = data?.result?.trim();

        if (corrected && corrected !== originalText) {
          target.innerText = corrected;
          lastCorrected.set(target, corrected);
          saveEditor();
        }

      } catch (err) {
        console.error("Erreur IA paragraphe :", err);
      }
    }, 10); // Petit délai pour que le DOM insère le nouveau <div>
  }
});


// Correction après pause saisie

editor.addEventListener("input", () => {
  if (!correctionLiveActive) return;

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    // Normaliser les noeuds texte directs
    const directTextNodes = Array.from(editor.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== "");
    for (const t of directTextNodes) {
      const wrap = document.createElement('div');
      wrap.innerText = t.textContent;
      editor.replaceChild(wrap, t);
    }

    // Récupérer les blocs textuels pertinents
    const blocks = Array.from(editor.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre'))
      .filter(el => el.innerText && el.innerText.trim() !== '');

    if (blocks.length === 0) return;

    const lastBlock = blocks[blocks.length - 1];
    const originalText = lastBlock.innerText?.trim();

    if (!originalText || lastCorrected.get(lastBlock) === originalText) return;

    try {
      const response = await fetch(`${base_URL}/api/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: originalText })
      });

      const data = await response.json();
      const corrected = data?.result?.trim();

      if (corrected && corrected !== originalText) {
        lastBlock.innerText = corrected;
        lastCorrected.set(lastBlock, corrected);

        lastBlock.classList.add("highlight-corrected");
        setTimeout(() => lastBlock.classList.remove("highlight-corrected"), 2000);
        saveEditor();
      }
    } catch (err) {
      console.error("Erreur IA après pause saisie :", err);
    }
  }, 3000);
});


// Fonction utilitaire pour remplacer la sélection par du TEXTE (sécurisé)
function replaceSelectionWithText(text) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  // Remet le curseur après le texte inséré
  range.setStartAfter(textNode);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Gestion du clic sur btn-ai pour corriger la sélection
const btnAi = document.getElementById("btn-ai");
btnAi && btnAi.addEventListener("click", async () => {
  const sel = window.getSelection();

  if (!sel || sel.isCollapsed || !editor.contains(sel.anchorNode)) {
    window.showToast && window.showToast("Veuillez sélectionner du texte dans l'éditeur pour utiliser l'IA.", "info");
    return;
  }

  const selectedText = sel.toString().trim();
  if (!selectedText) {
    window.showToast && window.showToast("La sélection est vide.", "info");
    return;
  }

  try {
    // Afficher un indicateur de chargement (optionnel)
    btnAi.disabled = true; 

    const response = await fetch(`${base_URL}/api/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: selectedText }),
    });

    const data = await response.json();
    const corrected = data?.result?.trim();

    if (corrected && corrected !== selectedText) {
      // Remplacer la sélection par du texte corrigé (sécurisé)
      replaceSelectionWithText(corrected);

      // Récupérer le noeud qui contient la correction pour animation
      // Ici on récupère le parent commun de la sélection courante (post remplacement)
      let parentNode = window.getSelection().anchorNode.parentElement;

      // Ajout classe animation et suppression après 2s
      parentNode.classList.add("highlight-corrected");
      setTimeout(() => parentNode.classList.remove("highlight-corrected"), 2000);
      saveEditor();
    } else {
      window.showToast && window.showToast("Le texte sélectionné est déjà correct ou aucune correction apportée.", "info");
    }
  } catch (error) {
    console.error("Erreur IA lors de la correction de la sélection :", error);
    window.showToast && window.showToast("Erreur lors de la correction, veuillez réessayer.", "error");
  } finally {
    btnAi.disabled = false;
  }
});






    // Gestion du clic sur btn-full-correct pour corriger tout le contenu
let lastCorrectionBatch = []; // Nouveau : pour stocker temporairement les corrections

document.getElementById("btn-full-correct").addEventListener("click", async () => {
  // 1) Normaliser: transformer les noeuds texte directs en <div> blocs
  const directTextNodes = Array.from(editor.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== "");
  for (const t of directTextNodes) {
    const wrap = document.createElement('div');
    wrap.innerText = t.textContent;
    editor.replaceChild(wrap, t);
  }

  // 2) Récupérer tous les blocs textuels potentiels (y compris listes et titres)
  const blocks = Array.from(editor.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre'))
    .filter(el => el.innerText && el.innerText.trim() !== '');

  if (blocks.length === 0) {
    window.showToast && window.showToast("Aucun contenu à corriger.", "info");
    return;
  }

  const fullBtn = document.getElementById("btn-full-correct");
  fullBtn.classList.add("loading");
  fullBtn.disabled = true;

  lastCorrectionBatch = []; // Réinitialiser
  let changedCount = 0;

  for (const el of blocks) {
    const originalText = el.innerText.trim();
    if (!originalText || lastCorrected.get(el) === originalText) continue;

    try {
      const response = await fetch(`${base_URL}/api/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: originalText }),
      });

      const data = await response.json();
      const corrected = data?.result?.trim();

      if (corrected && corrected !== originalText) {
        lastCorrectionBatch.push({ element: el, original: originalText, corrected });
        el.innerText = corrected;
        lastCorrected.set(el, corrected);
        el.classList.add("highlight-corrected");
        setTimeout(() => el.classList.remove("highlight-corrected"), 2000);
        saveEditor();
        changedCount++;
      }
    } catch (error) {
      console.error("Erreur IA correction complète :", error);
    }
  }

  fullBtn.classList.remove("loading");
  fullBtn.disabled = false;

  if (changedCount > 0) {
    document.querySelector(".ai-bubble").classList.add("visible");
  } else if (window.showToast) {
    window.showToast("Aucune correction nécessaire.", "info");
  }
});


  //  Gérer le clic sur "Appliquer les changements

const aiBubble = document.querySelector('.ai-bubble');
const aiApplyBtn = document.querySelector('.ai-suggestion:nth-child(1)');
aiApplyBtn && aiApplyBtn.addEventListener('click', () => {
  aiBubble && aiBubble.classList.remove("visible");
  lastCorrectionBatch = []; // Nettoyer la mémoire
});


// Gérer le clic sur "Ton professionnel" (reformulation avec style professionnel)
const aiProBtn = document.querySelector('.ai-suggestion:nth-child(2)');
aiProBtn && aiProBtn.addEventListener('click', async () => {
  for (const { element, corrected } of lastCorrectionBatch) {
    try {
      const response = await fetch(`${base_URL}/api/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: `Reformule ce texte avec un ton professionnel : ${corrected}` }),
      });

      const data = await response.json();
      const proVersion = data?.result?.trim();

      if (proVersion && proVersion !== corrected) {
        element.innerText = proVersion;
        lastCorrected.set(element, proVersion);
        element.classList.add("highlight-corrected");
        setTimeout(() => element.classList.remove("highlight-corrected"), 2000);
        saveEditor();
      }
    } catch (err) {
      console.error("Erreur reformulation professionnelle :", err);
    }
  }

  aiBubble && aiBubble.classList.remove("visible");
  lastCorrectionBatch = [];
});






const toggleSummaryBtn = document.getElementById("toggle-summary");
toggleSummaryBtn && toggleSummaryBtn.addEventListener("click", async () => {
  const content = document.querySelector(".editor-content").innerText.trim();

  if (!content) {
    // Afficher un message dans le panneau de résumé au lieu d'une alerte
    const panel = document.querySelector(".summary-panel");
    const textEl = document.querySelector(".summary-text");
    const tagContainer = document.querySelector(".tags-container");
    if (panel && textEl && tagContainer) {
      panel.classList.add("visible");
      textEl.innerText = "Aucune note à résumer. Écrivez du contenu dans l'éditeur pour générer un résumé.";
      tagContainer.innerHTML = "";
    }
    return;
  }

  const btn = toggleSummaryBtn;
  btn.classList.add("loading");

  try {
    const response = await fetch(`${base_URL}/api/summary`, {  
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: content }),
    });

    const data = await response.json();

    if (!data.summary || !Array.isArray(data.tags)) {
      window.showToast && window.showToast("Erreur IA : Résumé non généré.", "error");
      return;
    }

    // Affichage dans .summary-panel
    document.querySelector(".summary-panel").classList.add("visible");
    document.querySelector(".summary-text").innerText = data.summary;

    const tagContainer = document.querySelector(".tags-container");
    tagContainer.innerHTML = "";
    data.tags.forEach((tag) => {
      const div = document.createElement("div");
      div.className = "tag";
      div.innerText = tag;
      tagContainer.appendChild(div);
    });

  } catch (err) {
    console.error("Erreur IA résumé :", err);
    window.showToast && window.showToast("Erreur lors de la génération du résumé.", "error");
  } finally {
    btn.classList.remove("loading");
  }
});

// Fermer panneau résumé
document.querySelector(".close-summary").addEventListener("click", () => {
  document.querySelector(".summary-panel").classList.remove("visible");
});




});


