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
    
    // Renderizar checkboxes no formulário de cadastro
    const container = $('#equipesCheckboxes');
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

// Carregar equipes quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    carregarEquipesParaCheckboxes();
  }, 500);
});
