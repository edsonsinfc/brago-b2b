const pool = require('../src/config/db.mysql');

async function verificarAdmin() {
  try {
    const [admins] = await pool.execute('SELECT id, nome, email FROM usuarios WHERE perfil = "admin"');
    console.log('👑 Usuários admin:', admins);
    
    // Testar senha do primeiro admin
    if (admins.length > 0) {
      const bcrypt = require('bcryptjs');
      const [user] = await pool.execute('SELECT senha FROM usuarios WHERE id = ?', [admins[0].id]);
      console.log('\nTestando senhas comuns:');
      console.log('  "admin":', await bcrypt.compare('admin', user[0].senha));
      console.log('  "admin123":', await bcrypt.compare('admin123', user[0].senha));
      console.log('  "Admin123":', await bcrypt.compare('Admin123', user[0].senha));
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

verificarAdmin();
