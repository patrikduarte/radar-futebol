export default async function handler(req, res) {
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
            const liga = jogo.league.name;
            
            // Cria um link inteligente de busca na Bet365 com o nome do time mandante
            const linkBet365 = `https://www.bet365.com/#/Search/exactMatch?q=${encodeURIComponent(casa)}`;

            let tipoSinal = "";
            let sugestao = "";

            // 1. PADRÃO PRIMEIRO TEMPO (HT) - Pressão entre 30 e 40 minutos com placar zerado
            if (tempo >= 30 && tempo <= 40 && totalGols === 0) {
                tipoSinal = "PRIMEIRO TEMPO (HT)";
                sugestao = `👉 *Gols:* Over 0.5 HT (Sair 1 gol antes do intervalo)\n👉 *Cantos:* Fique de olho no volume ofensivo para buscar o Asiático HT.`;
            }
            // 2. PADRÃO SEGUNDO TEMPO (FT) - Pressão final entre 70 e 80 minutos
            else if (tempo >= 70 && tempo <= 80 && diferencaGols <= 1) {
                tipoSinal = "RETA FINAL (FT)";
                sugestao = `👉 *Gols:* Over ${totalGols + 0.5} FT (Sair mais 1 gol)\n👉 *Cantos:* Ideal para buscar limite de cantos no fim do jogo.`;
            }

            // Se o jogo se encaixar em algum dos padrões, envia o alerta!
            if (tipoSinal !== "") {
                const ambasMarcam = (golsCasa > 0 && golsVisitante > 0) ? "Confirmado ✅" : "Pendente ⏳";
                
                const mensagem = `
🚨 *ALERTA: ${tipoSinal}* 🚨

🏆 *Liga:* ${liga}
⚽ *Partida:* ${casa} x ${visitante}
⏱️ *Tempo:* ${tempo}' minutos
🥅 *Placar:* ${golsCasa} - ${golsVisitante}

📊 *Métricas da Partida:*
• *Total de Gols Atual:* ${totalGols}
• *Ambas Marcam:* ${ambasMarcam}

🎯 *SUGESTÕES DE ENTRADA:*
${sugestao}

🔗 *Apostar Agora (Bet365):*
[Clique aqui para abrir o jogo na Bet365](${linkBet365})
`;

                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        chat_id: telegramChatId, 
                        text: mensagem, 
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true // Evita que o Telegram crie um quadro gigante com a imagem do site
                    })
                });
                
                sinaisEnviados++;
            }
        }

        res.status(200).json({ status: "Varredura Concluída", analisados: jogos.length, sinaisEnviados });
    } catch (error) {
        res.status(500).json({ status: "Erro", detalhes: error.message });
    }
}
