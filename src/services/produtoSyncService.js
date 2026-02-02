const { getProdutosOracle } = require('../repositories/oracleProdutos');
const pool = require('../config/db.mysql');

class ProdutoSyncService {
  async sincronizarProdutos() {
    try {
      console.log('🔄 Iniciando sincronização de produtos...');
      
      // Buscar produtos do Oracle
      const produtosOracle = await getProdutosOracle({});
      console.log(`📦 Encontrados ${produtosOracle.length} produtos no Oracle`);
      let inseridos = 0;
      let atualizados = 0;
      
      for (const produto of produtosOracle) {
        try {
          // Verificar se produto já existe
          const [existing] = await pool.execute(
            'SELECT id FROM produtos WHERE codigo = ?',
            [produto.codprod]
          );
          
          const produtoData = {
            codigo: produto.codprod,
            nome: produto.descricao?.substring(0, 200) || 'Produto sem nome',
            descricao: produto.descricao || '',
            categoria: produto.categoria || 'Geral',
            fornecedor: produto.fornecedor || '',
            preco: 0, // Preço será definido pelo gestor
            ativo: 1
          };
          
          if (existing.length > 0) {
            // Atualizar produto existente
            await pool.execute(`
              UPDATE produtos 
              SET nome = ?, descricao = ?, categoria = ?, fornecedor = ?, updated_at = NOW()
              WHERE codigo = ?
            `, [
              produtoData.nome,
              produtoData.descricao,
              produtoData.categoria,
              produtoData.fornecedor,
              produtoData.codigo
            ]);
            atualizados++;
          } else {
            // Inserir novo produto
            await pool.execute(`
              INSERT INTO produtos (codigo, nome, descricao, categoria, fornecedor, preco, ativo)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              produtoData.codigo,
              produtoData.nome,
              produtoData.descricao,
              produtoData.categoria,
              produtoData.fornecedor,
              produtoData.preco,
              produtoData.ativo
            ]);
            inseridos++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar produto ${produto.codprod}:`, error.message);
        }
      }
      
      console.log(`✅ Sincronização concluída: ${inseridos} inseridos, ${atualizados} atualizados`);
      return { inseridos, atualizados, total: produtosOracle.length };
      
    } catch (error) {
      console.error('❌ Erro na sincronização de produtos:', error);
      throw error;
    }
  }
  
  async buscarProdutos({ search, categoria, page = 1, pageSize = 20, ativo = true }) {
    try {
      // Garantir que page e pageSize sejam números
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 20;
      const offset = (pageNum - 1) * pageSizeNum;
      
      console.log('🔍 buscarProdutos - Parâmetros:', { page, pageSize, pageNum, pageSizeNum, offset, ativo, search, categoria });
      
      let whereClause = 'WHERE ativo = ?';
      let params = [ativo ? 1 : 0];
      
      if (search) {
        whereClause += ' AND (codprod LIKE ? OR descricao LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (categoria) {
        whereClause += ' AND categoria = ?';
        params.push(categoria);
      }
      
      console.log('🔍 SQL params:', params, 'LIMIT:', pageSizeNum, 'OFFSET:', offset);
      
      // Buscar produtos com nova estrutura
      // Nota: LIMIT e OFFSET não podem usar placeholders no MySQL, precisam ser interpolados
      const [produtos] = await pool.execute(`
        SELECT 
          id, codprod, descricao, unidade, multiplos, 
          estoque, preco, ncm, categoria, foto, foto_path, observacoes,
          categoria_facility, categoria_manipulacao, ativo,
          created_at, updated_at
        FROM produtos 
        ${whereClause}
        ORDER BY descricao
        LIMIT ${pageSizeNum} OFFSET ${offset}
      `, params);
      
      console.log(`✅ Encontrados ${produtos.length} produtos`);
      
      // Contar total
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM produtos 
        ${whereClause}
      `, params);
      
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / pageSizeNum);
      
      return {
        produtos,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw error;
    }
  }
  
  async buscarCategorias() {
    try {
      const [categorias] = await pool.execute(`
        SELECT DISTINCT categoria 
        FROM produtos 
        WHERE ativo = 1 AND categoria IS NOT NULL AND categoria != ''
        ORDER BY categoria
      `);
      
      return categorias.map(c => c.categoria);
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      throw error;
    }
  }
  
  async atualizarProduto(id, dados) {
    try {
      console.log('🔧 Service atualizarProduto - ID:', id);
      console.log('🔧 Dados recebidos:', JSON.stringify(dados, null, 2));
      
      const { 
        codprod, descricao, unidade, multiplos, 
        estoque, preco, ncm, categoria, foto, foto_path, observacoes,
        categoria_facility, categoria_manipulacao, cont_oba, acesso_especifico,
        equipes_contratos, equipes_especificas
      } = dados;
      
      // Montar query dinamicamente dependendo se há foto nova
      let query;
      let params;
      
      if (foto_path) {
        // Se há upload de nova foto, atualizar foto_path
        query = `
          UPDATE produtos 
          SET codprod = ?, descricao = ?, unidade = ?, multiplos = ?, 
              estoque = ?, preco = ?, ncm = ?, categoria = ?, 
              foto = ?, foto_path = ?, observacoes = ?,
              categoria_facility = ?, categoria_manipulacao = ?,
              cont_oba = ?, acesso_especifico = ?,
              updated_at = NOW()
          WHERE id = ?
        `;
        params = [
          codprod, descricao, unidade, multiplos, estoque, preco, ncm, categoria, 
          foto, foto_path, observacoes, 
          categoria_facility ? 1 : 0, categoria_manipulacao ? 1 : 0,
          cont_oba || 'N', acesso_especifico || 0,
          id
        ];
      } else if (foto) {
        // Se há URL de foto, atualizar apenas foto (não foto_path)
        query = `
          UPDATE produtos 
          SET codprod = ?, descricao = ?, unidade = ?, multiplos = ?, 
              estoque = ?, preco = ?, ncm = ?, categoria = ?, 
              foto = ?, observacoes = ?,
              categoria_facility = ?, categoria_manipulacao = ?,
              cont_oba = ?, acesso_especifico = ?,
              updated_at = NOW()
          WHERE id = ?
        `;
        params = [
          codprod, descricao, unidade, multiplos, estoque, preco, ncm, categoria, 
          foto, observacoes, 
          categoria_facility ? 1 : 0, categoria_manipulacao ? 1 : 0,
          cont_oba || 'N', acesso_especifico || 0,
          id
        ];
      } else {
        // Se não há foto nova, não atualizar campos de foto
        query = `
          UPDATE produtos 
          SET codprod = ?, descricao = ?, unidade = ?, multiplos = ?, 
              estoque = ?, preco = ?, ncm = ?, categoria = ?, 
              observacoes = ?,
              categoria_facility = ?, categoria_manipulacao = ?,
              cont_oba = ?, acesso_especifico = ?,
              updated_at = NOW()
          WHERE id = ?
        `;
        params = [
          codprod, descricao, unidade, multiplos, estoque, preco, ncm, categoria, 
          observacoes, 
          categoria_facility ? 1 : 0, categoria_manipulacao ? 1 : 0,
          cont_oba || 'N', acesso_especifico || 0,
          id
        ];
      }
      
      console.log('📝 Executando query:', query);
      console.log('📝 Params:', params);
      
      await pool.execute(query, params);
      
      console.log('✅ Produto atualizado com sucesso!');
      
      // Atualizar equipes com acesso específico
      if (acesso_especifico === 1) {
        // Remover todas as equipes específicas antigas
        await pool.execute('DELETE FROM produtos_equipes_especificas WHERE produto_id = ?', [id]);
        
        // Inserir novas equipes específicas
        if (equipes_especificas && equipes_especificas.length > 0) {
          for (const equipeId of equipes_especificas) {
            await pool.execute(`
              INSERT IGNORE INTO produtos_equipes_especificas (produto_id, equipe_id)
              VALUES (?, ?)
            `, [id, equipeId]);
          }
        }
      } else {
        // Se acesso_especifico = 0, remover todas as equipes específicas
        await pool.execute('DELETE FROM produtos_equipes_especificas WHERE produto_id = ?', [id]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      console.error('❌ SQL Error Code:', error.code);
      console.error('❌ SQL Message:', error.sqlMessage);
      console.error('❌ SQL State:', error.sqlState);
      throw error;
    }
  }
  
  async criarProduto(dados) {
    try {
      console.log('🔧 Service criarProduto recebeu:', dados);
      
      const { 
        codprod, descricao, unidade = 'UN', multiplos = 1, 
        estoque = 0, preco = 0, ncm, categoria, foto, foto_path, observacoes,
        categoria_facility, categoria_manipulacao, cont_oba, acesso_especifico,
        equipes_contratos, equipes_especificas
      } = dados;
      
      console.log('🔧 Dados processados:', {
        codprod, descricao, unidade, multiplos, 
        estoque, preco, ncm, categoria, foto, foto_path, observacoes,
        categoria_facility, categoria_manipulacao, cont_oba, acesso_especifico
      });
      
      const [result] = await pool.execute(`
        INSERT INTO produtos 
        (codprod, descricao, unidade, multiplos, estoque, preco, ncm, categoria, foto, foto_path, observacoes, categoria_facility, categoria_manipulacao, cont_oba, acesso_especifico)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codprod, descricao, unidade, multiplos, estoque, preco, ncm, categoria, 
        foto || null, foto_path || null, observacoes,
        categoria_facility ? 1 : 0, categoria_manipulacao ? 1 : 0, cont_oba || 'N', acesso_especifico || 0
      ]);
      
      const produtoId = result.insertId;
      console.log('✅ Produto inserido no banco com ID:', produtoId);
      
      // Se tiver acesso_especifico = 1, salvar na tabela produtos_equipes_especificas
      if (acesso_especifico === 1 && equipes_especificas && equipes_especificas.length > 0) {
        console.log('📝 Salvando equipes com acesso específico:', equipes_especificas);
        for (const equipeId of equipes_especificas) {
          await pool.execute(`
            INSERT IGNORE INTO produtos_equipes_especificas (produto_id, equipe_id)
            VALUES (?, ?)
          `, [produtoId, equipeId]);
        }
      }
      
      return { success: true, id: produtoId };
    } catch (error) {
      console.error('❌ Erro detalhado no service criarProduto:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;
    }
  }
  
