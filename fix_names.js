const fs = require('fs');

function fix(fname) {
    let content = fs.readFileSync(fname, 'utf8');
    content = content.replace(/Terms proposed by Towhidul Islam/g, 'Terms proposed by GreenFresh BD');
    content = content.replace(/Terms proposed by Towhidul Akter/g, 'Terms proposed by Towhidul Islam');
    content = content.replace(/Towhidul Akter/g, 'Towhidul Islam');
    content = content.replace(/Towhidul\\'s/g, "Towhidul's");
    fs.writeFileSync(fname, content);
}

fix('Sponsee/The Main Page/messages.html');
fix('Sponsor/The Main Page/sponsor_messages.html');
console.log('Fixed names');