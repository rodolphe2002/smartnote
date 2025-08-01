

 // Exemple automatique pour BASE_URL
const base_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://smartnote-qsup.onrender.com";

 
 
 
 document.addEventListener("DOMContentLoaded", () => {
  const editor = document.querySelector('.editor-content');

  const translateBtn = document.getElementById('btn-translate');
let correctionLiveActive = false;

translateBtn.addEventListener('click', () => {
  correctionLiveActive = !correctionLiveActive;
  translateBtn.classList.toggle('active', correctionLiveActive);
});

  
  // ... ton code ici ...



  // Utilitaires
  function applyCommand(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus(); // Remet le focus dans l'éditeur après clic
  }

  // Boutons de la toolbar
  document.getElementById('btn-bold').addEventListener('click', () => {
    applyCommand('bold');
  });

  document.getElementById('btn-italic').addEventListener('click', () => {
    applyCommand('italic');
  });

  document.getElementById('btn-underline').addEventListener('click', () => {
    applyCommand('underline');
  });

  document.getElementById('btn-list').addEventListener('click', () => {
    applyCommand('insertUnorderedList');
  });

  document.getElementById('btn-title').addEventListener('click', () => {
    // On applique un titre h2 (équivalent "Titre")
    applyCommand('formatBlock', 'h2');
  });

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
      const paragraphs = Array.from(editor.childNodes).filter(
        node => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "")
      );

      // Trouver le paragraphe précédent (celui "validé")
      const currentParagraphIndex = paragraphs.findIndex(p => document.activeElement === editor && editor.contains(p) && window.getSelection().anchorNode?.parentNode === p);
      const targetIndex = currentParagraphIndex > 0 ? currentParagraphIndex - 1 : paragraphs.length - 2;

      if (targetIndex < 0 || !paragraphs[targetIndex]) return;

      const target = paragraphs[targetIndex];
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
    const paragraphs = Array.from(editor.childNodes).filter(
      node => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "")
    );

    if (paragraphs.length === 0) return;

    const lastParagraph = paragraphs[paragraphs.length - 1];
    const originalText = lastParagraph.innerText?.trim();

    if (!originalText || lastCorrected.get(lastParagraph) === originalText) return;

    try {
      const response = await fetch(`${base_URL}/api/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: originalText })
      });

      const data = await response.json();
      const corrected = data?.result?.trim();

      if (corrected && corrected !== originalText) {
        lastParagraph.innerText = corrected;
        lastCorrected.set(lastParagraph, corrected);

        lastParagraph.classList.add("highlight-corrected");
        setTimeout(() => lastParagraph.classList.remove("highlight-corrected"), 2000);
      }
    } catch (err) {
      console.error("Erreur IA après pause saisie :", err);
    }
  }, 3000);
});


// Fonction utilitaire pour remplacer la sélection par un contenu HTML
function replaceSelectionWithHTML(html) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const el = document.createElement("div");
  el.innerHTML = html;
  const frag = document.createDocumentFragment();
  let node, lastNode;
  while ((node = el.firstChild)) {
    lastNode = frag.appendChild(node);
  }
  range.insertNode(frag);

  // Remet le curseur après la sélection remplacée
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// Gestion du clic sur btn-ai pour corriger la sélection
document.getElementById("btn-ai").addEventListener("click", async () => {
  const sel = window.getSelection();

  if (!sel || sel.isCollapsed || !editor.contains(sel.anchorNode)) {
    alert("Veuillez sélectionner du texte dans l'éditeur pour utiliser l'IA.");
    return;
  }

  const selectedText = sel.toString().trim();
  if (!selectedText) {
    alert("La sélection est vide.");
    return;
  }

  try {
    // Afficher un indicateur de chargement (optionnel)
    document.getElementById("btn-ai").disabled = true; 

    const response = await fetch(`${base_URL}/api/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: selectedText }),
    });

    const data = await response.json();
    const corrected = data?.result?.trim();

    if (corrected && corrected !== selectedText) {
      // Remplacer la sélection par le texte corrigé
      replaceSelectionWithHTML(corrected);

      // Récupérer le noeud qui contient la correction pour animation
      // Ici on récupère le parent commun de la sélection courante (post remplacement)
      let parentNode = window.getSelection().anchorNode.parentElement;

      // Ajout classe animation et suppression après 2s
      parentNode.classList.add("highlight-corrected");
      setTimeout(() => parentNode.classList.remove("highlight-corrected"), 2000);
    } else {
      alert("Le texte sélectionné est déjà correct ou aucune correction apportée.");
    }
  } catch (error) {
    console.error("Erreur IA lors de la correction de la sélection :", error);
    alert("Erreur lors de la correction, veuillez réessayer.");
  } finally {
    document.getElementById("btn-ai").disabled = false;
  }
});






    // Gestion du clic sur btn-full-correct pour corriger tout le contenu