  async excluirProduto(id) {
    try {
      // Soft delete - apenas marca como inativo
      await pool.execute(`
        UPDATE produtos 
        SET ativo = false, updated_at = NOW()
        WHERE id = ?
      `, [id]);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao excluir produto:', error);
      throw error;
    }
  }
  
  async obterProduto(id) {
    try {
      const [produtos] = await pool.execute(`
        SELECT 
          id, codprod, nome, descricao, unidade, multiplos, 
          estoque, preco, ncm, categoria, foto, observacoes,
          categoria_facility, categoria_manipulacao,
          ativo, created_at, updated_at
        FROM produtos 
        WHERE id = ?
      `, [id]);
      
      if (!produtos[0]) return null;
      
      const produto = produtos[0];
      
      // Buscar imagens
      const [imagens] = await pool.execute(`
        SELECT id, url, legenda, principal, ordem
        FROM produtos_imagens
        WHERE produto_id = ?
        ORDER BY principal DESC, ordem ASC, id ASC
      `, [id]);
      produto.imagens = imagens;
      
      // Buscar vídeos
      const [videos] = await pool.execute(`
        SELECT id, url, titulo, tipo, ordem
        FROM produtos_videos
        WHERE produto_id = ?
        ORDER BY ordem ASC, id ASC
      `, [id]);
      produto.videos = videos;
      
      // Buscar especificações
      const [especificacoes] = await pool.execute(`
        SELECT id, nome, valor, ordem
        FROM produtos_especificacoes
        WHERE produto_id = ?
        ORDER BY ordem ASC, id ASC
      `, [id]);
      produto.especificacoes = especificacoes;
      
      return produto;
    } catch (error) {
      console.error('❌ Erro ao obter produto:', error);
      throw error;
    }
  }
  
