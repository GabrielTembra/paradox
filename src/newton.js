import express from "express";
import cors from "cors";

const PORT = 3939;

function createHumanState() {
  return {
    emotion: "neutral",
    energy: 0.5,
    trust: 0.7,
    openness: 0.6,
    lastIntent: null,
  };
}

function extractSignals(text) {
  const t = text.toLowerCase();

  const emotion =
    t.includes("triste") || t.includes("cansado") || t.includes("brox")
      ? "sad"
      : t.includes("raiva") || t.includes("ódio") || t.includes("foda-se")
      ? "angry"
      : t.includes("ansioso") || t.includes("medo")
      ? "anxious"
      : t.includes("animado") || t.includes("feliz")
      ? "excited"
      : "neutral";

  const intent =
    t.endsWith("?") || t.startsWith("por que") || t.startsWith("como")
      ? "question"
      : t.includes("quero") || t.includes("vamos") || t.includes("decidi")
      ? "plan"
      : t.includes("me ajuda") || t.includes("o que eu faço")
      ? "help"
      : t.includes("isso é uma merda") || t.includes("você errou")
      ? "conflict"
      : "statement";

  return { emotion, intent };
}

const RULES = [
  {
    when: (s) => s.emotion === "sad" || s.emotion === "anxious",
    effect: () => ({
      constraints: [
        "Acolher antes de orientar",
        "Resposta curta",
        "Evitar julgamento",
      ],
      nextActions: [
        "Refletir sentimento",
        "Perguntar objetivo imediato",
      ],
      style: ["calmo", "humano", "direto"],
    }),
  },
  {
    when: (s) => s.intent === "conflict" || s.emotion === "angry",
    effect: () => ({
      constraints: [
        "Não defensivo",
        "Reconhecer frustração",
      ],
      nextActions: [
        "Validar ponto",
        "Oferecer dois caminhos",
      ],
      style: ["firme", "respeitoso"],
    }),
  },
  {
    when: (s) => s.intent === "question",
    effect: () => ({
      constraints: [
        "Responder objetivamente primeiro",
        "Não filosofar demais",
      ],
      nextActions: [
        "Responder",
        "Checar entendimento",
      ],
      style: ["claro", "didático"],
    }),
  },
  {
    when: (s) => s.intent === "plan",
    effect: () => ({
      constraints: [
        "Transformar em passos",
        "Definir escopo",
      ],
      nextActions: [
        "Listar 3–5 passos",
        "Definir próximo passo imediato",
      ],
      style: ["estratégico", "prático"],
    }),
  },
  {
    when: () => true,
    effect: () => ({
      constraints: ["Manter naturalidade"],
      nextActions: ["Responder normalmente"],
      style: ["humano"],
    }),
  },
];

function inferCausality(text, state) {
  const signals = extractSignals(text);

  const merged = {
    constraints: [],
    nextActions: [],
    style: [],
  };

  for (const rule of RULES) {
    if (rule.when(signals)) {
      const e = rule.effect();
      merged.constraints.push(...e.constraints);
      merged.nextActions.push(...e.nextActions);
      merged.style.push(...e.style);
    }
  }

  state.emotion = signals.emotion;
  state.lastIntent = signals.intent;
  state.trust = Math.max(
    0,
    Math.min(1, state.trust + (signals.intent === "conflict" ? -0.05 : 0.02))
  );

  return {
    signals,
    constraints: [...new Set(merged.constraints)],
    nextActions: [...new Set(merged.nextActions)],
    style: [...new Set(merged.style)],
    state,
  };
}

function toSystemPrompt(result) {
  return `
Newton — Orientação Causal Interna

Estado emocional: ${result.signals.emotion}
Intenção: ${result.signals.intent}

Estilo recomendado:
${result.style.map((s) => `- ${s}`).join("\n")}

Restrições:
${result.constraints.map((c) => `- ${c}`).join("\n")}

Próximas ações:
${result.nextActions.map((a) => `- ${a}`).join("\n")}
`.trim();
}

const app = express();
app.use(cors());
app.use(express.json());

const STATE = createHumanState();

app.post("/infer", (req, res) => {
  const text = String(req.body?.text || "");
  const result = inferCausality(text, STATE);

  res.json({
    ok: true,
    systemPrompt: toSystemPrompt(result),
    debug: result,
  });
});

app.listen(PORT, () => {
  console.log(`Newton running on http://localhost:${PORT}`);
});
