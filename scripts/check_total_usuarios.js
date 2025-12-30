const mysql = require('mysql2/promise');

async function verificarUsuarios() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nexus_b2b'
    });

    try {
        // Total de usuários
        const [usuarios] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
        console.log('Total de usuários:', usuarios[0].total);
        
        // Por perfil
        const [porPerfil] = await pool.query(`
            SELECT perfil, COUNT(*) as total 
            FROM usuarios 
            GROUP BY perfil
        `);
        console.log('\nPor perfil:');
        porPerfil.forEach(p => console.log(`  ${p.perfil}: ${p.total}`));
        
        // Listar todos os usuários
        const [todosUsuarios] = await pool.query(`
            SELECT id, nome, email, perfil, ativo
            FROM usuarios
            ORDER BY perfil, nome
        `);
        
        console.log('\n\nLista de todos os usuários:');
        console.log('='.repeat(80));
        todosUsuarios.forEach(u => {
            console.log(`ID: ${u.id} | ${u.nome.padEnd(35)} | ${u.email.padEnd(35)} | ${u.perfil} | Ativo: ${u.ativo}`);
        });
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

verificarUsuarios();