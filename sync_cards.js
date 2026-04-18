const fs = require('fs');

let sponsee = fs.readFileSync('Sponsee/The Main Page/messages.html', 'utf8');

const startKey = '\'<div class=\"content-card\" style=\"max-width:85%;\">\';';
let sIdx = sponsee.indexOf('\'<div class=\"content-card\" style=\"max-width:85%;\">\';');
if (sIdx === -1) {
    sIdx = sponsee.indexOf('\'<div class=\"content-card\" style=\"max-width:85%;\">\' +');
}

let eIdx = sponsee.indexOf('\'<div class=\"msg-t\">Just now · Platform</div>\' +', sIdx);
if (eIdx === -1) {
    eIdx = sponsee.indexOf('\'<div class=\"msg-t\">Just now · Platform</div>\'', sIdx);
}

if (sIdx === -1 || eIdx === -1) {
    console.error('Could not find Sponsee card bounds', sIdx, eIdx);
    process.exit(1);
}

let sponseeCard = sponsee.substring(sIdx, eIdx);

let sponsor = fs.readFileSync('Sponsor/The Main Page/sponsor_messages.html', 'utf8');

let spStart = sponsor.indexOf('\'<div class=\"content-card\" style=\"max-width:80%;\">\' +');
let spEnd = sponsor.indexOf('\'<div class=\"msg-t\">Just now · Platform</div></div>\';', spStart);
if(spStart === -1 || spEnd === -1) {
    console.error('Could not find Sponsor card bounds', spStart, spEnd);
    process.exit(1);
}

let newSponsorCard = sponseeCard.replace('max-width:85%', 'max-width:80%');

// The sponsor card is basically a replacment for the existing single block
let newSponsorHtml = sponsor.substring(0, spStart) + newSponsorCard + '\n          \'<div class=\"msg-t\">Just now · Platform</div></div>\';' + sponsor.substring(spEnd + ('\'<div class=\"msg-t\">Just now · Platform</div></div>\';').length);

fs.writeFileSync('Sponsor/The Main Page/sponsor_messages.html', newSponsorHtml);
console.log('Successfully synced styling of content-card from Sponsee to Sponsor');
