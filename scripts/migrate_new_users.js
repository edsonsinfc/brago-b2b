const bcrypt = require('bcryptjs');
const pool = require('../src/config/db.mysql');

// Mapeamento de lojas existentes
const LOJAS_MAP = {
  '105 SUL': 27,
  '212 SUL': 21,
  '203 SUL': 30,
  '209 NORTE': 25,
  'DOM BOSCO - LAGO SUL': 23,
  'IGUATEMI': 28,
  'CD': 26,
  'SUDOESTE': 29
};

// Lojas novas que precisam ser criadas
const NOVAS_LOJAS = [
  'ARAUCARIAS',
  'FLAMBOYANT',
  '302 SUDOESTE',
  'VICENTE PIRES',
  'QI 09',
  'COLORADO',
  'T63',
  '306 NORTE',
  'JARDIM BOTÂNICO'
];

// Lista completa de usuários
const USUARIOS = [
  // LINHA 2 - 105 SUL
  { nome: 'GUILHERME DE SOUSA CHAVES DOS SANTOS', email: 'guilherme.chaves@redeoba.com.br', senha: 'Gui@oba123', perfil: 'solicitante', lojas: ['105 SUL'], categoria: 'facility' },
  { nome: 'GISLENE DE LIMA RIBEIRO', email: 'gislene.ribeiro@redeoba.com.br', senha: 'Gis@oba123', perfil: 'gestor', lojas: ['105 SUL'] },
  
  // LINHA 3 - ARAUCARIAS
  { nome: 'ALEX MOREIRA DA SILVA', email: 'alex.moreira@redeoba.com.br', senha: 'Ale@oba123', perfil: 'solicitante', lojas: ['ARAUCARIAS'], categoria: 'facility' },
  { nome: 'RAFAEL MILER DE CAMARGOS', email: 'rafael.mc@redeoba.com.br', senha: 'Raf@oba123', perfil: 'gestor', lojas: ['ARAUCARIAS'] },
  
  // LINHA 4 - FLAMBOYANT
  { nome: 'RIVALDO DE SOUSA CARVALHO', email: 'rivaldo.carvalho@redeoba.com.br', senha: 'Riv@oba123', perfil: 'solicitante', lojas: ['FLAMBOYANT'], categoria: 'facility' },
  { nome: 'HENRIQUE ALLYS SANTOS RODRIGUES', email: 'henrique.rodrigues@redeoba.com.br', senha: 'Hen@oba123', perfil: 'gestor', lojas: ['FLAMBOYANT'] },
  
  // LINHA 5 - 302 SUDOESTE
  { nome: 'REGIVANE DOURADO DE MAGALHAES', email: 'regivane.magalhaes@redeoba.com.br', senha: 'Reg@oba123', perfil: 'solicitante', lojas: ['302 SUDOESTE'], categoria: 'facility' },
  { nome: 'TANIA NERI SERRA', email: 'tania@redeoba.com.br', senha: 'Tan@oba123', perfil: 'gestor', lojas: ['302 SUDOESTE'] },
  
  // LINHA 6 - VICENTE PIRES
  { nome: 'DIEGO DE SOUSA OLIVEIRA', email: 'diego.oliveira@redeoba.com.br', senha: 'Die@oba123', perfil: 'solicitante', lojas: ['VICENTE PIRES'], categoria: 'facility' },
  { nome: 'REJIANE RIBEIRO TAVARES', email: 'rejiane.ribeiro@redeoba.com.br', senha: 'Rej@oba123', perfil: 'gestor', lojas: ['VICENTE PIRES'] },
  
  // LINHA 7 - DOM BOSCO
  { nome: 'JESSYANE MONTEIRO SILVA', email: 'jessyane.silva@redeoba.com.br', senha: 'Jes@oba123', perfil: 'solicitante', lojas: ['DOM BOSCO - LAGO SUL'], categoria: 'facility' },
  { nome: 'JESINEY LOPES DA SILVA', email: 'jesiney.ls@redeoba.com.br', senha: 'Jesi@oba123', perfil: 'gestor', lojas: ['DOM BOSCO - LAGO SUL'] },
  
  // LINHA 8 e 9 - QI 09 (2 solicitantes, 2 gestores compartilhados)
  { nome: 'RENATO GOMES DE SOUSA', email: 'renato.sousa@redeoba.com.br', senha: 'Ren@oba123', perfil: 'solicitante', lojas: ['QI 09'], categoria: 'facility' },
  { nome: 'ANA CAROLINA VIEIRA DINIZ', email: 'ana.diniz@redeoba.com.br', senha: 'Ana@oba123', perfil: 'solicitante', lojas: ['QI 09'], categoria: 'facility' },
  { nome: 'HELIO REIS CUSTODIO', email: 'helio.reis@redeoba.com.br', senha: 'Hel@oba123', perfil: 'gestor', lojas: ['QI 09'] },
  { nome: 'JANDERSON CAMPELO DA SILVA', email: 'janderson.silva@redeoba.com.br', senha: 'Jan@oba123', perfil: 'gestor', lojas: ['QI 09'] },
  
  // LINHA 10 e 11 - IGUATEMI (2 solicitantes, 2 gestores compartilhados)
  { nome: 'BRUNO MADEIRA DE SOUSA', email: 'bruno.sousa@redeoba.com.br', senha: 'Bru@oba123', perfil: 'solicitante', lojas: ['IGUATEMI'], categoria: 'facility' },
  { nome: 'TONI SOARES DA SILVA', email: 'toni.soares@redeoba.com.br', senha: 'Ton@oba123', perfil: 'solicitante', lojas: ['IGUATEMI'], categoria: 'facility' },
  { nome: 'DEUSDETE JUNIO MOREIRA RAMOS', email: 'junior.moreira@redeoba.com.br', senha: 'Deu@oba123', perfil: 'gestor', lojas: ['IGUATEMI'] },
  { nome: 'MARLYNIVAN CHRISTIE SILVA LACERDA', email: 'marlyniva.lacerda@redeoba.com.br', senha: 'Mar@oba123', perfil: 'gestor', lojas: ['IGUATEMI'] },
  
  // LINHA 12 e 13 - 212 SUL (2 solicitantes, 2 gestores compartilhados)
  { nome: 'FABRICIO DE SOUSA GALENO', email: 'galeno@redeoba.com.br', senha: 'Fab@oba123', perfil: 'solicitante', lojas: ['212 SUL'], categoria: 'facility' },
  { nome: 'EDUARDA JAIRA DE ARAUJO SANTOS', email: 'eduarda.santos@redeoba.com.br', senha: 'Edu@oba123', perfil: 'solicitante', lojas: ['212 SUL'], categoria: 'facility' },
  { nome: 'ANTONIO WELITON SILVA PASSOS', email: 'weliton.silva@redeoba.com.br', senha: 'Ant@oba123', perfil: 'gestor', lojas: ['212 SUL'] },
  { nome: 'ADAILTON MATOS TAVARES', email: 'adailton.mt@redeoba.com.br', senha: 'Ada@oba123', perfil: 'gestor', lojas: ['212 SUL'] },
  
  // LINHA 14 - 203 SUL
  { nome: 'VERONICA LOPES FELIPE', email: 'veronica.pacheco@redeoba.com.br', senha: 'Ver@oba123', perfil: 'solicitante', lojas: ['203 SUL'], categoria: 'facility' },
  { nome: 'WANDER DO ROSARIO FERREIRA', email: 'wander.ferreira@redeoba.com.br', senha: 'Wan@oba123', perfil: 'gestor', lojas: ['203 SUL'] },
  
  // LINHA 15 - COLORADO
  { nome: 'EMMANUEL RODRIGUES DIAS', email: 'emanuel.Dias@redeoba.com.br', senha: 'Emm@oba123', perfil: 'solicitante', lojas: ['COLORADO'], categoria: 'facility' },
  { nome: 'JEFFERSON FERNANDES ALVES DA SILVA', email: 'jefferson.fernandes@redeoba.com.br', senha: 'Jef@oba123', perfil: 'gestor', lojas: ['COLORADO'] },
  
  // LINHA 16 - T63
  { nome: 'LEVY BRUNO PEREIRA DE CARVALHO FE', email: 'levy.carvalho@redeoba.com.br', senha: 'Lev@oba123', perfil: 'solicitante', lojas: ['T63'], categoria: 'facility' },
  { nome: 'JAIRO MEDEIROS CAMPOS', email: 'jairo.campos@redeoba.com.br', senha: 'Jai@oba123', perfil: 'gestor', lojas: ['T63'] },
  
  // LINHA 17 - 306 NORTE
  { nome: 'DAIANE DE JESUS ROCHA', email: 'daiane.rocha@redeoba.com.br', senha: 'Dai@oba123', perfil: 'solicitante', lojas: ['306 NORTE'], categoria: 'facility' },
  { nome: 'RODRIGO KLIPPEL DOS SANTOS', email: 'rodrigo.ks@redeoba.com.br', senha: 'Rod@oba123', perfil: 'gestor', lojas: ['306 NORTE'] },
  
  // LINHA 18 - 209 NORTE
  { nome: 'TIAGO LUCAS LEAO EVANGELISTA', email: 'tiago.evangelista@redeoba.com.br', senha: 'Tia@oba123', perfil: 'solicitante', lojas: ['209 NORTE'], categoria: 'facility' },
  { nome: 'DIEGO ANDRADE MAGALHAES CARVALHO', email: 'diego.carvalho@redeoba.com.br', senha: 'Dieg@oba123', perfil: 'gestor', lojas: ['209 NORTE'] },
  
  // LINHA 19 e 20 - JARDIM BOTÂNICO (2 solicitantes, 2 gestores compartilhados)
  { nome: 'ALDAIR JOSE DA SILVA', email: 'aldair.silva@redeoba.com.br', senha: 'Ald@oba123', perfil: 'solicitante', lojas: ['JARDIM BOTÂNICO'], categoria: 'facility' },
  { nome: 'LEONARDO SOUSA MELO', email: 'leonardo.melo@redeoba.com.br', senha: 'Leo@oba123', perfil: 'solicitante', lojas: ['JARDIM BOTÂNICO'], categoria: 'facility' },
  { nome: 'EMANOEL MADEIRA ALVES', email: 'emanoel.alves@redeoba.com.br', senha: 'Ema@oba123', perfil: 'gestor', lojas: ['JARDIM BOTÂNICO'] },
  { nome: 'PATRICK SOARES BORGES', email: 'patrick.borges@redeoba.com.br', senha: 'Pat@oba123', perfil: 'gestor', lojas: ['JARDIM BOTÂNICO'] },
  
  // LINHA 23 - CD
  { nome: 'ISABELLA VITORIA PEIXOTO CAIXETA', email: 'isabella.caixeta@redeoba.com.br', senha: 'Isa@oba123', perfil: 'solicitante', lojas: ['CD'], categoria: 'facility' },
  { nome: 'LIVIA MARIA OCARLOS', email: 'livia.nogueira@redeoba.com.br', senha: 'Liv@oba123', perfil: 'gestor', lojas: ['CD'] },
  
  // LINHA 24 - CD
  { nome: 'RAYARA ABREU DE ABREU', email: 'rayara.abreu@redeoba.com.br', senha: 'Ray@oba123', perfil: 'solicitante', lojas: ['CD'], categoria: 'facility' },
  { nome: 'RAVENA DE QUEIROZ MARQUES', email: 'ravena.marques@redeoba.com.br', senha: 'Rav@oba123', perfil: 'gestor', lojas: ['CD'] }
];

