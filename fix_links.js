const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'fontend', 'src', 'components');
const target = 'http://localhost:5000';
const replacement = 'https://greencampus-backend-tu-f3a3bgbsa7d8aac7.southeastasia-01.azurewebsites.net';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(target)) {
        content = content.split(target).join(replacement);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${file}`);
      }
    }
  }
}

replaceInDir(directoryPath);
console.log('Xong!');
