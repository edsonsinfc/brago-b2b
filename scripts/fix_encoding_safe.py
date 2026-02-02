# -*- coding: utf-8 -*-
import codecs

# Ler o arquivo como está
with open('public/equipe.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Substituições seguras - remover TODOS os acentos dos textos estáticos
replacements = {
    'Catálogo B2B': 'Catalogo B2B',
    'Realizar Solicitação': 'Realizar Solicitacao',
    'O gestor receberá automaticamente uma notificação da sua solicitação': 'O gestor recebera automaticamente uma notificacao da sua solicitacao',
    '📧 O gestor receberá': 'O gestor recebera',
    'notificação': 'notificacao',
    'Solicitação': 'Solicitacao',
    
    # Remover possíveis corrupções
    'SolicitaÃ§Ã£o': 'Solicitacao',
    'receberÃ¡': 'recebera',
    'notificaÃ§Ã£o': 'notificacao',
    'SolicitaÃƒÂ§ÃƒÂ£o': 'Solicitacao',
    'receberÃƒÂ¡': 'recebera',
    'notificaÃƒÂ§ÃƒÂ£o': 'notificacao',
    'ðŸ"§': '',  # Remover emoji
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Salvar com UTF-8 SEM BOM
with codecs.open('public/equipe.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Arquivo corrigido com sucesso!')
