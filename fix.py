import re

def fix_sponsee():
    with open('Sponsee/The Main Page/messages.html', 'r', encoding='utf-8') as f:
        content = f.read()

    new_func = '''function appendInlineGeneratedCardSponsee(threadId) {
        const thread = document.getElementById(\	hread-\\);
        if (!thread) return false;
        const deal = getSharedDeal(threadId);
        if (!deal || !deal.termsAccepted) return false; 

        const key = \\-mega-pipeline\;
        let wrap = thread.querySelector(\[data-inline-card='\']\);
        let created = false;
        if (!wrap) {
          wrap = document.createElement("div");
          wrap.className = "msg-wrap";
          wrap.setAttribute("data-inline-card", key);
          thread.appendChild(wrap);
          created = true;
        }

        let html = '<div class="m-av" style="background: var(--pur-l); color: var(--pur-t)">SB</div>' +
            '<div style="display:flex;flex-direction:column;gap:3px;">' +
            '<div class="content-card" style="max-width:85%;">';

        // SECTION 1: TERMS COMPARISON
        html += '<div style="padding:12px;border-bottom:1px solid var(--bdr);">' +
            '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">' +
            '<div style="flex:1;padding:10px;background:var(--srf2);border-radius:var(--r2);border-left:3px solid var(--grn-m);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx1);margin-bottom:8px;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".6"><rect x="2" y="2" width="8" height="8" rx="1"></rect><path d="M3.5 6h5M3.5 4h5M3.5 8h3"></path></svg>Terms proposed by Towhidul Islam</div>' +
            '<div style="font-size:10px;color:var(--tx2);line-height:1.5;">' +
            '<div style="margin-bottom:4px;"><strong>Rate</strong> ৳35,000</div>' +
            '<div style="margin-bottom:4px;"><strong>Deliverables</strong> 2 IG reels \\u00B7 3 stories \\u00B7 1 YouTube short</div>' +
            '<div style="margin-bottom:4px;"><strong>Deadline</strong> March 22, 2025</div>' +
            '<div style="margin-bottom:4px;"><strong>Revision rounds</strong> 1 included \\u00B7 7-day review</div>' +
            "<div><strong>Usage rights</strong> 3 months \\u00B7 Bangladesh</div>" +
            "</div>' +
            '<div style="font-size:10px;color:var(--amb-t);margin-top:8px;font-weight:600;">Awaiting your response</div>' +
            "</div>' +
            '<div style="flex:0 0 24px;display:flex;align-items:center;justify-content:center;margin-top:16px;"><svg width="20" height="3" viewBox="0 0 20 3" fill="none" stroke="var(--tx3)" stroke-width="1.5"><line x1="0" y1="1.5" x2="20" y2="1.5"></line><polygon points="20,1.5 16,0 16,3" fill="var(--tx3)"></polygon></svg></div>' +
            '<div style="flex:1;padding:10px;background:var(--srf2);border-radius:var(--r2);border-left:3px solid var(--grn);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx1);margin-bottom:8px;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".6"><rect x="2" y="2" width="8" height="8" rx="1"></rect><path d="M3.5 6h5M3.5 4h5M3.5 8h3"></path></svg>Terms proposed by Lamia Akter</div>' +
            '<div style="font-size:10px;color:var(--tx2);line-height:1.5;">' +
            '<div style="margin-bottom:4px;"><strong>Rate</strong> ৳35,000</div>' +
            '<div style="margin-bottom:4px;"><strong>Deliverables</strong> 2 IG reels \\u00B7 3 stories \\u00B7 1 YouTube short</div>' +
            '<div style="margin-bottom:4px;"><strong>Deadline</strong> March 22, 2025</div>' +
            '<div style="margin-bottom:4px;"><strong>Revision rounds</strong> 1 included \\u00B7 7-day review window</div>' +
            "<div><strong>Usage rights</strong> 3 months \\u00B7 Bangladesh only</div>" +
            "</div>' +
            '<div style="font-size:10px;color:var(--grn-3);margin-top:8px;font-weight:600;">\\u2713 Accepted by sponsor</div>' +
            "</div>' +
            "</div>' +
            "</div>';

        // SECTION 2: CONTENT SUBMITTED
        if (deal.contentSubmitted) {
            html += '<div style="padding:12px;border-bottom:1px solid var(--bdr);">' +
            '<div class="cc-hd"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3B6D11" stroke-width="1.3"><rect x="1.5" y="1.5" width="9" height="9" rx="1"></rect><path d="M3.5 4h5M3.5 6.5h5M3.5 9h3"></path></svg>Content submitted \\u00B7 3 of 3 deliverables</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram reel \\u00B7 48 sec</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram story 1</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram story 2</div>' +
            '<a class="cc-link" href="#" onclick="return false;"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 2H2v8h8V7M7 2h3v3M5 7l5-5"></path></svg>View content files \\u00B7 Google Drive</a>' +
            '<div class="cc-note">Reel features the supplement naturally in the morning routine. Both stories are lifestyle clips. Brand tag @greenfreshbd and hashtags included.</div>' +
            "</div>";
        }

        // SECTION 3: REVIEW AND APPROVAL
        if (deal.dealCriteriaApproved) {
            html += '<div style="padding:12px;">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx1);margin-bottom:8px;">Final approval & review</div>' +
            '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
            '<div style="flex:1;font-size:10px;padding:8px;background:var(--grn-l);border-radius:var(--r1);border-left:2px solid var(--grn);">' +
            '<div style="font-weight:600;color:var(--grn-3);margin-bottom:2px;">\\u2713 Approved \\u00B7 Feb 22</div>' +
            '<div style="color:var(--tx2);">Content meets all criteria and deliverables</div>' +
            "</div>' +
            "</div>' +
            (deal.escrowPassedByAuthority ? '<div class="cc-actions"><button class="btn-g" onclick="submitRating()">Rate & complete deal</button></div>' : '<div style="font-size:11px;color:var(--tx3);">Waiting for platform escrow pass</div>') +
            "</div>";
        }

        html += "</div></div>";
        wrap.innerHTML = html;
        thread.scrollTop = thread.scrollHeight;
        return created;
      }
'''
    
    # replace appendInlineGeneratedCardSponsee
    content = re.sub(r'function appendInlineGeneratedCardSponsee\(threadId, cardType\) \{.*?(?=\n      function generateCriteriaCardSponsee)', new_func, content, flags=re.DOTALL)
    
    # replace updateQA to inject card
    content = re.sub(r'function updateQA\(id\) \{\s*const row = document\.getElementById\("qa-row"\);', r'function updateQA(id) {\n        appendInlineGeneratedCardSponsee(id);\n        const row = document.getElementById("qa-row");', content)

    # remove manual buttons
    content = re.sub(r'\'<span style="font-size:12px;color:var\(--grn-3\);padding:4px 0;font-weight:700;">[^<]*?generate[^<]*?</span><button class="qa qa-g"[^>]*?>[^<]*?</button>\';', "''", content)
    content = re.sub(r'\'<span style="font-size:12px;color:var\(--grn-3\);padding:4px 0;font-weight:700;">[^<]*?generate.*?</button>\';', "''", content)

    with open('Sponsee/The Main Page/messages.html', 'w', encoding='utf-8') as f:
        f.write(content)

