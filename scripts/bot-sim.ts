// Simulador de conversas da BiIA (usa o cérebro real e a base de conhecimento do banco, sem enviar nada a ninguém).
// Uso: npx tsx scripts/bot-sim.ts            (roda os roteiros de exemplo)
//      npx tsx scripts/bot-sim.ts "mensagem 1" "mensagem 2" …   (uma conversa sua)
import { respondTo, newBrainCtx, type BrainIO } from "../src/backend/botBrain.js";

async function chat(title: string, lines: string[]) {
  const ctx = newBrainCtx("Edu Santos");
  const out: string[] = [`\n=== ${title} ===`];
  const io: BrainIO = {
    say: async t => { out.push(`  BiIA: ${t.replace(/\n/g, "\n        ")}`); },
    choose: async (t, o) => { out.push(`  BiIA: ${t}\n        [${o.map(x => `${x.id.toUpperCase()}) ${x.text}`).join("  |  ")}]`); },
    askDoc: async (k, d) => { out.push(`  <<pede CPF/CNPJ para ${k}${d ? ` (já tinha: ${d})` : ""}>>`); },
    support: async (s, subj) => { out.push(`  <<abre suporte (sistema: ${s ?? "?"}) assunto: ${subj.slice(0, 60)}>>`); },
    handoff: async (sec, note) => { out.push(`  <<transfere para ${sec}>> ${note ? `nota: ${note.slice(0, 120)}` : ""}`); },
    menu: async k => { out.push(`  <<mostra o menu (${k ?? "welcome"})>>`); },
    queueStatus: async () => { out.push("  <<informa a posição na fila>>"); },
    goodbye: async () => { out.push("  <<encerra a conversa>>"); },
    note: async t => { out.push(`  <<anota no histórico: ${t}>>`); },
  };
  for (const l of lines) {
    out.push(`CLIENTE: ${l}`);
    const handled = await respondTo(l, ctx, io);
    if (!handled) out.push("  <<fluxo normal do menu>>");
  }
  console.log(out.join("\n"));
}

const custom = process.argv.slice(2);
if (custom.length) await chat("Sua conversa", custom);
else {
  await chat("Quem é você + papo", ["Quem é vc?", "Vc é 1 robô ?", "Pode. Ser minha amiga?", "kkk e vc, tudo bem?", "me chamo Carlos e tenho uma loja de roupas"]);
  await chat("Fatura e pagamento", ["qdo vence minha fatura?", "12345678909", "me manda de novo", "obrigado!"]);
  await chat("Dúvida sobre o sistema e teste", ["o que é o boxsys", "tem nota fiscal?", "quanto custa?", "quero testar", "sou dona de uma padaria", "preciso de controle de estoque"]);
  await chat("Problema e escalada", ["boxsis fora do ar", "ja reiniciei e nada", "isso é um absurdo!!!"]);
  await chat("Contexto e correções", ["quero cancelar", "não, quis dizer outra coisa", "mudando de assunto, qual o horário?", "👍"]);
}
