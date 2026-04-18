const fs = require('fs');
let sponsor = fs.readFileSync('Sponsor/The Main Page/sponsor_messages.html', 'utf8');

sponsor = sponsor.replace(
  `if (done === total) {`,
  `if (done === total) {
          const act = document.getElementById('approve-actions-' + threadId);
          if (act) { act.style.opacity = '1'; act.style.pointerEvents = 'auto'; }`
);

fs.writeFileSync('Sponsor/The Main Page/sponsor_messages.html', sponsor);
console.log('Fixed onAllTasksDone button enable');