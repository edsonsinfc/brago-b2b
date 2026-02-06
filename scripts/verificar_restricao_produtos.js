/**
 * Script para verificar se os pedidos estão respeitando a limitação de
 * categoria de acesso (facility/manipulação) dos usuários
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nexus_b2b',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function verificarRestricaoProdutos() {
  let conn;
  
  try {
    conn = await pool.getConnection();
    console.log('\n🔍 VERIFICANDO RESTRIÇÕES DE PRODUTOS POR CATEGORIA DE ACESSO\n');
    console.log('='.repeat(80));
    
    // 1. Buscar últimos pedidos
    const [pedidos] = await conn.query(`
      SELECT 
        p.id AS pedido_id,
        p.data,
        p.status,
        p.valor_total,
        p.criado_por AS usuario_id,
        u.nome AS usuario_nome,
        u.email AS usuario_email,
        u.categoria_acesso,
        e.nome AS equipe_nome
      FROM pedidos p
      LEFT JOIN usuarios u ON u.id = p.criado_por
      LEFT JOIN equipes e ON e.id = p.equipe_id
      WHERE p.criado_por IS NOT NULL
      ORDER BY p.id DESC
      LIMIT 20
    `);
    
    console.log(`\n📋 Analisando os últimos ${pedidos.length} pedidos...\n`);
    
    let totalProblemas = 0;
    let pedidosComProblemas = [];
    
    for (const pedido of pedidos) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📦 PEDIDO #${pedido.pedido_id}`);
      console.log(`   Data: ${new Date(pedido.data).toLocaleString('pt-BR')}`);
      console.log(`   Status: ${pedido.status}`);
      console.log(`   Valor: R$ ${Number(pedido.valor_total).toFixed(2)}`);
      console.log(`   Usuário: ${pedido.usuario_nome} (${pedido.usuario_email})`);
      console.log(`   Equipe: ${pedido.equipe_nome}`);
      console.log(`   Categoria de Acesso: ${pedido.categoria_acesso || 'NÃO DEFINIDA'}`);
      
      if (!pedido.categoria_acesso) {
        console.log(`   ⚠️  ATENÇÃO: Usuário sem categoria de acesso definida!`);
      }
      
      // 2. Buscar itens do pedido e verificar categoria dos produtos
      const [itens] = await conn.query(`
        SELECT 
          ip.codprod,
          ip.descricao,
          ip.quantidade,
          ip.valor_unitario,
          ip.valor_total,
          p.categoria_facility,
          p.categoria_manipulacao,
          p.cont_oba
        FROM itens_pedido ip
        LEFT JOIN produtos p ON p.codprod = ip.codprod
        WHERE ip.pedido_id = ?
      `, [pedido.pedido_id]);
      
      console.log(`\n   📦 Itens do pedido (${itens.length}):`);
      
      let problemasPedido = [];
      let produtosFacility = [];
      let produtosManipulacao = [];
      let produtosAmbos = [];
      let produtosSemCategoria = [];
      
      for (const item of itens) {
        const isFacility = item.categoria_facility === 1;
        const isManipulacao = item.categoria_manipulacao === 1;
        
        let tipo = '';
        let icone = '';
        let problema = false;
        
        // Categorizar produto
        if (isFacility && isManipulacao) {
          tipo = 'AMBOS';
          icone = '🔄';
          produtosAmbos.push(item);
        } else if (isFacility) {
          tipo = 'FACILITY';
          icone = '🏭';
          produtosFacility.push(item);
        } else if (isManipulacao) {
          tipo = 'MANIPULAÇÃO';
          icone = '💊';
          produtosManipulacao.push(item);
        } else {
          tipo = 'SEM CATEGORIA';
          icone = '❓';
          produtosSemCategoria.push(item);
        }
        
        // Verificar se há violação de restrição
        if (pedido.categoria_acesso) {
          if (pedido.categoria_acesso === 'facility' && isManipulacao && !isFacility) {
            problema = true;
            problemasPedido.push({
              item: item.descricao,
              tipo: 'MANIPULAÇÃO',
              restricao: 'facility'
            });
          } else if (pedido.categoria_acesso === 'manipulacao' && isFacility && !isManipulacao) {
            problema = true;
            problemasPedido.push({
              item: item.descricao,
              tipo: 'FACILITY',
              restricao: 'manipulacao'
            });
          }
        }
        
        const statusItem = problema ? '❌ VIOLAÇÃO' : '✅';
        
        console.log(`      ${statusItem} ${icone} ${item.codprod} - ${item.descricao}`);
        console.log(`          Tipo: ${tipo} | Qtd: ${item.quantidade} | Valor: R$ ${Number(item.valor_total).toFixed(2)}`);
        
        if (problema) {
          console.log(`          ⚠️  PROBLEMA: Produto do tipo ${tipo} não permitido para usuário com acesso "${pedido.categoria_acesso}"`);
        }
      }
      
      // Resumo do pedido
      console.log(`\n   📊 RESUMO DO PEDIDO:`);
      console.log(`      🏭 Produtos Facility: ${produtosFacility.length}`);
      console.log(`      💊 Produtos Manipulação: ${produtosManipulacao.length}`);
      console.log(`      🔄 Produtos Ambos: ${produtosAmbos.length}`);
      console.log(`      ❓ Produtos sem categoria: ${produtosSemCategoria.length}`);
      
      if (problemasPedido.length > 0) {
        totalProblemas += problemasPedido.length;
        pedidosComProblemas.push({
          pedido_id: pedido.pedido_id,
          usuario: pedido.usuario_nome,
          categoria_acesso: pedido.categoria_acesso,
          problemas: problemasPedido
        });
        
        console.log(`\n   ❌ PEDIDO COM VIOLAÇÃO DE RESTRIÇÕES!`);
        console.log(`      Total de produtos fora da categoria: ${problemasPedido.length}`);
      } else {
        console.log(`\n   ✅ PEDIDO OK - Respeita as restrições de categoria`);
      }
    }
    
    // Relatório Final
    console.log(`\n${'='.repeat(80)}`);
    console.log('\n📊 RELATÓRIO FINAL\n');
    console.log(`Total de pedidos analisados: ${pedidos.length}`);
    console.log(`Pedidos com violações: ${pedidosComProblemas.length}`);
    console.log(`Total de violações encontradas: ${totalProblemas}`);
    
    if (pedidosComProblemas.length > 0) {
      console.log(`\n❌ DETALHAMENTO DAS VIOLAÇÕES:\n`);
      
      for (const pedidoProblema of pedidosComProblemas) {
        console.log(`   Pedido #${pedidoProblema.pedido_id}`);
        console.log(`   Usuário: ${pedidoProblema.usuario}`);
        console.log(`   Categoria permitida: ${pedidoProblema.categoria_acesso}`);
        console.log(`   Violações:`);
        
        for (const problema of pedidoProblema.problemas) {
          console.log(`      - Produto "${problema.item}" do tipo ${problema.tipo} não é permitido`);
        }
        console.log('');
      }
      
      console.log('\n⚠️  RECOMENDAÇÃO:');
      console.log('   - Verificar a validação no momento da criação do pedido');
      console.log('   - Implementar validação no backend para bloquear pedidos com produtos não permitidos');
      console.log('   - Revisar os pedidos acima com os gestores');
      
    } else {
      console.log(`\n✅ TODOS OS PEDIDOS ESTÃO RESPEITANDO AS RESTRIÇÕES!`);
    }
    
    // Estatísticas adicionais
    console.log(`\n${'='.repeat(80)}`);
    console.log('\n📊 ESTATÍSTICAS DE USUÁRIOS E CATEGORIAS\n');
    
    const [estatisticas] = await conn.query(`
      SELECT 
        u.categoria_acesso,
        COUNT(DISTINCT u.id) AS total_usuarios,
        COUNT(DISTINCT p.id) AS total_pedidos
      FROM usuarios u
      LEFT JOIN pedidos p ON p.criado_por = u.id
      WHERE u.perfil = 'solicitante'
      GROUP BY u.categoria_acesso
    `);
    
    for (const stat of estatisticas) {
      console.log(`   Categoria: ${stat.categoria_acesso || 'NÃO DEFINIDA'}`);
      console.log(`   - Usuários: ${stat.total_usuarios}`);
      console.log(`   - Pedidos: ${stat.total_pedidos}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

// Executar
verificarRestricaoProdutos();