let lastCorrectionBatch = []; // Nouveau : pour stocker temporairement les corrections

document.getElementById("btn-full-correct").addEventListener("click", async () => {
  const paragraphs = Array.from(editor.childNodes).filter(
    node =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "")
  );

  if (paragraphs.length === 0) {
    alert("Aucun contenu à corriger.");
    return;
  }

  const fullBtn = document.getElementById("btn-full-correct");
  fullBtn.classList.add("loading");

  lastCorrectionBatch = []; // Réinitialiser

  for (const p of paragraphs) {
    const originalText = p.innerText.trim();
    if (!originalText || lastCorrected.get(p) === originalText) continue;

    try {
      const response = await fetch(`${base_URL}/api/assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: originalText }),
      });

      const data = await response.json();
      const corrected = data?.result?.trim();

      if (corrected && corrected !== originalText) {
        // Stocker l'élément et les deux versions
        lastCorrectionBatch.push({ element: p, original: originalText, corrected });

        p.innerText = corrected;
        lastCorrected.set(p, corrected);
        p.classList.add("highlight-corrected");
        setTimeout(() => p.classList.remove("highlight-corrected"), 2000);
      }
    } catch (error) {
      console.error("Erreur IA correction complète :", error);
    }
  }

  fullBtn.classList.remove("loading");

  if (lastCorrectionBatch.length > 0) {
    document.querySelector(".ai-bubble").classList.add("visible");
  }
});


  //  Gérer le clic sur "Appliquer les changements

document.querySelector('.ai-suggestion:nth-child(1)').addEventListener('click', () => {
  document.querySelector('.ai-bubble').classList.remove("visible");
  lastCorrectionBatch = []; // Nettoyer la mémoire
});


// Gérer le clic sur "Ton professionnel" (reformulation avec style professionnel)
document.querySelector('.ai-suggestion:nth-child(2)').addEventListener('click', async () => {
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
      }
    } catch (err) {
      console.error("Erreur reformulation professionnelle :", err);
    }
  }

  document.querySelector('.ai-bubble').classList.remove("visible");
  lastCorrectionBatch = [];
});






document.getElementById("toggle-summary").addEventListener("click", async () => {
  const content = document.querySelector(".editor-content").innerText.trim();

  if (!content) {
    alert("Aucune note à résumer.");
    return;
  }

  const btn = document.getElementById("toggle-summary");
  btn.classList.add("loading");

  try {
    const response = await fetch(`${base_URL}/api/summary`, {  
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: content }),
    });

    const data = await response.json();

    if (!data.summary || !Array.isArray(data.tags)) {
      alert("Erreur IA : Résumé non généré.");
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
    alert("Erreur lors de la génération du résumé.");
  } finally {
    btn.classList.remove("loading");
  }
});

// Fermer panneau résumé
document.querySelector(".close-summary").addEventListener("click", () => {
  document.querySelector(".summary-panel").classList.remove("visible");
});




});


