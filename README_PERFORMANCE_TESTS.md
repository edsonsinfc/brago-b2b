# 🚀 Testes de Performance - Sistema B2B Brago

## ⚡ Início Rápido

Se você está recebendo relatos de lentidão no login ou na tela de produtos, siga estas instruções:

### No Windows:

```bash
# Execute o arquivo de menu
double-click executar_testes_performance.bat

# Ou via terminal
executar_testes_performance.bat
```

### No Linux/Mac:

```bash
# Teste HTTP (velocidade de endpoints)
node test_performance.js

# Teste de Banco de Dados (queries)
node test_db_performance.js

# Monitor em tempo real
node test_monitor_realtime.js
```

---

## 📊 Arquivos de Teste

### 1. `test_performance.js` - Teste HTTP
**Testa:** Login, Produtos, Galeria, Concorrência

```bash
node test_performance.js
```

**Resultado esperado:**
- Login: **< 500ms** ✅
- Produtos: **< 1000ms** ✅
- Galeria: **< 1500ms** ✅

---

### 2. `test_db_performance.js` - Teste de Banco de Dados
**Testa:** Queries críticas, índices, pool de conexões

```bash
node test_db_performance.js
```

**Procure por:**
- ⚠️ Queries marcadas como "LENTA"
- ❌ Tabelas "SEM ÍNDICES"
- 🔴 Status "ERRO"

---

### 3. `test_monitor_realtime.js` - Monitor em Tempo Real
**Monitora:** CPU, Memória, Latência de BD

```bash
node test_monitor_realtime.js
# Pressione Ctrl+C para parar
```

**Métricas desejáveis:**
- CPU: **< 70%**
- Memória: **< 80%**
- Latência: **< 200ms**

---

## 🔍 O Que Fazer com os Resultados

### Teste HTTP mostrou lentidão no login?
👉 Execute `test_db_performance.js` e procure por query lenta em "Login - Buscar usuário"

### Teste de BD mostrou query lenta?
```sql
-- Adicione índice
ALTER TABLE usuarios ADD INDEX idx_email (email);

-- Para produtos
ALTER TABLE produtos ADD INDEX idx_equipe (equipe_id);
ALTER TABLE equipes_produtos ADD INDEX idx_equipe (equipe_id);
```

### Monitor mostrou CPU/Memória alta?
- Aumentar recursos do servidor
- Verificar se há processos em background
- Considerar implementar cache Redis

---

## 📋 Guia Completo

Para mais informações detalhadas, leia:

📖 [GUIA_TESTES_PERFORMANCE.md](GUIA_TESTES_PERFORMANCE.md)

---

## ❓ Dúvidas Frequentes

**P: Qual teste devo executar primeiro?**
R: Execute nesta ordem: 1) test_db_performance.js 2) test_performance.js 3) test_monitor_realtime.js

**P: Posso rodar os testes em produção?**
R: Sim, mas com poucos usuários. São testes de leitura que não modificam dados.

**P: O servidor vai cair durante os testes?**
R: Não, são testes leves. O teste de concorrência usa apenas 20 requisições simultâneas.

**P: Quanto tempo levam os testes?**
R: ~2-5 minutos cada, dependendo do tamanho da base.

---

## 🛠️ Pré-requisitos

- ✅ Node.js 14+
- ✅ Servidor rodando: `npm start`
- ✅ Banco de dados acessível
- ✅ Usuário de teste: `teste@brago.com.br`

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se o servidor está rodando
2. Verifique conexão com banco de dados
3. Confirme que usuario de teste existe
4. Compartilhe os logs do teste com a equipe

---

**Versão:** 1.0  
**Data:** Fevereiro 2026
