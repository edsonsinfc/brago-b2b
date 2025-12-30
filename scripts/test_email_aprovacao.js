require('dotenv').config();
const emailService = require('../src/services/emailService');

async function testarEmailAprovacao() {
  console.log('📧 Testando envio de email de pedido aprovado...\n');
  
  const dadosTeste = {
    pedido: {
      id: 999,
      valor_total: 5450.75,
      data: new Date(),
      data_aprovacao: new Date(),
      status: 'APROVADO',
      codigo_erp: 'ERP-12345',
      cgc: '12.345.678/0001-90'
    },
    equipe: {
      nome: 'Equipe Teste - ARAUCÁRIAS'
    },
    comprador: {
      nome: 'João Silva (Teste)',
      email: 'joao.silva@exemplo.com'
    },
    gestor: {
      nome: 'Maria Santos (Gestor)',
      email: 'maria.santos@exemplo.com'
    },
    itens: [
      {
        codprod: 'PROD-001',
        descricao: 'Produto Teste 1',
        quantidade: 10,
        valor_unitario: 125.50
      },
      {
        codprod: 'PROD-002',
        descricao: 'Produto Teste 2',
        quantidade: 25,
        valor_unitario: 156.83
      }
    ],
    destinatario: 'brenan.araujo@bragodistribuidora.com.br'
  };
  
  try {
    const resultado = await emailService.enviarPedidoAprovado(dadosTeste);
    
    if (resultado.success) {
      console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
      console.log('   Message ID:', resultado.messageId);
      console.log('   Destinatário:', dadosTeste.destinatario);
    } else {
      console.log('\n❌ FALHA AO ENVIAR EMAIL');
      console.log('   Erro:', resultado.error);
    }
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
  }
  
  process.exit(0);
}

testarEmailAprovacao();
