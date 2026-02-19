/**
 * Script de Teste - Restrições de Segurança em Usuários e Equipes
 * 
 * Este script testa:
 * 1. Apenas Admin pode criar/editar usuários Gestores
 * 2. Apenas Admin pode alterar o campo pode_editar_equipes
 * 3. Apenas usuários com pode_editar_equipes=true podem criar/editar equipes
 */

const BASE_URL = 'http://localhost:3000';

// Credenciais de teste
const ADMIN_CREDENTIALS = {
  email: 'admin@teste.com',
  senha: 'admin123'
};

const GESTOR_CREDENTIALS = {
  email: 'gestor@teste.com',
  senha: 'gestor123'
};

let adminToken = '';
let gestorToken = '';
let testUserId = null;

async function api(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || response.statusText);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function login(credentials) {
  console.log(`🔐 Fazendo login como ${credentials.email}...`);
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: credentials
  });
  console.log(`✅ Login realizado com sucesso!`);
  return data.token;
}

async function test1_AdminPodeCriarGestor() {
  console.log('\n📋 TESTE 1: Admin pode criar Gestor');
  console.log('='.repeat(50));
  
  try {
    const novoGestor = {
      nome: 'Gestor Teste',
      email: `gestor.teste.${Date.now()}@example.com`,
      senha: 'senha123',
      perfil: 'gestor',
      ativo: true
    };
    
    const resultado = await api('/api/usuarios', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: novoGestor
    });
    
    testUserId = resultado.id;
    console.log(`✅ SUCESSO: Admin criou gestor ID ${resultado.id}`);
    return true;
  } catch (error) {
    console.log(`❌ FALHOU: ${error.message}`);
    return false;
  }
}

async function test2_GestorNaoPodeCriarGestor() {
  console.log('\n📋 TESTE 2: Gestor NÃO pode criar Gestor');
  console.log('='.repeat(50));
  
  try {
    const novoGestor = {
      nome: 'Gestor Invalido',
      email: `gestor.invalido.${Date.now()}@example.com`,
      senha: 'senha123',
      perfil: 'gestor',
      ativo: true
    };
    
    await api('/api/usuarios', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${gestorToken}` },
      body: novoGestor
    });
    
    console.log(`❌ FALHOU: Gestor conseguiu criar outro gestor (não deveria)`);
    return false;
  } catch (error) {
    if (error.message.includes('administradores podem criar gestores')) {
      console.log(`✅ SUCESSO: Bloqueio funcionou - ${error.message}`);
      return true;
    }
    console.log(`❌ FALHOU com erro inesperado: ${error.message}`);
    return false;
  }
}

async function test3_GestorNaoPodeAlterarPodeEditarEquipes() {
  console.log('\n📋 TESTE 3: Gestor NÃO pode alterar pode_editar_equipes');
  console.log('='.repeat(50));
  
  if (!testUserId) {
    console.log('⚠️ PULADO: Não há usuário de teste');
    return false;
  }
  
  try {
    await api(`/api/usuarios/${testUserId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${gestorToken}` },
      body: { pode_editar_equipes: true }
    });
    
    console.log(`❌ FALHOU: Gestor conseguiu alterar pode_editar_equipes (não deveria)`);
    return false;
  } catch (error) {
    if (error.message.includes('administradores podem alterar permissões')) {
      console.log(`✅ SUCESSO: Bloqueio funcionou - ${error.message}`);
      return true;
    }
    console.log(`❌ FALHOU com erro inesperado: ${error.message}`);
    return false;
  }
}

async function test4_AdminPodeAlterarPodeEditarEquipes() {
  console.log('\n📋 TESTE 4: Admin PODE alterar pode_editar_equipes');
  console.log('='.repeat(50));
  
  if (!testUserId) {
    console.log('⚠️ PULADO: Não há usuário de teste');
    return false;
  }
  
  try {
    const resultado = await api(`/api/usuarios/${testUserId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: { pode_editar_equipes: true }
    });
    
    console.log(`✅ SUCESSO: Admin alterou pode_editar_equipes para true`);
    console.log(`   Usuário: ${resultado.nome} - pode_editar_equipes: ${resultado.pode_editar_equipes}`);
    return true;
  } catch (error) {
    console.log(`❌ FALHOU: ${error.message}`);
    return false;
  }
}

async function test5_UsuarioSemPermissaoNaoPodeCriarEquipe() {
  console.log('\n📋 TESTE 5: Usuário sem permissão NÃO pode criar equipe');
  console.log('='.repeat(50));
  
  try {
    const novaEquipe = {
      nome: `Equipe Teste ${Date.now()}`,
      gestor_id: 1,
      limite_total: 10000
    };
    
    await api('/api/equipes', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${gestorToken}` },
      body: novaEquipe
    });
    
    console.log(`❌ FALHOU: Gestor sem permissão criou equipe (não deveria)`);
    return false;
  } catch (error) {
    if (error.message.includes('permissão para criar equipes')) {
      console.log(`✅ SUCESSO: Bloqueio funcionou - ${error.message}`);
      return true;
    }
    console.log(`❌ FALHOU com erro inesperado: ${error.message}`);
    return false;
  }
}

async function test6_AdminPodeCriarEquipe() {
  console.log('\n📋 TESTE 6: Admin PODE criar equipe');
  console.log('='.repeat(50));
  
  try {
    const novaEquipe = {
      nome: `Equipe Admin Teste ${Date.now()}`,
      gestor_id: 1,
      limite_total: 10000
    };
    
    const resultado = await api('/api/equipes', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: novaEquipe
    });
    
    console.log(`✅ SUCESSO: Admin criou equipe ID ${resultado.id}`);
    return true;
  } catch (error) {
    console.log(`❌ FALHOU: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 INICIANDO TESTES DE RESTRIÇÕES DE SEGURANÇA');
  console.log('='.repeat(70));
  
  try {
    // Login
    adminToken = await login(ADMIN_CREDENTIALS);
    gestorToken = await login(GESTOR_CREDENTIALS);
    
    // Executar testes
    const results = {
      test1: await test1_AdminPodeCriarGestor(),
      test2: await test2_GestorNaoPodeCriarGestor(),
      test3: await test3_GestorNaoPodeAlterarPodeEditarEquipes(),
      test4: await test4_AdminPodeAlterarPodeEditarEquipes(),
      test5: await test5_UsuarioSemPermissaoNaoPodeCriarEquipe(),
      test6: await test6_AdminPodeCriarEquipe()
    };
    
    // Resumo
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(70));
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.values(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      const emoji = passed ? '✅' : '❌';
      console.log(`${emoji} ${test}: ${passed ? 'PASSOU' : 'FALHOU'}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`Resultado Final: ${passed}/${total} testes passaram`);
    console.log('='.repeat(70));
    
    if (passed === total) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! 🎉');
    } else {
      console.log(`\n⚠️ ${total - passed} teste(s) falharam`);
    }
    
  } catch (error) {
    console.error('\n💥 ERRO FATAL:', error.message);
    console.error(error);
  }
}

// Executar
runTests();