  // ====================================
  // MÉTODOS DE GERENCIAMENTO DE MÍDIAS
  // ====================================
  
  async adicionarImagem(produtoId, { url, legenda, principal = false }) {
    try {
      // Se definir como principal, remover principal das outras
      if (principal) {
        await pool.execute(`
          UPDATE produtos_imagens 
          SET principal = false 
          WHERE produto_id = ?
        `, [produtoId]);
      }
      
      // Obter próxima ordem
      const [maxOrdem] = await pool.execute(`
        SELECT COALESCE(MAX(ordem), 0) + 1 as proxima_ordem
        FROM produtos_imagens
        WHERE produto_id = ?
      `, [produtoId]);
      
      const ordem = maxOrdem[0].proxima_ordem;
      
      const [result] = await pool.execute(`
        INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
        VALUES (?, ?, ?, ?, ?)
      `, [produtoId, url, ordem, principal, legenda]);
      
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('❌ Erro ao adicionar imagem:', error);
      throw error;
    }
  }
  
  async removerImagem(produtoId, imagemId) {
    try {
      await pool.execute(`
        DELETE FROM produtos_imagens 
        WHERE id = ? AND produto_id = ?
      `, [imagemId, produtoId]);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover imagem:', error);
      throw error;
    }
  }
  
