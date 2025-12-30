const mysql = require('mysql2/promise');

async function verificarEquipesUsuarios() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nexus_b2b'
    });

    try {
        // Buscar o admin
        const [admins] = await pool.query(`
            SELECT id, nome, email, perfil
            FROM usuarios
            WHERE perfil = 'admin'
        `);
        
        console.log('='.repeat(80));
        console.log('USUÁRIOS ADMINISTRADORES');
        console.log('='.repeat(80));
        
        for (const admin of admins) {
            console.log(`\nID: ${admin.id} | ${admin.nome} | ${admin.email}`);
            
            // Verificar equipes do admin
            const [equipes] = await pool.query(`
                SELECT e.id, e.nome
                FROM equipes e
                INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id
                WHERE ue.usuario_id = ?
            `, [admin.id]);
            
            if (equipes.length > 0) {
                console.log(`  ⚠️  ADMIN COM EQUIPES VINCULADAS (${equipes.length}):`);
                equipes.forEach(eq => console.log(`      - ${eq.nome} (ID: ${eq.id})`));
                console.log(`  ⚠️  PROBLEMA: Admin com equipes será tratado como GESTOR no backend!`);
            } else {
                console.log(`  ✅ Admin SEM equipes (vê todos os usuários)`);
            }
        }
        
        // Verificar gestores
        const [gestores] = await pool.query(`
            SELECT u.id, u.nome, u.email, u.perfil, COUNT(ue.equipe_id) as total_equipes
            FROM usuarios u
            LEFT JOIN usuarios_equipes ue ON ue.usuario_id = u.id
            WHERE u.perfil = 'gestor'
            GROUP BY u.id
            ORDER BY u.nome
        `);
        
        console.log('\n' + '='.repeat(80));
        console.log('GESTORES E SUAS EQUIPES');
        console.log('='.repeat(80));
        
        for (const gestor of gestores) {
            console.log(`\nID: ${gestor.id} | ${gestor.nome} | ${gestor.email}`);
            console.log(`  Total de equipes: ${gestor.total_equipes}`);
            
            if (gestor.total_equipes > 0) {
                const [equipes] = await pool.query(`
                    SELECT e.id, e.nome
                    FROM equipes e
                    INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id
                    WHERE ue.usuario_id = ?
                    ORDER BY e.nome
                `, [gestor.id]);
                
                equipes.forEach(eq => console.log(`      - ${eq.nome} (ID: ${eq.id})`));
            }
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

verificarEquipesUsuarios();
