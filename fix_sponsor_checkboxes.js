const fs = require('fs');

let sponsor = fs.readFileSync('Sponsor/The Main Page/sponsor_messages.html', 'utf8');

// Replace the hardcoded cc-item list with dynamic itemsHtml
let targetStr = `            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram reel · 48 sec</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram story 1</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram story 2</div>' +`;

if (sponsor.includes(targetStr)) {
  sponsor = sponsor.replace(targetStr, `            itemsHtml +`);
  sponsor = sponsor.replace(
    `'<div class="cc-hd"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3B6D11" stroke-width="1.3"><rect x="1.5" y="1.5" width="9" height="9" rx="1"></rect><path d="M3.5 4h5M3.5 6.5h5M3.5 9h3"></path></svg>Content submitted · 3 of 3 deliverables</div>' +`,
    `'<div class="cc-hd"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3B6D11" stroke-width="1.3"><rect x="1.5" y="1.5" width="9" height="9" rx="1"></rect><path d="M3.5 4h5M3.5 6.5h5M3.5 9h3"></path></svg>' + \`Deliverables to-do · 0 of \${deliverables.length} checked</div>\` + \`<div id="todo-progress-\${threadId}" style="height:4px;background:var(--bdr-m);border-radius:2px;margin-bottom:8px;"><div id="todo-bar-\${threadId}" style="height:4px;background:var(--grn);border-radius:2px;width:0%;transition:width 0.3s;"></div></div>\` +`
  );
  
  // also change the submitRating button for sponsor to be the review passing button!
  sponsor = sponsor.replace(
    `'<div class="cc-actions"><button class="btn-g" onclick="submitRating()">Rate & complete deal</button></div>' +`,
    `'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone(\\'\${threadId}\\'==="la"?"la":\\'la\\')">Approve all & proceed</button></div>' +`
  );
  
} else {
  console.log("Could not find hardcoded items to replace");
}

fs.writeFileSync('Sponsor/The Main Page/sponsor_messages.html', sponsor);
console.log("Fixed checkboxes and buttons!");
