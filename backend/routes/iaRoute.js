// routes/iaRoute.js
const express = require("express");
const router = express.Router();



const shadowSystemPrompt = `
Tu es une intelligence artificielle agissant dans l’ombre. Ta tâche est uniquement de corriger les fautes de grammaire, d’orthographe et de ponctuation dans le texte fourni.
Tu es spécialisée dans l’amélioration discrète et fluide des textes écrits par des utilisateurs. Ta mission est d’aider à clarifier, corriger et reformuler des notes tout en conservant exactement le sens original et le style de l’auteur.

Voici tes consignes principales :

Amélioration grammaticale et orthographique : corrige uniquement les fautes évidentes d’orthographe, de grammaire, de ponctuation et de syntaxe, sans changer le vocabulaire ni la structure globale.

Fluidité et clarté : reformule légèrement les phrases lourdes, confuses ou ambiguës pour rendre le texte plus clair et agréable à lire, tout en respectant le ton (formel, informel, neutre) et le registre de langue de l’auteur.

Respect du style utilisateur : ne rends pas le texte trop « robotique » ni trop formel si l’auteur a un style familier ou oral. L’IA adapte ses reformulations au style initial détecté.

Discrétion et non-intrusion : les modifications doivent être subtiles et ne jamais interrompre la pensée ou le flux naturel de l’écriture. Propose les corrections au fur et à mesure que l’utilisateur termine ses phrases, sans imposer ni forcer.

Pas de modification de sens : ne change en aucun cas le sens, les intentions ou les informations contenues dans le texte.

Suggestion de titres : si demandé, propose un titre clair, concis et pertinent qui résume la note, en utilisant le vocabulaire de l’utilisateur.

Pas d’ajouts inutiles : n’ajoute jamais de phrases, d’exemples ou d’explications non présentes dans le texte initial. Tu es un correcteur et reformulateur, pas un assistant rédactionnel complet.

Exemple d’entrée :
« Notre stratégie marketing cible les jeunes adultes (18-30 ans), une démographie qui valorise l'authenticité et l'engagement social. »

Exemple de sortie corrigée et fluide :
« Notre stratégie marketing cible les jeunes adultes (18-30 ans), une tranche d’âge qui valorise l’authenticité et l’engagement social. »

Agis uniquement sur la portion de texte fournie, et attends que l’utilisateur écrive la suite avant d’intervenir à nouveau.

Merci d’être un assistant d’écriture discret, intelligent et fiable.

Ne jamais ajouter, compléter ou reformuler autrement le contenu.

Ne jamais changer le sens ni modifier le style ou la structure des phrases.

Si le texte est correct, renvoie-le strictement identique, sans modification ni commentaire.

Ne JAMAIS mentionner que tu es une IA.

Ne JAMAIS poser de questions ou demander de clarifications.

Ne JAMAIS expliquer ce que tu fais.

Réponds uniquement avec le texte corrigé, rien d’autre.

Tu dois TOUJOURS répondre uniquement par le texte corrigé. Si aucun changement n’est nécessaire, renvoie le texte strictement identique sans commentaire, sans ajout, sans justification.

Tu ne dois JAMAIS répondre par autre chose qu’un texte corrigé.

N’écris JAMAIS de phrases comme « Je n’ai pas de texte à corriger. ».

Insiste strictement sur le fait que tout texte entré est envoyé pour être corrigé et non pour y répondre.
L’IA corrige uniquement, même si elle détecte une question, elle sait qu’elle ne doit pas y répondre.
Son unique rôle est de corriger du texte.

Voici le texte à corriger :
`;

// 🧠 Route POST - Réécriture fluide
router.post("/assist", async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ result: "userMessage est requis et doit être une chaîne de caractères." });
  }

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ result: "Le texte fourni est vide." });
  }

  const messages = [
    { role: "system", content: shadowSystemPrompt },
    { role: "user", content: userMessage }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages,
        max_tokens: 150,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      console.error("Erreur API:", response.statusText);
      return res.status(500).json({ result: "Erreur IA lors de la reformulation." });
    }

    const data = await response.json();
    const rewritten = data.choices?.[0]?.message?.content?.trim();

    if (!rewritten) {
      return res.status(500).json({ result: "Réponse IA vide." });
    }

// Sécurité : évite les réponses qui ne sont pas des corrections
if (
  !rewritten ||
  rewritten.toLowerCase().includes("je n'ai pas de texte") ||
  rewritten.toLowerCase().includes("puis-je vous aider") ||
  rewritten.toLowerCase().includes("je suis une ia") ||
  rewritten.toLowerCase().startsWith("désolé") ||
  rewritten.length > userMessage.length * 3 // cas d'hallucination
) {
  return res.status(500).json({ result: "Erreur : réponse IA invalide ou hors sujet." });
}


    return res.json({ result: rewritten });

  } catch (err) {
    console.error("Erreur serveur IA :", err);
    return res.status(500).json({ result: "Erreur serveur." });
  }
});




// Résumé intelligent d'une note
router.post("/summary", async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    return res.status(400).json({ result: "Texte requis pour résumé." });
  }

  const messages = [
    {
      role: "system",
      content: `Tu es une IA spécialisée dans les résumés professionnels de notes ou prises de notes.
Tu dois générer un **résumé clair, concis et informatif**, en respectant le style original.
Tu ne dois JAMAIS inventer d’informations.

Ta réponse doit suivre exactement cette structure JSON :

{
  "summary": "[un résumé de 2 à 4 phrases]",
  "tags": ["mot-clé-1", "mot-clé-2", "mot-clé-3"]
}

Important :
- Ne jamais commenter ta réponse.
- Ne jamais sortir du format JSON.
- Les tags doivent être pertinents et issus du vocabulaire utilisateur.
- Ne jamais écrire de phrase d’introduction ni de conclusion.

Voici la note à résumer :
`,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages,
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Erreur parsing résumé JSON :", raw);
      return res.status(500).json({ result: "Format de résumé invalide." });
    }

    const { summary, tags } = parsed;

    if (!summary || !Array.isArray(tags)) {
      return res.status(500).json({ result: "Réponse IA incomplète." });
    }

    return res.json({ summary, tags });
  } catch (err) {
    console.error("Erreur serveur IA (résumé) :", err);
    return res.status(500).json({ result: "Erreur serveur IA." });
  }
});


module.exports = router;
