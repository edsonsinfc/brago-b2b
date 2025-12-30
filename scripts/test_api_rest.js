const http = require('http');

async function testarAPIRest() {
  console.log('🌐 Testando endpoint REST da API...\n');
  
  // Primeiro, fazer login para obter o token
  const loginData = JSON.stringify({
    email: 'admin@local',
    senha: 'admin123'
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const loginResponse = JSON.parse(data);
          
          if (!loginResponse.token) {
            console.error('❌ Falha no login:', data);
            process.exit(1);
          }
          
          console.log('✅ Login realizado com sucesso');
          const token = loginResponse.token;
          
          // Agora buscar usuários
          const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/usuarios?pageSize=5',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };
          
          const req = http.request(options, (res) => {
            let userData = '';
            
            res.on('data', (chunk) => {
              userData += chunk;
            });
            
            res.on('end', () => {
              try {
                const response = JSON.parse(userData);
                console.log('\n📊 Resposta da API:');
                console.log(`   Total: ${response.total}`);
                console.log(`   Usuários retornados: ${response.usuarios?.length}\n`);
                
                if (response.usuarios && response.usuarios.length > 0) {
                  response.usuarios.forEach(u => {
                    console.log(`👤 ${u.nome} (ID: ${u.id})`);
                    console.log(`   Email: ${u.email}`);
                    console.log(`   Perfil: ${u.perfil}`);
                    console.log(`   recebe_email_notificacao: ${u.recebe_email_notificacao} (tipo: ${typeof u.recebe_email_notificacao})`);
                    console.log('');
                  });
                }
                
                process.exit(0);
              } catch (e) {
                console.error('❌ Erro ao parsear resposta:', e);
                console.log('Raw data:', userData);
                process.exit(1);
              }
            });
          });
          
          req.on('error', (e) => {
            console.error('❌ Erro na requisição:', e);
            process.exit(1);
          });
          
          req.end();
          
        } catch (e) {
          console.error('❌ Erro ao parsear login:', e);
          console.log('Raw data:', data);
          process.exit(1);
        }
      });
    });
    
    loginReq.on('error', (e) => {
      console.error('❌ Erro no login:', e);
      process.exit(1);
    });
    
    loginReq.write(loginData);
    loginReq.end();
  });
}

testarAPIRest();
