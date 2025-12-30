const mysql = require('mysql2/promise');

async function testarRotaUsuarios() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nexus_b2b'
    });

    try {
        console.log('='.repeat(80));
        console.log('SIMULANDO ROTA GET /api/usuarios COMO ADMIN');
        console.log('='.repeat(80));
        
        // Simular usuário admin
        const req = {
            user: {
                id: 2,
                perfil: 'admin'
            },
            query: {
                page: '1',
                pageSize: '100'
            }
        };
        
        const { perfil, ativo, q } = req.query || {};
        let page = parseInt(req.query.page || '1', 10);
        let pageSize = parseInt(req.query.pageSize || '20', 10);
        if (!Number.isFinite(page) || page < 1) page = 1;
        if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        const where = [];
        const vals = [];
        if (perfil) { where.push('u.perfil = ?'); vals.push(perfil); }
        if (ativo !== undefined) { where.push('u.ativo = ?'); vals.push(ativo === '1' || ativo === 'true' ? 1 : 0); }
        if (q) { where.push('(u.nome LIKE ? OR u.email LIKE ?)'); vals.push(`%${q}%`, `%${q}%`); }
        
        console.log(`\n👤 Usuário logado: ID ${req.user.id}, Perfil: ${req.user.perfil}`);
        
        // Gestor só vê usuários das suas equipes
        if (req.user && req.user.perfil === 'gestor') {
            console.log('🔒 APLICANDO FILTRO DE GESTOR');
            const [equipesGestor] = await pool.execute(
                'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
                [req.user.id]
            );
            
            if (equipesGestor.length > 0) {
                const equipesIds = equipesGestor.map(e => e.equipe_id);
                where.push(`EXISTS (SELECT 1 FROM usuarios_equipes ue WHERE ue.usuario_id = u.id AND ue.equipe_id IN (${equipesIds.map(() => '?').join(',')}))`);
                vals.push(...equipesIds);
            } else {
                // Gestor sem equipes não vê nenhum usuário
                where.push('1 = 0');
            }
        } else {
            console.log('✅ ADMIN - SEM FILTRO (vê todos os usuários)');
        }
        
        const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';
        
        console.log(`\n📝 SQL WHERE: ${whereSql || '(vazio - retorna todos)'}`);
        console.log(`📝 Valores: ${vals.length > 0 ? JSON.stringify(vals) : '(nenhum)'}`);

        const [[{ total }]] = await pool.execute(
            `SELECT COUNT(DISTINCT u.id) AS total
             FROM usuarios u
             ${whereSql}`,
            vals
        );
        
        console.log(`\n📊 Total de usuários que serão retornados: ${total}`);

        const offset = (page - 1) * pageSize;
        const [rows] = await pool.execute(
            `SELECT u.id, u.nome, u.email, u.perfil, u.ativo
             FROM usuarios u
             ${whereSql}
             ORDER BY u.nome
             LIMIT ${pageSize} OFFSET ${offset}`,
            vals
        );
        
        console.log(`\n👥 Usuários retornados na página ${page}:`);
        console.log('='.repeat(80));
        
        const porPerfil = {};
        rows.forEach((u, index) => {
            console.log(`${index + 1}. ID: ${u.id} | ${u.nome.padEnd(40)} | ${u.perfil.padEnd(12)} | ${u.email}`);
            porPerfil[u.perfil] = (porPerfil[u.perfil] || 0) + 1;
        });
        
        console.log('\n📈 Resumo por perfil:');
        Object.entries(porPerfil).forEach(([perfil, count]) => {
            console.log(`  ${perfil}: ${count}`);
        });
        
        console.log('\n' + '='.repeat(80));
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
}

testarRotaUsuarios();
