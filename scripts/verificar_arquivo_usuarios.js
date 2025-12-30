const fs = require('fs');
const path = require('path');

// Ler o arquivo atual
const arquivo = path.join(__dirname, '..', 'src', 'routes', 'usuarios.js');
const conteudo = fs.readFileSync(arquivo, 'utf-8');

// Procurar pela linha específica do SELECT
const linhaSelect = conteudo.split('\n').find(l => l.includes('SELECT u.id, u.nome, u.email'));

console.log('📄 Conteúdo do arquivo usuarios.js:');
console.log('');
console.log('Linha do SELECT encontrada:');
console.log(linhaSelect);
console.log('');

// Verificar se tem o campo
if (linhaSelect && linhaSelect.includes('recebe_email_notificacao')) {
  console.log('✅ Campo recebe_email_notificacao está no SELECT');
} else {
  console.log('❌ Campo recebe_email_notificacao NÃO está no SELECT');
}

// Contar ocorrências
const ocorrencias = (conteudo.match(/recebe_email_notificacao/g) || []).length;
console.log(`\n📊 Total de ocorrências do campo: ${ocorrencias}`);
