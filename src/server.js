require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { router: authRoutes } = require('./routes/auth');
const { router: equipesRoutes } = require('./routes/equipes');
const { router: pedidosRoutes } = require('./routes/pedidos');
const { router: produtosRoutes } = require('./routes/produtos');
const { router: notificacoesRoutes } = require('./routes/notificacoes');
const { router: usuariosRoutes } = require('./routes/usuarios');
const { router: uploadRoutes } = require('./routes/upload');
const { router: orcamentosRoutes } = require('./routes/orcamentos');
const passwordResetRoutes = require('./routes/password-reset');
const vendedorRoutes = require('./routes/vendedor');
const emailsNotificacaoRoutes = require('./routes/emailsNotificacao');
const { verificarResetMensal } = require('./services/resetMensalService');

const app = express();

const PORT = process.env.PORT || 3000;  // Porta 3000
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ 
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Log de todas as requisições recebidas
app.use((req, res, next) => {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${clientIP}`);
  next();
});

// Middleware de seguran�a para p�ginas protegidas
app.use((req, res, next) => {
  // P�ginas que requerem autentica��o
  const protectedPages = ['/gestor.html', '/equipe.html', '/galeria.html', '/vendedor.html'];
  
  if (protectedPages.some(page => req.path === page)) {
    // Impedir cache dessas p�ginas
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Rota raiz redireciona para login
app.get('/', (req, res) => res.redirect('/login.html'));

app.use('/api/auth', authRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/vendedor', vendedorRoutes);
app.use('/api/emails-notificacao', emailsNotificacaoRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Tratamento de erros n�o capturados
process.on('uncaughtException', (error) => {
  console.error('? Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('? Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`✅ B2B Brago Distribuidora rodando na porta ${PORT}`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://10.2.4.13:${PORT}`);
  console.log(`   Escutando em todas as interfaces de rede (0.0.0.0:${PORT})`);  
  // Verificar reset mensal ao iniciar servidor
  console.log('\n🔄 Verificando reset mensal de saldo...');
  verificarResetMensal()
    .then(resultado => {
      console.log(`✅ Reset mensal: ${resultado.mensagem}`);
    })
    .catch(error => {
      console.error('❌ Erro no reset mensal:', error);
    });
  
  // Executar verificação diária às 00:05
  const agendarResetDiario = () => {
    const agora = new Date();
    const proximaExecucao = new Date();
    proximaExecucao.setHours(0, 5, 0, 0); // 00:05
    
    if (agora > proximaExecucao) {
      proximaExecucao.setDate(proximaExecucao.getDate() + 1);
    }
    
    const tempoAteProxima = proximaExecucao.getTime() - agora.getTime();
    
    console.log(`⏰ Próximo reset automático agendado para: ${proximaExecucao.toLocaleString('pt-BR')}`);
    
    setTimeout(() => {
      console.log('\n🔄 Executando reset mensal automático...');
      verificarResetMensal()
        .then(resultado => {
          console.log(`✅ Reset automático: ${resultado.mensagem}`);
        })
        .catch(error => {
          console.error('❌ Erro no reset automático:', error);
        })
        .finally(() => {
          // Reagendar para o próximo dia
          agendarResetDiario();
        });
    }, tempoAteProxima);
  };
  
  agendarResetDiario();});
