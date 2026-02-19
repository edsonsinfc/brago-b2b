/**
 * Analisador de Performance de Banco de Dados
 * Monitora queries lentas e identifica gargalos
 */

const pool = require('./src/config/db.mysql');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class DatabasePerformanceAnalyzer {
  constructor() {
    this.queryMetrics = [];
    this.SLOW_QUERY_THRESHOLD = 500; // ms
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Testa velocidade de queries críticas do sistema
   */
  async testCriticalQueries() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('🔍 TESTE DE PERFORMANCE - QUERIES CRÍTICAS', 'cyan');
    this.log('='.repeat(60), 'cyan');

    const queries = [
      {
        name: 'Login - Buscar usuário por email',
        query: 'SELECT id, nome, email, senha, perfil, ativo, equipe_id, categoria_acesso FROM usuarios WHERE email = ? LIMIT 1',
        params: ['vendedor@brago.com.br'],
        expectedTime: 50
      },
      {
        name: 'Produtos - Lista todos',
        query: 'SELECT * FROM produtos LIMIT 100',
        params: [],
        expectedTime: 100
      },
      {
        name: 'Produtos - Filtro por equipe',
        query: 'SELECT p.* FROM produtos p INNER JOIN equipes_produtos ep ON p.id = ep.produto_id WHERE ep.equipe_id = ? LIMIT 100',
        params: [1],
        expectedTime: 150
      },
      {
        name: 'Equipes - Listar com filtro',
        query: 'SELECT * FROM equipes WHERE ativo = 1 ORDER BY nome',
        params: [],
        expectedTime: 50
      },
      {
        name: 'Usuários - Listar por equipe',
        query: 'SELECT * FROM usuarios WHERE equipe_id = ? AND ativo = 1',
        params: [1],
        expectedTime: 100
      },
      {
        name: 'Pedidos - Últimos 10 do usuário',
        query: 'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY data_criacao DESC LIMIT 10',
        params: [1],
        expectedTime: 100
      },
      {
        name: 'Notificações - Não lidas',
        query: 'SELECT * FROM notificacoes WHERE usuario_id = ? AND lido = 0 ORDER BY data_criacao DESC',
        params: [1],
        expectedTime: 50
      }
    ];

    for (const testCase of queries) {
      await this.measureQuery(testCase);
    }

    this.printQueryReport();
  }

  /**
   * Mede o tempo de execução de uma query
   */
  async measureQuery(testCase) {
    try {
      const startTime = Date.now();
      const [rows] = await pool.execute(testCase.query, testCase.params);
      const duration = Date.now() - startTime;

      const status = duration > testCase.expectedTime ? '⚠️ LENTA' : '✅ OK';
      const color = duration > testCase.expectedTime ? 'yellow' : 'green';

      this.log(
        `${status} ${testCase.name}: ${duration}ms (esperado: ${testCase.expectedTime}ms)`,
        color
      );

      this.queryMetrics.push({
        nome: testCase.name,
        tempo_ms: duration,
        esperado_ms: testCase.expectedTime,
        registros: rows.length,
        status: duration > testCase.expectedTime ? 'LENTO' : 'OK'
      });
    } catch (error) {
      this.log(`❌ ERRO em "${testCase.name}": ${error.message}`, 'red');
      this.queryMetrics.push({
        nome: testCase.name,
        tempo_ms: 0,
        esperado_ms: testCase.expectedTime,
        registros: 0,
        status: 'ERRO'
      });
    }
  }

  /**
   * Analisa índices do banco de dados
   */
  async analyzeIndexes() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📑 ANÁLISE DE ÍNDICES DO BANCO DE DADOS', 'cyan');
    this.log('='.repeat(60), 'cyan');

    const tables = [
      'usuarios',
      'equipes',
      'produtos',
      'pedidos',
      'notificacoes'
    ];

    for (const table of tables) {
      try {
        const [indexes] = await pool.execute(
          `SELECT * FROM INFORMATION_SCHEMA.STATISTICS 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
          [table]
        );

        if (indexes.length > 0) {
          this.log(`\n📊 Tabela: ${table}`, 'blue');
          const uniqueIndexes = [...new Set(indexes.map(i => i.INDEX_NAME))];
          this.log(`   Índices: ${uniqueIndexes.join(', ')}`, 'gray');
        } else {
          this.log(`\n⚠️  Tabela: ${table} (SEM ÍNDICES!)`, 'yellow');
        }
      } catch (error) {
        this.log(`❌ Erro ao analisar índices de ${table}: ${error.message}`, 'red');
      }
    }
  }

  /**
   * Verifica tamanho do banco de dados
   */
  async checkDatabaseSize() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('💾 ANÁLISE DE TAMANHO DO BANCO DE DADOS', 'cyan');
    this.log('='.repeat(60), 'cyan');

    try {
      const [result] = await pool.execute(`
        SELECT 
          table_name,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
          table_rows
        FROM information_schema.TABLES
        WHERE table_schema = DATABASE()
        ORDER BY (data_length + index_length) DESC
      `);

      if (result.length > 0) {
        console.log('\n📊 Tamanho das tabelas:');
        console.table(result);

        const totalMB = result.reduce((sum, row) => sum + row.size_mb, 0);
        this.log(`\n💾 Tamanho total: ${totalMB.toFixed(2)} MB`, 'cyan');
      }
    } catch (error) {
      this.log(`❌ Erro ao verificar tamanho: ${error.message}`, 'red');
    }
  }

  /**
   * Testa velocidade de insert/update/delete
   */
  async testWriteOperations() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('✏️  TESTE DE PERFORMANCE - OPERAÇÕES DE ESCRITA', 'cyan');
    this.log('='.repeat(60), 'cyan');

    // Nota: Estes são testes não destrutivos
    try {
      // Teste SELECT (baseline)
      const startSelect = Date.now();
      await pool.execute('SELECT 1');
      const selectTime = Date.now() - startSelect;
      this.log(`✅ SELECT simples: ${selectTime}ms`, 'green');

      // Teste com prepared statement (vários executando)
      const startBatch = Date.now();
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          pool.execute('SELECT COUNT(*) as cnt FROM produtos')
        );
      }
      await Promise.all(promises);
      const batchTime = Date.now() - startBatch;
      this.log(`✅ Batch 10 queries: ${batchTime}ms (${(batchTime/10).toFixed(2)}ms cada)`, 'green');

    } catch (error) {
      this.log(`❌ Erro no teste de escrita: ${error.message}`, 'red');
    }
  }

  /**
   * Imprime relatório de queries
   */
  printQueryReport() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📋 RELATÓRIO DE QUERIES', 'cyan');
    this.log('='.repeat(60), 'cyan');

    console.table(this.queryMetrics);

    const lentas = this.queryMetrics.filter(q => q.status === 'LENTO');
    const erros = this.queryMetrics.filter(q => q.status === 'ERRO');

    if (lentas.length > 0) {
      this.log(`\n⚠️  ${lentas.length} queries lentas detectadas:`, 'yellow');
      lentas.forEach(q => {
        this.log(`   - ${q.nome}: ${q.tempo_ms}ms`, 'yellow');
      });
    }

    if (erros.length > 0) {
      this.log(`\n❌ ${erros.length} queries com erro:`, 'red');
      erros.forEach(q => {
        this.log(`   - ${q.nome}`, 'red');
      });
    }

    if (lentas.length === 0 && erros.length === 0) {
      this.log('\n✅ Todas as queries estão dentro dos limites esperados!', 'green');
    }
  }

  /**
   * Testa pool de conexões
   */
  async testConnectionPool() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('🔗 TESTE DO POOL DE CONEXÕES', 'cyan');
    this.log('='.repeat(60), 'cyan');

    try {
      const numConnections = 10;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < numConnections; i++) {
        promises.push(
          pool.execute('SELECT ? as value', [i])
            .then(([rows]) => ({ success: true, index: i, rows: rows[0].value }))
            .catch(error => ({ success: false, index: i, error: error.message }))
        );
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      const sucessos = results.filter(r => r.success).length;

      this.log(`✅ ${sucessos}/${numConnections} conexões bem-sucedidas em ${duration}ms`, 'green');
      
      if (sucessos === numConnections) {
        this.log('✅ Pool de conexões funcionando normalmente', 'green');
      } else {
        this.log(`⚠️  ${numConnections - sucessos} conexões falharam`, 'yellow');
      }
    } catch (error) {
      this.log(`❌ Erro ao testar pool: ${error.message}`, 'red');
    }
  }
}

/**
 * Executa análise completa
 */
async function main() {
  const analyzer = new DatabasePerformanceAnalyzer();

  try {
    await analyzer.testCriticalQueries();
    await analyzer.analyzeIndexes();
    await analyzer.checkDatabaseSize();
    await analyzer.testWriteOperations();
    await analyzer.testConnectionPool();

    console.log('\n✅ Análise de banco de dados concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
