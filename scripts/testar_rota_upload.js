const fetch = require('node-fetch');

async function testarRota() {
  try {
    const response = await fetch('http://localhost:3000/api/produtos/upload-foto', {
      method: 'OPTIONS'
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testarRota();