// Usuários com acesso a TODAS as lojas (serão vinculados depois)
const USUARIOS_TODAS_LOJAS = [
  { nome: 'IRINEU DE CARVALHO', email: 'irineu.carvalho@redeoba.com.br', senha: 'Iri@oba123', perfil: 'solicitante', categoria: 'facility' },
  { nome: 'KAMILA MARIA WERNECK', email: 'kamila.werneck@redeoba.com.br', senha: 'Kam@oba123', perfil: 'solicitante', categoria: 'facility' },
  { nome: 'WELLINGTON SANTIAGO PEREIRA', email: 'wellington.santiago@redeoba.com.br', senha: 'Wel@oba123', perfil: 'gestor' }
];

async function migrate() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('\n🚀 INICIANDO MIGRAÇÃO DE USUÁRIOS\n');
    console.log('='.repeat(80));
    
    // PASSO 1: Limpar pedidos
    console.log('\n📦 PASSO 1: Limpando pedidos...');
    await connection.execute('DELETE FROM itens_pedido');
    await connection.execute('DELETE FROM pedidos');
    console.log('✅ Pedidos removidos');
    
    // PASSO 2: Remover usuários gestores e solicitantes
    console.log('\n👥 PASSO 2: Removendo usuários gestores e solicitantes...');
    await connection.execute('DELETE FROM usuarios_equipes WHERE usuario_id IN (SELECT id FROM usuarios WHERE perfil IN ("gestor", "solicitante"))');
    const [deleted] = await connection.execute('DELETE FROM usuarios WHERE perfil IN ("gestor", "solicitante")');
    console.log(`✅ ${deleted.affectedRows} usuários removidos`);
    
    // Pegar ID de um usuário admin para usar como gestor temporário nas lojas
    const [admins] = await connection.execute('SELECT id FROM usuarios WHERE perfil = "admin" LIMIT 1');
    const adminId = admins.length > 0 ? admins[0].id : 1;
    
    // PASSO 3: Criar lojas novas
    console.log('\n🏪 PASSO 3: Criando lojas novas...');
    for (const nomeLoja of NOVAS_LOJAS) {
      const [existing] = await connection.execute('SELECT id FROM equipes WHERE nome = ?', [nomeLoja]);
      if (existing.length === 0) {
        const [result] = await connection.execute(
          'INSERT INTO equipes (nome, limite_credito, gestor_id) VALUES (?, 1000.00, ?)',
          [nomeLoja, adminId]
        );
        LOJAS_MAP[nomeLoja] = result.insertId;
        console.log(`  ✅ Criada: ${nomeLoja} (ID: ${result.insertId})`);
      } else {
        LOJAS_MAP[nomeLoja] = existing[0].id;
        console.log(`  ℹ️  Já existe: ${nomeLoja} (ID: ${existing[0].id})`);
      }
    }
    
    // PASSO 4: Atualizar limite de crédito das lojas para R$ 1000
    console.log('\n💰 PASSO 4: Atualizando limite de crédito das lojas...');
    await connection.execute('UPDATE equipes SET limite_credito = 1000.00, limite_disponivel = 1000.00');
    console.log('✅ Todas as lojas com limite de R$ 1.000,00');
    
    // PASSO 5: Buscar todas as lojas para vincular aos usuários "TODAS"
    const [todasLojas] = await connection.execute('SELECT id FROM equipes');
    const idsTodasLojas = todasLojas.map(l => l.id);
    console.log(`\n📋 Total de lojas no sistema: ${idsTodasLojas.length}`);
    
    // PASSO 6: Cadastrar usuários
    console.log('\n👤 PASSO 5: Cadastrando usuários...');
    
    let countSolicitantes = 0;
    let countGestores = 0;
    let countVinculos = 0;
    
    // Cadastrar usuários normais
    for (const usuario of USUARIOS) {
      const senhaHash = await bcrypt.hash(usuario.senha, 10);
      const categoria = usuario.categoria || null;
      
      // Obter IDs das lojas
      const lojasIds = usuario.lojas.map(nomeLoja => {
        const id = LOJAS_MAP[nomeLoja];
        if (!id) {
          console.warn(`⚠️  Loja não encontrada: ${nomeLoja} para usuário ${usuario.nome}`);
        }
        return id;
      }).filter(Boolean);
      
      if (lojasIds.length === 0) {
        console.warn(`⚠️  Pulando usuário ${usuario.nome} - nenhuma loja válida`);
        continue;
      }
      
      const primeiraLoja = lojasIds[0];
      
      const [result] = await connection.execute(
        'INSERT INTO usuarios (nome, email, senha, perfil, ativo, equipe_id, categoria_acesso, recebe_email_notificacao) VALUES (?, ?, ?, ?, 1, ?, ?, 0)',
        [usuario.nome, usuario.email, senhaHash, usuario.perfil, primeiraLoja, categoria]
      );
      
      const usuarioId = result.insertId;
      
      // Vincular a todas as lojas do usuário
      for (const lojaId of lojasIds) {
        await connection.execute(
          'INSERT INTO usuarios_equipes (usuario_id, equipe_id) VALUES (?, ?)',
          [usuarioId, lojaId]
        );
        countVinculos++;
      }
      
      if (usuario.perfil === 'solicitante') countSolicitantes++;
      if (usuario.perfil === 'gestor') countGestores++;
      
      console.log(`  ✅ ${usuario.perfil.toUpperCase()}: ${usuario.nome} → ${usuario.lojas.join(', ')}`);
    }
    
    // Cadastrar usuários com acesso a TODAS as lojas
    console.log('\n🌐 Cadastrando usuários com acesso a TODAS as lojas...');
    for (const usuario of USUARIOS_TODAS_LOJAS) {
      const senhaHash = await bcrypt.hash(usuario.senha, 10);
      const categoria = usuario.categoria || null;
      
      const [result] = await connection.execute(
        'INSERT INTO usuarios (nome, email, senha, perfil, ativo, equipe_id, categoria_acesso, recebe_email_notificacao) VALUES (?, ?, ?, ?, 1, ?, ?, 0)',
        [usuario.nome, usuario.email, senhaHash, usuario.perfil, idsTodasLojas[0], categoria]
      );
      
      const usuarioId = result.insertId;
      
      // Vincular a TODAS as lojas
      for (const lojaId of idsTodasLojas) {
        await connection.execute(
          'INSERT INTO usuarios_equipes (usuario_id, equipe_id) VALUES (?, ?)',
          [usuarioId, lojaId]
        );
        countVinculos++;
      }
      
      if (usuario.perfil === 'solicitante') countSolicitantes++;
      if (usuario.perfil === 'gestor') countGestores++;
      
      console.log(`  ✅ ${usuario.perfil.toUpperCase()}: ${usuario.nome} → TODAS (${idsTodasLojas.length} lojas)`);
    }
    
    await connection.commit();
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📊 RESUMO:');
    console.log(`   • Solicitantes cadastrados: ${countSolicitantes}`);
    console.log(`   • Gestores cadastrados: ${countGestores}`);
    console.log(`   • Total de usuários: ${countSolicitantes + countGestores}`);
    console.log(`   • Total de vínculos equipe-usuário: ${countVinculos}`);
    console.log(`   • Lojas no sistema: ${idsTodasLojas.length}`);
    console.log(`   • Limite por loja: R$ 1.000,00\n`);
    
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ ERRO NA MIGRAÇÃO:', error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
