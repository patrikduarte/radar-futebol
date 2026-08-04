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
            
            // Regra: Jogo entre 70 e 74 minutos e com 1 a 3 gols na partida
            if (tempo >= 70 && tempo <= 74 && totalGols >= 1 && totalGols <= 3) {
                const ambasMarcam = (golsCasa > 0 && golsVisitante > 0) ? "Sim" : "Ainda não";
                const mensagem = `🚨 *ALERTA DE GOLS / AMBAS MARCAM* 🚨\n\n⚽ *${casa} x ${visitante}*\n⏱️ *Tempo:* ${tempo} minutos\n🥅 *Placar:* ${golsCasa} - ${golsVisitante}\n\n📊 *Total de Gols Atual:* ${totalGols}\n🎯 *Ambas Marcam:* ${ambasMarcam}\n\n⚠️ _Cenário de alta pressão, fique de olho no próximo gol!_`;

                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: telegramChatId, text: mensagem, parse_mode: 'Markdown' })
                });
                
                sinaisEnviados++;
            }
        }

        res.status(200).json({ status: "Sucesso", analisados: jogos.length, sinaisEnviados });
    } catch (error) {
        res.status(500).json({ status: "Erro", detalhes: error.message });
    }
}