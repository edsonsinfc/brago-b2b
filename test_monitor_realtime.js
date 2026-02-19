/**
 * Monitor de Performance em Tempo Real
 * Coleta métricas do sistema durante operação normal
 * 
 * Uso: node test_monitor_realtime.js
 */

const os = require('os');
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

class RealtimePerformanceMonitor {
  constructor() {
    this.metrics = {
      cpu: [],
      memoria: [],
      respostas: [],
      erros: 0,
      startTime: Date.now()
    };
    this.interval = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Coleta métricas do sistema operacional
   */
  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercent = (usedMemory / totalMemory) * 100;

    // Calcular CPU médio
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuPercent = 100 - ~~(100 * idle / total);

    return {
      cpu: cpuPercent,
      memoria: {
        total: (totalMemory / 1024 / 1024 / 1024).toFixed(2),
        usado: (usedMemory / 1024 / 1024 / 1024).toFixed(2),
        livre: (freeMemory / 1024 / 1024 / 1024).toFixed(2),
        percentual: memoryPercent.toFixed(2)
      },
      uptime: os.uptime()
    };
  }

  /**
   * Teste de latência do banco de dados
   */
  async testDatabaseLatency() {
    try {
      const start = Date.now();
      await pool.execute('SELECT 1');
      return Date.now() - start;
    } catch (error) {
      this.metrics.erros++;
      return null;
    }
  }

  /**
   * Formata bytes em unidade legível
   */
  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Limpa tela do console
   */
  clearScreen() {
    console.clear();
  }

  /**
   * Exibe dashboard em tempo real
   */
  async displayDashboard() {
    const metrics = this.collectSystemMetrics();
    const dbLatency = await this.testDatabaseLatency();

    if (dbLatency !== null) {
      this.metrics.respostas.push(dbLatency);
      if (this.metrics.respostas.length > 100) {
        this.metrics.respostas.shift();
      }
    }

    this.clearScreen();

    this.log('╔' + '═'.repeat(58) + '╗', 'cyan');
    this.log('║' + ' '.repeat(14) + '📊 MONITOR DE PERFORMANCE' + ' '.repeat(20) + '║', 'cyan');
    this.log('╚' + '═'.repeat(58) + '╝', 'cyan');

    // Seção de CPU
    this.log('\n📌 CPU:', 'blue');
    this.log(`   Uso: ${metrics.cpu}% ${this.getBar(metrics.cpu)}`, metrics.cpu > 80 ? 'red' : metrics.cpu > 50 ? 'yellow' : 'green');

    // Seção de Memória
    this.log('\n💾 MEMÓRIA:', 'blue');
    this.log(`   Total: ${metrics.memoria.total} GB`, 'gray');
    this.log(`   Usado: ${metrics.memoria.usado} GB (${metrics.memoria.percentual}%) ${this.getBar(parseFloat(metrics.memoria.percentual))}`, 
      parseFloat(metrics.memoria.percentual) > 80 ? 'red' : parseFloat(metrics.memoria.percentual) > 60 ? 'yellow' : 'green');
    this.log(`   Livre: ${metrics.memoria.livre} GB`, 'gray');

    // Seção de Banco de Dados
    this.log('\n🗄️  BANCO DE DADOS:', 'blue');
    if (dbLatency !== null) {
      const status = dbLatency > 500 ? 'LENTO' : dbLatency > 200 ? 'ACEITÁVEL' : 'RÁPIDO';
      const color = dbLatency > 500 ? 'red' : dbLatency > 200 ? 'yellow' : 'green';
      this.log(`   Latência: ${dbLatency}ms (${status})`, color);
    } else {
      this.log(`   Latência: ERRO`, 'red');
    }

    // Estatísticas de Respostas
    if (this.metrics.respostas.length > 0) {
      const min = Math.min(...this.metrics.respostas);
      const max = Math.max(...this.metrics.respostas);
      const avg = this.metrics.respostas.reduce((a, b) => a + b) / this.metrics.respostas.length;

      this.log('\n⚡ ESTATÍSTICAS DE RESPOSTA (últimas 100 queries):', 'blue');
      this.log(`   Min: ${min}ms | Max: ${max}ms | Média: ${avg.toFixed(2)}ms`, 'gray');
    }

    // Estatísticas gerais
    const uptime = new Date(metrics.uptime * 1000).toISOString().substr(11, 8);
    const tempoMonitorando = Math.floor((Date.now() - this.metrics.startTime) / 1000);

    this.log('\n📊 ESTATÍSTICAS GERAIS:', 'blue');
    this.log(`   Uptime do servidor: ${uptime}`, 'gray');
    this.log(`   Tempo monitorando: ${tempoMonitorando}s`, 'gray');
    this.log(`   Erros detectados: ${this.metrics.erros}`, this.metrics.erros > 0 ? 'yellow' : 'green');

    this.log('\n' + '─'.repeat(60), 'cyan');
    this.log('Atualizando a cada 5 segundos... (Ctrl+C para parar)', 'gray');
  }

  /**
   * Cria uma barra visual de progresso
   */
  getBar(percent, length = 20) {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    const filledChar = '█';
    const emptyChar = '░';

    return `[${filledChar.repeat(filled)}${emptyChar.repeat(empty)}] ${percent.toFixed(0)}%`;
  }

  /**
   * Inicia monitoramento
   */
  start() {
    this.log('🚀 Iniciando monitor de performance...', 'green');
    this.displayDashboard();

    this.interval = setInterval(() => {
      this.displayDashboard();
    }, 5000); // Atualiza a cada 5 segundos
  }

  /**
   * Para o monitoramento
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.log('\n✅ Monitor finalizado.', 'green');
  }
}

// Configurar handlers para parada graciosa
const monitor = new RealtimePerformanceMonitor();

process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  monitor.stop();
  process.exit(0);
});

// Iniciar
monitor.start();
