export default async function handler(req, res) {
    // 1. Suas Chaves do Telegram e API de Futebol
    const telegramToken = '8927164850:AAEnjdEz_ECUsAMjBrU02cbp25H9t_pl0Rk';
    const telegramChatId = '6196724270';
    const apiFootballKey = '00d6ac3905e17e3cb51b87bccc6ab13e';
    
    // 2. Suas Chaves do Banco de Dados (Supabase)
    const supabaseUrl = 'https://hkxgdrjilcqusykzbxvw.supabase.co'; 
    const supabaseKey = 'sb_publishable_RfMmJUVVU4Pg8Dl3jRBG1A_FS0_EnXL';

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
            
            // Link direto e limpo para a Bet365
            const linkBet365 = `https://www.bet365.com/#/Search/exactMatch?q=${encodeURIComponent(casa)}`;

            let tipoSinal = "";
            let sugestao = "";

            if (tempo >= 30 && tempo <= 40 && totalGols === 0) {
                tipoSinal = "PRIMEIRO TEMPO (HT)";
                sugestao = `👉 <b>Gols:</b> Over 0.5 HT<br>👉 <b>Cantos:</b> Buscar Asiático HT`;
            }
            else if (tempo >= 70 && tempo <= 80 && diferencaGols <= 1) {
                tipoSinal = "RETA FINAL (FT)";
                sugestao = `👉 <b>Gols:</b> Over ${totalGols + 0.5} FT<br>👉 <b>Cantos:</b> Limite de cantos no fim`;
            }

            if (tipoSinal !== "") {
                const ambasMarcam = (golsCasa > 0 && golsVisitante > 0) ? "Confirmado ✅" : "Pendente ⏳";
                
                const mensagem = `
🚨 <b>ALERTA: ${tipoSinal}</b> 🚨

🏆 <b>Liga:</b> ${liga}
⚽ <b>Partida:</b> ${casa} x ${visitante}
⏱️ <b>Tempo:</b> ${tempo}' minutos
🥅 <b>Placar:</b> ${golsCasa} - ${golsVisitante}

📊 <b>Métricas:</b>
• Total de Gols Atual: ${totalGols}
• Ambas Marcam: ${ambasMarcam}

🎯 <b>SUGESTÕES:</b>
${sugestao.replace(/<br>/g, '\n')}

🔗 <a href="${linkBet365}">Apostar Agora (Abrir Bet365)</a>
`;

                // Envia para o Telegram
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        chat_id: telegramChatId, 
                        text: mensagem, 
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    })
                });
                
                // Salva no Banco de Dados (Supabase)
                await fetch(`${supabaseUrl}/rest/v1/historico_sinais`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        casa: casa,
                        visitante: visitante,
                        tempo: tempo,
                        placar: `${golsCasa} - ${golsVisitante}`,
                        tipo_sinal: tipoSinal
                    })
                });

                sinaisEnviados++;
            }
        }

        res.status(200).json({ status: "Concluído", analisados: jogos.length, sinaisEnviados });
    } catch (error) {
        res.status(500).json({ status: "Erro", detalhes: error.message });
    }
}
