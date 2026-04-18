const fs = require('fs');

let sponsee = fs.readFileSync('Sponsee/The Main Page/messages.html', 'utf8');
let sponsor = fs.readFileSync('Sponsor/The Main Page/sponsor_messages.html', 'utf8');

// Strip out the broken rating blocks completely from the strings they were injected before
const badSponseeBlock1 = '            \'<div style="margin-bottom:12px;margin-top:12px;display:flex;flex-direction:column;gap:4px;">\' +\n            \'<div style="font-size:11px;font-weight:600;color:var(--tx2);">Submit your rating</div>\' +\n            \'<div style="display:flex;gap:3px;font-size:24px;color:#ddd;cursor:pointer;">\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'</div>\' +\n            \'</div>\' +\\n';
const badSponseeBlock2 = '            \'<div style="margin-bottom:12px;margin-top:12px;display:flex;flex-direction:column;gap:4px;">\' +\n            \'<div style="font-size:11px;font-weight:600;color:var(--tx2);">Submit your rating</div>\' +\n            \'<div style="display:flex;gap:3px;font-size:24px;color:#ddd;cursor:pointer;">\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'<span onclick="this.parentNode.style.color=\\\'#ffc107\\\'">★</span>\' +\n            \'</div>\' +\n            \'</div>\' +';

// Just wipe anything matching that chunk of lines. Standard JS regex to wipe our bad injections.
sponsee = sponsee.replace(/            '<div style="margin-bottom:12px[\s\S]*?<\/div>' \+/g, '');
sponsor = sponsor.replace(/            '<div style="margin-bottom:12px[\s\S]*?<\/div>' \+/g, '');

// Also reset the cc-actions lines to original before we re-inject carefully.
sponsee = sponsee.replace(/\\n            '<div class="cc-actions"><button class="btn-g" onclick="submitRating\(\)">Rate & complete deal<\/button><\/div>' \+/g, `'<div class="cc-actions"><button class="btn-g" onclick="submitRatingMega(\\'' + threadId + '\\')">Rate & complete deal</button></div>' +`);
sponsee = sponsee.replace(/'<div class="cc-actions"><button class="btn-g" onclick="submitRating\(\)">Rate & complete deal<\/button><\/div>' \+/g, `'<div class="cc-actions" id="sp-rate-\${threadId}"><button class="btn-g" onclick="submitRatingMega(\\'\${threadId}\\')">Rate & complete deal</button></div>' +`);

sponsor = sponsor.replace(/\\n            '<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone\(\\'\${threadId}\\'==="la"\?"la":\\'la\\'\)">Rate & complete deal<\/button><\/div>' \+/g, `'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone(\\'\${threadId}\\');">Approve all & proceed</button></div>' +`);
sponsor = sponsor.replace(/'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone\(\\'\${threadId}\\'==="la"\?"la":\\'la\\'\)">Approve all & proceed<\/button><\/div>' \+/g, `'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone(\\'\${threadId}\\')">Approve all & proceed</button></div>' +`);


// Now let's inject a proper rating UI that depends on a unified `setRatingMega(thread, rating)` function
const properRatingHtml = `            '<div id="rating-block-\${threadId}" style="margin-top:12px;display:none;flex-direction:column;gap:8px;">' +
              '<div style="font-size:11px;font-weight:600;color:var(--tx2);">Review & Rating (Optional)</div>' +
              '<div style="display:flex;gap:3px;font-size:24px;color:#ddd;cursor:pointer;" id="stars-\${threadId}">' +
                '<span onclick="setRatingMega(\\'' + threadId + '\\', 1)">★</span>' +
                '<span onclick="setRatingMega(\\'' + threadId + '\\', 2)">★</span>' +
                '<span onclick="setRatingMega(\\'' + threadId + '\\', 3)">★</span>' +
                '<span onclick="setRatingMega(\\'' + threadId + '\\', 4)">★</span>' +
                '<span onclick="setRatingMega(\\'' + threadId + '\\', 5)">★</span>' +
              '</div>' +
              '<textarea id="review-text-\${threadId}" placeholder="Leave a review for their profile..." style="width:100%;height:60px;background:var(--srf);border:1px solid var(--bdr-m);border-radius:4px;padding:8px;font-size:11px;color:var(--tx1);box-sizing:border-box;resize:none;font-family:inherit;margin-top:4px;"></textarea>' +
              '<button class="btn-g" onclick="submitRatingMega(\\'' + threadId + '\\')">Rate & complete deal</button>' +
            '</div>' +`;


sponsee = sponsee.replace(
  `'<div class="cc-actions" id="sp-rate-\${threadId}"><button class="btn-g" onclick="submitRatingMega(\\'\${threadId}\\')">Rate & complete deal</button></div>' +`,
  `'<div class="cc-actions" id="sp-rate-\${threadId}"><button class="btn-g" onclick="showRatingBlockMega(\\'\${threadId}\\')">Rate & complete deal</button></div>' + \n` + properRatingHtml
);

sponsor = sponsor.replace(
  `'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="onAllTasksDone(\\'\${threadId}\\')">Approve all & proceed</button></div>' +`,
  `'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="showRatingBlockMega(\\'\${threadId}\\')">Approve all & proceed (Rate)</button></div>' + \n` + properRatingHtml
);


fs.writeFileSync('Sponsee/The Main Page/messages.html', sponsee);
fs.writeFileSync('Sponsor/The Main Page/sponsor_messages.html', sponsor);
console.log("Rewritten rating injection logic complete")
