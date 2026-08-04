export default async function handler(req, res) {
    // Suas Chaves
    const telegramToken = '8927164850:AAEnjdEz_ECUsAMjBrU02cbp25H9t_pl0Rk';
    const telegramChatId = '6196724270';
    const apiFootballKey = '00d6ac3905e17e3cb51b87bccc6ab13e';

    try {
        const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
            method: 'GET',
            headers: { 'x-apisports-key': apiFootballKey }
        });
        
        const data = await response.json();
        const jogos = data.response || [];
        let sinaisEnviados = 0;

        for (const jogo of jogos) {
            const tempo = jogo.fixture.status.elapsed;
            const casa = jogo.teams.home.name;
            const visitante = jogo.teams.away.name;
            const golsCasa = jogo.goals.home;
            const golsVisitante = jogo.goals.away;
            const totalGols = golsCasa + golsVisitante;
            const diferencaGols = Math.abs(golsCasa - golsVisitante);
            
            // PADRÃO DE ENTRADA PROFISSIONAL:
            // 1. Tempo de jogo: Entre 70 e 80 minutos
            // 2. Cenário de pressão: Jogo empatado (diferenca 0) ou diferença de apenas 1 gol.
            // 3. O jogo não pode estar 0x0 (jogos 0x0 aos 75 min tendem a ter menos ritmo do que jogos 1x1 ou 1x2)
            if (tempo >= 70 && tempo <= 80 && diferencaGols <= 1 && totalGols >= 1) {
                
                const ambasMarcam = (golsCasa > 0 && golsVisitante > 0) ? "Confirmado ✅" : "Pendente ⏳";
                
                // Formatação do Sinal focado nas métricas principais
                const mensagem = `
🚨 *PADRÃO DE ALTA PRESSÃO DETECTADO* 🚨

⚽ *Partida:* ${casa} x ${visitante}
⏱️ *Tempo:* ${tempo}' minutos
🥅 *Placar:* ${golsCasa} - ${golsVisitante}

📊 *Métricas da Partida:*
• *Total de Gols Atual:* ${totalGols}
• *Ambas Marcam:* ${ambasMarcam}

🎯 *SUGESTÕES DE ENTRADA:*
👉 *Mercado de Gols:* Over ${totalGols + 0.5} (Sair mais 1 gol)
👉 *Mercado de Escanteios:* Fique atento às médias de cantos para buscar o Asiático Final.

⚠️ _Partida com forte tendência de ataque na reta final. Avalie o gráfico antes de confirmar a entrada!_
`;

                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: telegramChatId, text: mensagem, parse_mode: 'Markdown' })
                });
                
                sinaisEnviados++;
            }
        }

        res.status(200).json({ status: "Varredura Concluída", analisados: jogos.length, sinaisEnviados });
    } catch (error) {
        res.status(500).json({ status: "Erro", detalhes: error.message });
    }
}