def fix_sponsor():
    with open('Sponsor/The Main Page/sponsor_messages.html', 'r', encoding='utf-8') as f:
        content = f.read()

    new_func = '''function appendInlineGeneratedCardSponsor(threadId) {
        const thread = document.getElementById(\	hread-\\);
        if (!thread) return false;
        const deal = getSharedDeal(threadId);
        if (!deal || !deal.termsAccepted) return false; 

        const key = \\-mega-pipeline\;
        let wrap = thread.querySelector(\[data-inline-card='\']\);
        let created = false;
        if (!wrap) {
          wrap = document.createElement("div");
          wrap.className = "msg-wrap";
          wrap.setAttribute("data-inline-card", key);
          thread.appendChild(wrap);
          created = true;
        }

        let html = '<div class="m-av" style="background: var(--pur-l); color: var(--pur-t)">SB</div>' +
            '<div style="display:flex;flex-direction:column;gap:3px;">' +
            '<div class="content-card" style="max-width:85%;">';

        // SECTION 1: TERMS COMPARISON
        html += '<div style="padding:12px;border-bottom:1px solid var(--bdr);">' +
            '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">' +
            '<div style="flex:1;padding:10px;background:var(--srf2);border-radius:var(--r2);border-left:3px solid var(--grn-m);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx1);margin-bottom:8px;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".6"><rect x="2" y="2" width="8" height="8" rx="1"></rect><path d="M3.5 6h5M3.5 4h5M3.5 8h3"></path></svg>Terms proposed by Towhidul Islam</div>' +
            '<div style="font-size:10px;color:var(--tx2);line-height:1.5;">' +
            '<div style="margin-bottom:4px;"><strong>Rate</strong> ৳35,000</div>' +
            '<div style="margin-bottom:4px;"><strong>Deliverables</strong> 2 IG reels \\u00B7 3 stories \\u00B7 1 YouTube short</div>' +
            '<div style="margin-bottom:4px;"><strong>Deadline</strong> March 22, 2025</div>' +
            '<div style="margin-bottom:4px;"><strong>Revision rounds</strong> 1 included \\u00B7 7-day review</div>' +
            "<div><strong>Usage rights</strong> 3 months \\u00B7 Bangladesh</div>" +
            "</div>' +
            '<div style="font-size:10px;color:var(--amb-t);margin-top:8px;font-weight:600;">Awaiting your response</div>' +
            "</div>' +
            '<div style="flex:0 0 24px;display:flex;align-items:center;justify-content:center;margin-top:16px;"><svg width="20" height="3" viewBox="0 0 20 3" fill="none" stroke="var(--tx3)" stroke-width="1.5"><line x1="0" y1="1.5" x2="20" y2="1.5"></line><polygon points="20,1.5 16,0 16,3" fill="var(--tx3)"></polygon></svg></div>' +
            '<div style="flex:1;padding:10px;background:var(--srf2);border-radius:var(--r2);border-left:3px solid var(--grn);">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx1);margin-bottom:8px;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".6"><rect x="2" y="2" width="8" height="8" rx="1"></rect><path d="M3.5 6h5M3.5 4h5M3.5 8h3"></path></svg>Terms proposed by Lamia Akter</div>' +
            '<div style="font-size:10px;color:var(--tx2);line-height:1.5;">' +
            '<div style="margin-bottom:4px;"><strong>Rate</strong> ৳35,000</div>' +
            '<div style="margin-bottom:4px;"><strong>Deliverables</strong> 2 IG reels \\u00B7 3 stories \\u00B7 1 YouTube short</div>' +
            '<div style="margin-bottom:4px;"><strong>Deadline</strong> March 22, 2025</div>' +
            '<div style="margin-bottom:4px;"><strong>Revision rounds</strong> 1 included \\u00B7 7-day review window</div>' +
            "<div><strong>Usage rights</strong> 3 months \\u00B7 Bangladesh only</div>" +
            "</div>' +
            '<div style="font-size:10px;color:var(--grn-3);margin-top:8px;font-weight:600;">\\u2713 Accepted by sponsor</div>' +
            "</div>' +
            "</div>' +
            "</div>';

        // SECTION 2: CONTENT SUBMITTED
        if (deal.contentSubmitted) {
            html += '<div style="padding:12px;border-bottom:1px solid var(--bdr);">' +
            '<div class="cc-hd"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3B6D11" stroke-width="1.3"><rect x="1.5" y="1.5" width="9" height="9" rx="1"></rect><path d="M3.5 4h5M3.5 6.5h5M3.5 9h3"></path></svg>Content submitted \\u00B7 3 of 3 deliverables</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram reel \\u00B7 48 sec</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram story 1</div>' +
            '<div class="cc-item"><svg viewBox="0 0 11 11" fill="none" width="11"><circle cx="5.5" cy="5.5" r="4.5" fill="#C0DD97"></circle><path d="M3 5.5l2 2L8.5 3" stroke="#27500A" stroke-width="1.3" stroke-linecap="round"></path></svg>Instagram story 2</div>' +
            '<a class="cc-link" href="#" onclick="return false;"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 2H2v8h8V7M7 2h3v3M5 7l5-5"></path></svg>View content files \\u00B7 Google Drive</a>' +
            '<div class="cc-note">Reel features the supplement naturally in the morning routine. Both stories are lifestyle clips. Brand tag @greenfreshbd and hashtags included.</div>' +
            "</div>";
        }

        // SECTION 3: REVIEW AND APPROVAL
        if (deal.dealCriteriaApproved) {
            html += '<div style="padding:12px;">' +
            '<div style="font-size:11px;font-weight:600;color:var(--tx1);margin-bottom:8px;">Final approval & review</div>' +
            '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
            '<div style="flex:1;font-size:10px;padding:8px;background:var(--grn-l);border-radius:var(--r1);border-left:2px solid var(--grn);">' +
            '<div style="font-weight:600;color:var(--grn-3);margin-bottom:2px;">\\u2713 You approved \\u00B7 Feb 22</div>' +
            '<div style="color:var(--tx2);">Content meets all criteria and deliverables</div>' +
            "</div>' +
            "</div>' +
            (deal.escrowPassedByAuthority ? '<div class="cc-actions"><button class="btn-g" onclick="submitRating()">Rate & complete deal</button></div>' : '<div style="font-size:11px;color:var(--tx3);">Waiting for platform escrow pass</div>') +
            "</div>";
        }

        html += "</div></div>";
        wrap.innerHTML = html;
        thread.scrollTop = thread.scrollHeight;
        return created;
      }
'''
    
    content = re.sub(r'function appendInlineGeneratedCardSponsor\(threadId, cardType\) \{.*?(?=\n      function generateCriteriaCardSponsor)', new_func, content, flags=re.DOTALL)
    
    content = re.sub(r'function updateQA\(id\) \{\s*const row = document\.getElementById\("qa-row"\);', r'function updateQA(id) {\n        appendInlineGeneratedCardSponsor(id);\n        const row = document.getElementById("qa-row");', content)

    # remove manual buttons from sponsor
    content = re.sub(r'\'<span style="font-size:12px;color:var\(--grn-3\);padding:4px 0;font-weight:700;">[^<]*?generate.*?</button>\';', "''", content)

    with open('Sponsor/The Main Page/sponsor_messages.html', 'w', encoding='utf-8') as f:
        f.write(content)

fix_sponsee()
fix_sponsor()