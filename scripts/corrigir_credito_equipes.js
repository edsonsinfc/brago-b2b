const mysql = require('mysql2/promise');

async function corrigirCreditoEquipes() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nexus_b2b'
    });

    try {
        console.log('='.repeat(80));
        console.log('CORRIGINDO CRÉDITO DAS EQUIPES');
        console.log('='.repeat(80));
        
        // 1. Adicionar campo de reset mensal
        console.log('\n1️⃣ Adicionando campo de reset mensal...');
        await pool.query(`
            ALTER TABLE equipes 
            ADD COLUMN IF NOT EXISTS ultimo_reset_saldo DATE DEFAULT NULL
            AFTER saldo_atual
        `);
        console.log('✅ Campo "ultimo_reset_saldo" adicionado!');
        
        // 2. Resetar limite disponível para equipes sem pedidos ativos
        console.log('\n2️⃣ Corrigindo limite disponível das lojas sem pedidos...');
        
        const [equipesProblematicas] = await pool.query(`
            SELECT e.id, e.nome, e.limite_credito, e.limite_disponivel
            FROM equipes e
            WHERE e.limite_disponivel < e.limite_credito
            AND NOT EXISTS (
                SELECT 1 FROM pedidos p 
                WHERE p.equipe_id = e.id 
                AND p.status IN ('APROVADO', 'EM_SEPARACAO', 'EM_TRANSPORTE', 'SAIU_ENTREGA')
            )
        `);
        
        console.log(`\nEncontradas ${equipesProblematicas.length} equipes com limite incorreto:\n`);
        
        for (const equipe of equipesProblematicas) {
            console.log(`  ${equipe.nome}:`);
            console.log(`    Limite Total: R$ ${Number(equipe.limite_credito).toFixed(2)}`);
            console.log(`    Limite Disponível (antes): R$ ${Number(equipe.limite_disponivel).toFixed(2)}`);
            
            // Resetar limite disponível = limite total
            await pool.query(`
                UPDATE equipes 
                SET limite_disponivel = limite_credito
                WHERE id = ?
            `, [equipe.id]);
            
            console.log(`    Limite Disponível (depois): R$ ${Number(equipe.limite_credito).toFixed(2)}`);
            console.log(`    ✅ Corrigido!\n`);
        }
        
        // 3. Definir data de último reset como hoje
        console.log('3️⃣ Definindo data de reset...');
        await pool.query(`
            UPDATE equipes 
            SET ultimo_reset_saldo = CURDATE()
            WHERE ultimo_reset_saldo IS NULL
        `);
        console.log('✅ Data de reset definida para todas as equipes!');
        
        // 4. Verificar resultado
        console.log('\n' + '='.repeat(80));
        console.log('VERIFICAÇÃO FINAL');
        console.log('='.repeat(80));
        
        const [resultado] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN limite_disponivel = 0 THEN 1 ELSE 0 END) as zeradas,
                SUM(CASE WHEN limite_disponivel < 0 THEN 1 ELSE 0 END) as negativas
            FROM equipes
        `);
        
        console.log(`\nTotal de equipes: ${resultado[0].total}`);
        console.log(`Equipes com limite zerado: ${resultado[0].zeradas}`);
        console.log(`Equipes com limite negativo: ${resultado[0].negativas}`);
        
        if (resultado[0].negativas > 0) {
            console.log('\n⚠️  ATENÇÃO: Ainda há equipes com limite negativo!');
        } else if (resultado[0].zeradas === 0) {
            console.log('\n✅ Todas as equipes corrigidas com sucesso!');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
}

corrigirCreditoEquipes();
