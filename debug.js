const http = require('http');
const fs = require('fs');

http.get('http://localhost:5000/api/transactions/debug', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('d:\\CNTT4\\Đồ án\\GreenCampus_Project\\debug.json', data);
    console.log('Done');
  });
}).on('error', (err) => console.error(err));
