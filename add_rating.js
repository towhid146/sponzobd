const fs = require('fs');

const ratingHtml = `            '<div style="margin-bottom:12px;margin-top:12px;display:flex;flex-direction:column;gap:4px;">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx2);">Submit your rating</div>' +
            '<div style="display:flex;gap:3px;font-size:24px;color:#ddd;cursor:pointer;">' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'">★</span>' +
            '</div>' +
            '</div>' +`;

let sponsee = fs.readFileSync('Sponsee/The Main Page/messages.html', 'utf8');
let sponsor = fs.readFileSync('Sponsor/The Main Page/sponsor_messages.html', 'utf8');

// For sponsee
sponsee = sponsee.replace(
  `'<div class="cc-actions"><button class="btn-g" onclick="submitRating()">Rate & complete deal</button></div>' +`,
  ratingHtml + `\n            '<div class="cc-actions"><button class="btn-g" onclick="submitRating()">Rate & complete deal</button></div>' +`
);

// For sponsor
sponsor = sponsor.replace(
  `'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone(\\'\${threadId}\\'==="la"?"la":\\'la\\')">Approve all & proceed</button></div>' +`,
  ratingHtml + `\n            '<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone(\\'\${threadId}\\')">Rate & complete deal</button></div>' +`
);

fs.writeFileSync('Sponsee/The Main Page/messages.html', sponsee);
fs.writeFileSync('Sponsor/The Main Page/sponsor_messages.html', sponsor);

console.log("Added rating system and button text updated.");