  async reordenarImagens(produtoId, imagens) {
    try {
      // imagens = [{ id, ordem }, ...]
      for (const img of imagens) {
        await pool.execute(`
          UPDATE produtos_imagens 
          SET ordem = ? 
          WHERE id = ? AND produto_id = ?
        `, [img.ordem, img.id, produtoId]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar imagens:', error);
      throw error;
    }
  }
  
  async definirImagemPrincipal(produtoId, imagemId) {
    try {
      // Remover principal de todas as imagens
      await pool.execute(`
        UPDATE produtos_imagens 
        SET principal = false 
        WHERE produto_id = ?
      `, [produtoId]);
      
      // Definir a nova imagem principal
      await pool.execute(`
        UPDATE produtos_imagens 
        SET principal = true 
        WHERE id = ? AND produto_id = ?
      `, [imagemId, produtoId]);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao definir imagem principal:', error);
      throw error;
    }
  }
  
  async adicionarVideo(produtoId, { url, titulo, tipo = 'youtube' }) {
    try {
      // Obter próxima ordem
      const [maxOrdem] = await pool.execute(`
        SELECT COALESCE(MAX(ordem), 0) + 1 as proxima_ordem
        FROM produtos_videos
        WHERE produto_id = ?
      `, [produtoId]);
      
      const ordem = maxOrdem[0].proxima_ordem;
      
      const [result] = await pool.execute(`
        INSERT INTO produtos_videos (produto_id, url, tipo, ordem, titulo)
        VALUES (?, ?, ?, ?, ?)
      `, [produtoId, url, tipo, ordem, titulo]);
      
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('❌ Erro ao adicionar vídeo:', error);
      throw error;
    }
  }
  
  async removerVideo(produtoId, videoId) {
    try {
      await pool.execute(`
        DELETE FROM produtos_videos 
        WHERE id = ? AND produto_id = ?
      `, [videoId, produtoId]);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover vídeo:', error);
      throw error;
    }
  }
  
  async adicionarEspecificacao(produtoId, { atributo, valor }) {
    try {
      // Obter próxima ordem
      const [maxOrdem] = await pool.execute(`
        SELECT COALESCE(MAX(ordem), 0) + 1 as proxima_ordem
        FROM produtos_especificacoes
        WHERE produto_id = ?
      `, [produtoId]);
      
      const ordem = maxOrdem[0].proxima_ordem;
      
      const [result] = await pool.execute(`
        INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
        VALUES (?, ?, ?, ?)
      `, [produtoId, atributo, valor, ordem]);
      
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('❌ Erro ao adicionar especificação:', error);
      throw error;
    }
  }
  
  async atualizarEspecificacao(produtoId, especId, { atributo, valor }) {
    try {
      await pool.execute(`
        UPDATE produtos_especificacoes 
        SET atributo = ?, valor = ? 
        WHERE id = ? AND produto_id = ?
      `, [atributo, valor, especId, produtoId]);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar especificação:', error);
      throw error;
    }
  }
  
  async removerEspecificacao(produtoId, especId) {
    try {
      await pool.execute(`
        DELETE FROM produtos_especificacoes 
        WHERE id = ? AND produto_id = ?
      `, [especId, produtoId]);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover especificação:', error);
      throw error;
    }
  }
}

module.exports = new ProdutoSyncService();