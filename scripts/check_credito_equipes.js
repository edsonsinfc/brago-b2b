const mysql = require('mysql2/promise');

async function verificarCreditoEquipes() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nexus_b2b'
    });

    try {
        console.log('='.repeat(80));
        console.log('VERIFICANDO CRÉDITO DAS EQUIPES');
        console.log('='.repeat(80));
        
        // Buscar todas as equipes
        const [equipes] = await pool.query(`
            SELECT 
                id,
                nome,
                limite_credito,
                limite_disponivel,
                saldo_atual
            FROM equipes
            ORDER BY nome
        `);
        
        console.log(`\nTotal de equipes: ${equipes.length}\n`);
        
        for (const equipe of equipes) {
            const utilizado = equipe.limite_credito - equipe.limite_disponivel;
            const percentual = equipe.limite_credito > 0 ? (utilizado / equipe.limite_credito * 100) : 0;
            
            console.log(`Equipe: ${equipe.nome} (ID: ${equipe.id})`);
            console.log(`  Limite Total: R$ ${Number(equipe.limite_credito).toFixed(2)}`);
            console.log(`  Limite Disponível: R$ ${Number(equipe.limite_disponivel).toFixed(2)}`);
            console.log(`  Saldo Atual: R$ ${Number(equipe.saldo_atual).toFixed(2)}`);
            console.log(`  Utilizado: R$ ${utilizado.toFixed(2)} (${percentual.toFixed(0)}%)`);
            
            // Verificar pedidos aprovados desta equipe
            const [pedidos] = await pool.query(`
                SELECT COUNT(*) as total, SUM(valor_total) as soma
                FROM pedidos
                WHERE equipe_id = ? AND status IN ('APROVADO', 'EM_SEPARACAO', 'EM_TRANSPORTE', 'SAIU_ENTREGA')
            `, [equipe.id]);
            
            console.log(`  Pedidos ativos: ${pedidos[0].total} (Total: R$ ${Number(pedidos[0].soma || 0).toFixed(2)})`);
            
            // Verificar inconsistências
            if (equipe.limite_disponivel < 0) {
                console.log(`  ⚠️  PROBLEMA: Limite disponível negativo!`);
            }
            
            if (equipe.limite_disponivel > equipe.limite_credito) {
                console.log(`  ⚠️  PROBLEMA: Limite disponível maior que limite total!`);
            }
            
            if (percentual >= 100 && pedidos[0].total === 0) {
                console.log(`  ⚠️  PROBLEMA: 100% utilizado mas sem pedidos ativos!`);
            }
            
            console.log('');
        }
        
        // Verificar se há campo de reset mensal
        const [columns] = await pool.query(`
            SHOW COLUMNS FROM equipes LIKE 'ultimo_reset%'
        `);
        
        console.log('='.repeat(80));
        console.log('CAMPOS DE RESET MENSAL');
        console.log('='.repeat(80));
        
        if (columns.length > 0) {
            console.log('✅ Campos encontrados:');
            columns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`);
            });
        } else {
            console.log('❌ Nenhum campo de reset mensal encontrado!');
            console.log('   Será necessário criar campo "ultimo_reset_saldo"');
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

verificarCreditoEquipes();
