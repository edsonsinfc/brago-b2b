/**
 * Suite de testes de performance para o sistema B2B
 * Testa velocidade de login e carregamento de produtos
 * 
 * Uso: node test_performance.js
 */

const http = require('http');
const https = require('https');

// Configurações
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Credenciais para teste
const TEST_USER = {
  email: 'teste@brago.com.br',
  senha: 'senha123'
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class PerformanceTester {
  constructor() {
    this.results = [];
    this.globalToken = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logTable(data) {
    console.table(data);
  }

  /**
   * Faz uma requisição HTTP/HTTPS
   */
  request(method, url, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      const urlObj = new URL(url);

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const startTime = Date.now();

      const req = client.request(urlObj, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const duration = Date.now() - startTime;
          try {
            const parsed = JSON.parse(data);
            resolve({
              status: res.statusCode,
              duration,
              data: parsed,
              headers: res.headers
            });
          } catch {
            resolve({
              status: res.statusCode,
              duration,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  /**
   * Teste de Login
   */
  async testLogin(iterations = 1) {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 TESTE DE PERFORMANCE - LOGIN', 'cyan');
    this.log('='.repeat(60), 'cyan');

    const loginResults = [];

    for (let i = 0; i < iterations; i++) {
      this.log(`\n▶ Tentativa ${i + 1}/${iterations}...`, 'blue');

      try {
        const result = await this.request(
          'POST',
          `${API_BASE}/auth/login`,
          TEST_USER
        );

        loginResults.push({
          tentativa: i + 1,
          status: result.status,
          tempo_ms: result.duration,
          sucesso: result.status === 200 ? '✅' : '❌'
        });

        if (result.status === 200 && result.data.token) {
          this.globalToken = result.data.token;
          this.log(
            `✅ Login bem-sucedido em ${result.duration}ms`,
            'green'
          );
        } else {
          this.log(`❌ Falha no login: ${result.data?.error || 'Erro desconhecido'}`, 'red');
        }
      } catch (error) {
        this.log(`❌ Erro na requisição: ${error.message}`, 'red');
        loginResults.push({
          tentativa: i + 1,
          status: 'ERROR',
          tempo_ms: 0,
          sucesso: '❌'
        });
      }
    }

    // Estatísticas de Login
    this.log('\n📈 ESTATÍSTICAS DE LOGIN:', 'yellow');
    this.logTable(loginResults);

    const tempos = loginResults
      .filter(r => r.tempo_ms > 0)
      .map(r => r.tempo_ms);

    if (tempos.length > 0) {
      const stats = {
        'Tempo mínimo': `${Math.min(...tempos)}ms`,
        'Tempo máximo': `${Math.max(...tempos)}ms`,
        'Tempo médio': `${(tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(2)}ms`,
        'Taxa sucesso': `${((loginResults.filter(r => r.sucesso === '✅').length / loginResults.length) * 100).toFixed(2)}%`
      };

      console.log('\n📊 Resumo:');
      Object.entries(stats).forEach(([key, value]) => {
        const isGood = value.includes('ms') && parseInt(value) < 500;
        const color = isGood ? 'green' : parseInt(value) < 1000 ? 'yellow' : 'red';
        this.log(`   ${key}: ${value}`, color);
      });
    }

    this.results.push({
      teste: 'Login',
      dados: loginResults,
      stats: loginResults.length > 0 ? {
        min: Math.min(...tempos),
        max: Math.max(...tempos),
        avg: tempos.reduce((a, b) => a + b, 0) / tempos.length
      } : null
    });
  }

  /**
   * Teste de Produtos
   */
  async testProdutos(iterations = 1) {
    if (!this.globalToken) {
      this.log('\n❌ Token não disponível. Execute teste de login primeiro.', 'red');
      return;
    }

    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 TESTE DE PERFORMANCE - PRODUTOS', 'cyan');
    this.log('='.repeat(60), 'cyan');

    const produtosResults = [];

    for (let i = 0; i < iterations; i++) {
      this.log(`\n▶ Tentativa ${i + 1}/${iterations}...`, 'blue');

      try {
        const result = await this.request(
          'GET',
          `${API_BASE}/produtos`,
          null,
          { 'Authorization': `Bearer ${this.globalToken}` }
        );

        const quantidadeProdutos = Array.isArray(result.data) ? result.data.length : 
                                   result.data?.data?.length || 0;

        produtosResults.push({
          tentativa: i + 1,
          status: result.status,
          tempo_ms: result.duration,
          quantidade: quantidadeProdutos,
          sucesso: result.status === 200 ? '✅' : '❌'
        });

        this.log(
          `✅ ${quantidadeProdutos} produtos carregados em ${result.duration}ms`,
          'green'
        );
      } catch (error) {
        this.log(`❌ Erro na requisição: ${error.message}`, 'red');
        produtosResults.push({
          tentativa: i + 1,
          status: 'ERROR',
          tempo_ms: 0,
          quantidade: 0,
          sucesso: '❌'
        });
      }
    }

    // Estatísticas de Produtos
    this.log('\n📈 ESTATÍSTICAS DE PRODUTOS:', 'yellow');
    this.logTable(produtosResults);

    const tempos = produtosResults
      .filter(r => r.tempo_ms > 0)
      .map(r => r.tempo_ms);

    if (tempos.length > 0) {
      const stats = {
        'Tempo mínimo': `${Math.min(...tempos)}ms`,
        'Tempo máximo': `${Math.max(...tempos)}ms`,
        'Tempo médio': `${(tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(2)}ms`,
        'Taxa sucesso': `${((produtosResults.filter(r => r.sucesso === '✅').length / produtosResults.length) * 100).toFixed(2)}%`
      };

      console.log('\n📊 Resumo:');
      Object.entries(stats).forEach(([key, value]) => {
        const isGood = value.includes('ms') && parseInt(value) < 1000;
        const color = isGood ? 'green' : parseInt(value) < 2000 ? 'yellow' : 'red';
        this.log(`   ${key}: ${value}`, color);
      });
    }

    this.results.push({
      teste: 'Produtos',
      dados: produtosResults,
      stats: produtosResults.length > 0 ? {
        min: Math.min(...tempos),
        max: Math.max(...tempos),
        avg: tempos.reduce((a, b) => a + b, 0) / tempos.length
      } : null
    });
  }

  /**
   * Teste de Galeria (filtrada por equipe)
   */
  async testGaleria(iterations = 1) {
    if (!this.globalToken) {
      this.log('\n❌ Token não disponível. Execute teste de login primeiro.', 'red');
      return;
    }

    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 TESTE DE PERFORMANCE - GALERIA', 'cyan');
    this.log('='.repeat(60), 'cyan');

    const galeriaResults = [];

    for (let i = 0; i < iterations; i++) {
      this.log(`\n▶ Tentativa ${i + 1}/${iterations}...`, 'blue');

      try {
        const result = await this.request(
          'GET',
          `${API_BASE}/produtos/galeria`,
          null,
          { 'Authorization': `Bearer ${this.globalToken}` }
        );

        const quantidadeProdutos = Array.isArray(result.data) ? result.data.length : 
                                   result.data?.data?.length || 0;

        galeriaResults.push({
          tentativa: i + 1,
          status: result.status,
          tempo_ms: result.duration,
          quantidade: quantidadeProdutos,
          sucesso: result.status === 200 ? '✅' : '❌'
        });

        this.log(
          `✅ ${quantidadeProdutos} produtos da galeria carregados em ${result.duration}ms`,
          'green'
        );
      } catch (error) {
        this.log(`❌ Erro na requisição: ${error.message}`, 'red');
        galeriaResults.push({
          tentativa: i + 1,
          status: 'ERROR',
          tempo_ms: 0,
          quantidade: 0,
          sucesso: '❌'
        });
      }
    }

    // Estatísticas de Galeria
    this.log('\n📈 ESTATÍSTICAS DE GALERIA:', 'yellow');
    this.logTable(galeriaResults);

    const tempos = galeriaResults
      .filter(r => r.tempo_ms > 0)
      .map(r => r.tempo_ms);

    if (tempos.length > 0) {
      const stats = {
        'Tempo mínimo': `${Math.min(...tempos)}ms`,
        'Tempo máximo': `${Math.max(...tempos)}ms`,
        'Tempo médio': `${(tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(2)}ms`,
        'Taxa sucesso': `${((galeriaResults.filter(r => r.sucesso === '✅').length / galeriaResults.length) * 100).toFixed(2)}%`
      };

      console.log('\n📊 Resumo:');
      Object.entries(stats).forEach(([key, value]) => {
        const isGood = value.includes('ms') && parseInt(value) < 1000;
        const color = isGood ? 'green' : parseInt(value) < 2000 ? 'yellow' : 'red';
        this.log(`   ${key}: ${value}`, color);
      });
    }

    this.results.push({
      teste: 'Galeria',
      dados: galeriaResults,
      stats: galeriaResults.length > 0 ? {
        min: Math.min(...tempos),
        max: Math.max(...tempos),
        avg: tempos.reduce((a, b) => a + b, 0) / tempos.length
      } : null
    });
  }

  /**
   * Teste de Health Check (verificar se servidor está funcionando)
   */
  async testHealthCheck() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('🏥 VERIFICAÇÃO DE SAÚDE DO SERVIDOR', 'cyan');
    this.log('='.repeat(60), 'cyan');

    try {
      const result = await this.request('GET', `${BASE_URL}/health`);
      if (result.status === 200) {
        this.log(`✅ Servidor respondendo em ${result.duration}ms`, 'green');
        return true;
      } else {
        this.log(`❌ Servidor retornou status ${result.status}`, 'red');
        return false;
      }
    } catch (error) {
      this.log(`❌ Servidor não está respondendo: ${error.message}`, 'red');
      return false;
    }
  }

  /**
   * Teste de Concorrência
   */
  async testConcorrencia(numeroRequisicoes = 10) {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log(`⚡ TESTE DE CONCORRÊNCIA (${numeroRequisicoes} requisições simultâneas)`, 'cyan');
    this.log('='.repeat(60), 'cyan');

    const promises = [];
    const startTotal = Date.now();

    for (let i = 0; i < numeroRequisicoes; i++) {
      promises.push(
        this.request('GET', `${BASE_URL}/health`)
          .catch(e => ({ status: 'ERROR', duration: 0, error: e.message }))
      );
    }

    try {
      const results = await Promise.all(promises);
      const totalDuration = Date.now() - startTotal;
      const sucessos = results.filter(r => r.status === 200).length;

      this.log(`\n✅ ${sucessos}/${numeroRequisicoes} requisições bem-sucedidas`, 'green');
      this.log(`⏱️  Tempo total: ${totalDuration}ms`, 'blue');
      this.log(`📊 Tempo médio por requisição: ${(totalDuration / numeroRequisicoes).toFixed(2)}ms`, 'blue');
      this.log(`🚀 Taxa de throughput: ${((numeroRequisicoes / totalDuration) * 1000).toFixed(2)} req/s`, 'blue');

      this.results.push({
        teste: 'Concorrência',
        requisicoes: numeroRequisicoes,
        sucessos: sucessos,
        tempo_total: totalDuration,
        tempo_medio: totalDuration / numeroRequisicoes,
        throughput: (numeroRequisicoes / totalDuration) * 1000
      });
    } catch (error) {
      this.log(`❌ Erro no teste de concorrência: ${error.message}`, 'red');
    }
  }

  /**
   * Relatório final
   */
  printFinalReport() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📋 RELATÓRIO FINAL', 'cyan');
    this.log('='.repeat(60), 'cyan');

    this.log(`\n✅ Testes concluídos em ${new Date().toLocaleString('pt-BR')}`, 'green');
    
    this.log('\n📊 ANÁLISE DE PERFORMANCE:', 'yellow');
    
    this.results.forEach(result => {
      this.log(`\n${result.teste}:`, 'blue');
      
      if (result.stats) {
        const minMs = result.stats.min;
        const maxMs = result.stats.max;
        const avgMs = result.stats.avg;

        // Determinar se está bom, aceitável ou ruim
        let status = '✅ BOM';
        if (avgMs > 2000) status = '🔴 CRÍTICO';
        else if (avgMs > 1000) status = '🟡 ATENÇÃO';
        else if (avgMs > 500) status = '🟠 PRECISA OTIMIZAR';

        this.log(`   Min: ${minMs.toFixed(2)}ms | Max: ${maxMs.toFixed(2)}ms | Média: ${avgMs.toFixed(2)}ms - ${status}`, 
          avgMs > 1500 ? 'red' : avgMs > 800 ? 'yellow' : 'green');
      }

      if (result.requisicoes) {
        this.log(`   Requisições: ${result.requisicoes} | Sucesso: ${result.sucessos}/${result.requisicoes}`, 'blue');
        this.log(`   Throughput: ${result.throughput.toFixed(2)} req/s`, 'blue');
      }
    });

    this.log('\n' + '='.repeat(60), 'cyan');
  }
}

/**
 * Função principal
 */
async function main() {
  const tester = new PerformanceTester();

  // Verificar se servidor está online
  const online = await tester.testHealthCheck();
  if (!online) {
    tester.log('\n❌ Impossível continuar. Servidor não está respondendo.', 'red');
    process.exit(1);
  }

  // Executar testes
  const numIteracoes = 3;
  
  await tester.testLogin(numIteracoes);
  await tester.testProdutos(numIteracoes);
  await tester.testGaleria(numIteracoes);
  await tester.testConcorrencia(20);

  // Imprimir relatório
  tester.printFinalReport();
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
