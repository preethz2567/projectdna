const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://127.0.0.1:5002/index', {
      repository_id: '11111111-1111-1111-1111-111111111111',
      repo_data: {
        readme: 'Test README',
        folder_structure: [
          { name: 'app.js', path: 'src/app.js', type: 'file', size: 100, content: 'console.log("hello");' }
        ]
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error:', err.response ? err.response.data : err.message);
  }
}
test();
