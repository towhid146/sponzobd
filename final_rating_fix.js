const fs = require('fs');

function addRatingLogic(fileTarget, isSponsor) {
    let html = fs.readFileSync(fileTarget, 'utf8');

    // 1. Ensure the rating block in the card has textarea for an optional review
    const ratingHtml = `
            '<div style="margin-bottom:12px;margin-top:12px;display:flex;flex-direction:column;gap:4px;">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx2);">Submit your rating</div>' +
            '<div style="display:flex;gap:3px;font-size:24px;color:#ddd;cursor:pointer;" id="star-rating-block">' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'; window.currentRating=1">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'; window.currentRating=2">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'; window.currentRating=3">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'; window.currentRating=4">★</span>' +
            '<span onclick="this.parentNode.style.color=\\'#ffc107\\'; window.currentRating=5">★</span>' +
            '</div>' +
            '<textarea id="optional-review" placeholder="Write an optional review..." style="margin-top:6px;padding:6px;border:1px solid var(--bdr);border-radius:4px;font-size:11px;"></textarea>' +
            '</div>' +
    `;

    // Overwrite any old cc-actions injection, or inject fresh
    if (html.includes('submitRating()')) {
        html = html.replace(/<div class="cc-actions"><button.*?submitRating\(\).*?<\/div>' \+/, ratingHtml + `'<div class="cc-actions"><button class="btn-g" onclick="submitFinalRating()">Rate & complete deal</button></div>' +`);
    } else {
        // Fallback replacement if it wasn't injected yet
        // For sponsee
        html = html.replace(/'<div class="cc-actions"><button class="btn-g" onclick="submitRating\(\)">Rate & complete deal<\/button><\/div>' \+/, ratingHtml + `'<div class="cc-actions"><button class="btn-g" onclick="submitFinalRating()">Rate & complete deal</button></div>' +`);
        
        // For sponsor
        html = html.replace(/'<div class="cc-actions" id="approve-actions-\${threadId}".*?<\/div>' \+/, ratingHtml + `'<div class="cc-actions" id="approve-actions-\${threadId}" style="opacity:0.5;pointer-events:none;"><button class="btn-g" onclick="submitFinalRating()">Rate & complete deal</button></div>' +`);
    }

    // Inject the actual JS logic just before </script>
    const jsLogic = `
      function submitFinalRating() {
         const rating = window.currentRating || 5; 
         const reviewText = document.getElementById('optional-review') ? document.getElementById('optional-review').value : "";
         
         // 1. Show Deal Done Message inline
         const thread = document.querySelector('.msg-thread.active');
         if(thread) {
            const card = document.createElement("div");
            card.className = "sys-ev";
            card.style.cssText = "background:var(--grn-l);border-color:var(--grn-m);max-width:420px;margin:0 auto;";
            card.innerHTML = '<div class="se-lbl" style="color:var(--grn-3);">🎉 Deal Done!</div>' +
                             '<div class="se-det" style="color:var(--grn-t);">Rating (' + rating + ' ★) ' + (reviewText ? 'and review ' : '') + 'were added successfully to the profile. Payment released.</div>' +
                             '<div class="se-t">Just now · Platform</div>';
            thread.appendChild(card);
            thread.scrollTop = thread.scrollHeight;
         }

         // 2. Hide or disable the rating block so it can't be clicked again
         const btn = document.querySelector('.cc-actions button');
         if(btn) btn.disabled = true;

         // 3. Save to localStorage profiles (Mock Backend)
         try {
            const tgtProfile = ${isSponsor ? "'sponsee_profile_ratings'" : "'sponsor_profile_ratings'"};
            let currentRatings = JSON.parse(localStorage.getItem(tgtProfile) || "[]");
            currentRatings.push({ rating: rating, review: reviewText, date: new Date().toISOString() });
            localStorage.setItem(tgtProfile, JSON.stringify(currentRatings));
         } catch(e) {}
         
         if(window.T) window.T("Deal completed. Added to profile!");
      }
    </script>
    `;

    html = html.replace(/<\/script>\s+<\/body>/i, jsLogic + "\n  </body>");
    fs.writeFileSync(fileTarget, html);
}

addRatingLogic('Sponsee/The Main Page/messages.html', false);
addRatingLogic('Sponsor/The Main Page/sponsor_messages.html', true);
console.log("Updated rating interfaces properly!");