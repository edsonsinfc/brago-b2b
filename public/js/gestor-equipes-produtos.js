// Funções para gerenciar seleção de equipes em produtos com cont_oba='S'

const $ = s => document.querySelector(s);

let equipesGlobais = [];

async function carregarEquipesParaCheckboxes() {
  try {
    const token = localStorage.getItem('nexus_b2b_token');
    const response = await fetch('/api/equipes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    const equipes = data.equipes || data; // Aceita tanto {equipes: []} quanto []
    equipesGlobais = equipes;
    
    // Renderizar checkboxes no formulário de cadastro (Contrato OBA)
    const container = $('#produtosEquipesCheckboxes');
    if (container) {
      container.innerHTML = equipes.map(eq => `
        <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: 4px; background: white;">
          <input type="checkbox" 
                 name="equipe_check" 
                 value="${eq.id}" 
                 style="cursor: pointer;">
          <span style="font-size: 0.875rem;">${eq.nome}</span>
        </label>
      `).join('');
    }
    
    // Renderizar checkboxes para acesso específico
    const containerEspecificas = $('#equipesEspecificasCheckboxes');
    if (containerEspecificas) {
      containerEspecificas.innerHTML = equipes.map(eq => `
        <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: 4px; background: white;">
          <input type="checkbox" 
                 name="equipe_especifica_check" 
                 value="${eq.id}" 
                 style="cursor: pointer;">
          <span style="font-size: 0.875rem;">${eq.nome}</span>
        </label>
      `).join('');
    }
    
    // Renderizar checkboxes no formulário de edição
    const containerEdit = $('#editEquipesCheckboxes');
    if (containerEdit) {
      containerEdit.innerHTML = equipes.map(eq => `
        <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: 4px; background: white;">
          <input type="checkbox" 
                 name="edit_equipe_check" 
                 value="${eq.id}" 
                 style="cursor: pointer;">
          <span style="font-size: 0.875rem;">${eq.nome}</span>
        </label>
      `).join('');
    }
    
    // Renderizar checkboxes para acesso específico no formulário de edição
    const containerEditEspecificas = $('#editEquipesEspecificasCheckboxes');
    if (containerEditEspecificas) {
      containerEditEspecificas.innerHTML = equipes.map(eq => `
        <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: 4px; background: white;">
          <input type="checkbox" 
                 name="edit_equipe_especifica_check" 
                 value="${eq.id}" 
                 style="cursor: pointer;">
          <span style="font-size: 0.875rem;">${eq.nome}</span>
        </label>
      `).join('');
    }
  } catch (error) {
    console.error('Erro ao carregar equipes:', error);
  }
}

window.toggleEquipesSelection = function() {
  const contOba = $('#cont_oba').value;
  const container = $('#equipesSelectorContainer');
  
  if (contOba === 'S') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
    // Desmarcar todos os checkboxes
    document.querySelectorAll('input[name="equipe_check"]').forEach(cb => cb.checked = false);
  }
};

window.toggleEquipesSelectionEdit = function() {
  const contOba = $('#editCont_oba').value;
  const container = $('#editEquipesSelectorContainer');
  
  if (contOba === 'S') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
    // Desmarcar todos os checkboxes
    document.querySelectorAll('input[name="edit_equipe_check"]').forEach(cb => cb.checked = false);
  }
};

window.getEquipesSelecionadas = function() {
  const checkboxes = document.querySelectorAll('input[name="equipe_check"]:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.value));
};

window.getEquipesSelecionadasEdit = function() {
  const checkboxes = document.querySelectorAll('input[name="edit_equipe_check"]:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.value));
};

window.getEquipesEspecificasSelecionadas = function() {
  const checkboxes = document.querySelectorAll('input[name="equipe_especifica_check"]:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.value));
};

window.getEquipesEspecificasSelecionadasEdit = function() {
  const checkboxes = document.querySelectorAll('input[name="edit_equipe_especifica_check"]:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.value));
};

window.toggleAcessoEspecifico = function() {
  const acessoEspecifico = $('#acesso_especifico').value;
  const container = $('#equipesEspecificasContainer');
  
  if (acessoEspecifico === '1') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
    // Desmarcar todos os checkboxes
    document.querySelectorAll('input[name="equipe_especifica_check"]').forEach(cb => cb.checked = false);
  }
};

window.toggleAcessoEspecificoEdit = function() {
  const acessoEspecifico = $('#editAcessoEspecifico').value;
  const container = $('#editEquipesEspecificasContainer');
  
  if (acessoEspecifico === '1') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
    // Desmarcar todos os checkboxes
    document.querySelectorAll('input[name="edit_equipe_especifica_check"]').forEach(cb => cb.checked = false);
  }
};

// Funções para upload e preview de foto
window.previewFoto = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Arquivo muito grande! Máximo 5MB');
    event.target.value = '';
    return;
  }
  
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    alert('Apenas imagens são permitidas!');
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = $('#fotoPreview');
    const img = $('#fotoPreviewImg');
    if (preview && img) {
      img.src = e.target.result;
      preview.style.display = 'block';
      // Limpar URL se houver upload
      const fotoUrl = $('#foto');
      if (fotoUrl) fotoUrl.value = '';
    }
  };
  reader.readAsDataURL(file);
};

window.previewFotoUrl = function(event) {
  const url = event.target.value;
  if (!url) return;
  
  const preview = $('#fotoPreview');
  const img = $('#fotoPreviewImg');
  if (preview && img) {
    img.src = url;
    preview.style.display = 'block';
    // Limpar upload se houver URL
    const fotoUpload = $('#fotoUpload');
    if (fotoUpload) fotoUpload.value = '';
  }
};

window.removerFoto = function() {
  const preview = $('#fotoPreview');
  const img = $('#fotoPreviewImg');
  const fotoUpload = $('#fotoUpload');
  const fotoUrl = $('#foto');
  
  if (preview) preview.style.display = 'none';
  if (img) img.src = '';
  if (fotoUpload) fotoUpload.value = '';
  if (fotoUrl) fotoUrl.value = '';
};

// Funções para edição de foto
window.previewFotoEdit = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Arquivo muito grande! Máximo 5MB');
    event.target.value = '';
    return;
  }
  
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    alert('Apenas imagens são permitidas!');
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = $('#editFotoPreview');
    const img = $('#editFotoPreviewImg');
    if (preview && img) {
      img.src = e.target.result;
      preview.style.display = 'block';
      // Limpar URL se houver upload
      const fotoUrl = $('#editFoto');
      if (fotoUrl) fotoUrl.value = '';
    }
  };
  reader.readAsDataURL(file);
};

window.previewFotoUrlEdit = function(event) {
  const url = event.target.value;
  if (!url) return;
  
  const preview = $('#editFotoPreview');
  const img = $('#editFotoPreviewImg');
  if (preview && img) {
    img.src = url;
    preview.style.display = 'block';
    // Limpar upload se houver URL
    const fotoUpload = $('#editFotoUpload');
    if (fotoUpload) fotoUpload.value = '';
  }
};

window.removerFotoEdit = function() {
  const preview = $('#editFotoPreview');
  const img = $('#editFotoPreviewImg');
  const fotoUpload = $('#editFotoUpload');
  const fotoUrl = $('#editFoto');
  
  if (preview) preview.style.display = 'none';
  if (img) img.src = '';
  if (fotoUpload) fotoUpload.value = '';
  if (fotoUrl) fotoUrl.value = '';
};

// Carregar equipes quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    carregarEquipesParaCheckboxes();
  }, 500);
});
