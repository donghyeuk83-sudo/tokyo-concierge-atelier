// Keep five bot-blocked/upstream-error links anchored to the original venue identity.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {catalogueSection:section,sources,verifyExtractedSnapshot}=require('./atelier-source-registry.cjs');
verifyExtractedSnapshot();
assert(section,'Read catalog venue records');
const rows=[...section.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
assert.equal(rows.length,131,'Catalogue count unchanged');
const expected={
 r06:['Seirinkan','https://tabelog.com/tokyo/A1317/A131701/13003188/'],
 r11:['Yoroniku','https://selection.tabelog.com/tokyo/A1306/A130602/13042979/party/'],
 r38:['Sushi Somei','https://tabelog.com/tokyo/A1303/A130302/13253712/'],
 r39:['Sushi Yuji','https://tabelog.com/tokyo/A1303/A130302/13310768/'],
 w02:['Spa LaQua','https://en.www.laqua.jp/spa/']
};
for(const [id,[name,url]] of Object.entries(expected)){
 const row=rows.find(r=>r[0]===id);
 assert(row,id+' is present');
 assert.equal(row[2],name,'Preserve exact venue identity '+id);
 assert.equal(row[6],url,'Do not overwrite a branch-specific URL solely on bot response '+id);
}
const checker=fs.readFileSync('tests/check-venue-links.cjs','utf8');
assert(checker.includes("res.status>=500?'UPSTREAM_UNAVAILABLE':'HTTP_ERROR'"),'HTTP 5xx and actual bad path are distinct');
assert(checker.includes("res.status===403||res.status===429?'ACCESS_RESTRICTED'"),'403/429 not proof of closure');
assert(checker.includes('HEAD')&&checker.includes('GET'),'HEAD false negatives checked with GET');
assert(checker.includes('reviewedUrls.get(id)||reference_url'),'Audit actual reviewed source URL shown on guest card, not only the original catalogue link');
assert(checker.includes("'reference_url','reviewed_url_used'"),'Retain original reference and source-override provenance for manual review');
// The exact Meguro studio URL is an important example of an on-card source
// that is different from the static catalogue's original generic reference.
const verified=sources.slice(sources.indexOf('const VERIFIED_SOURCES='));
const studioReviewed=[...verified.matchAll(/(?:^|\n)a32:\{url:"([^"]+)",checked:"([^"]+)"/gm)].at(-1);
assert(studioReviewed&&studioReviewed[1]==='https://kimono-wa.com/en/access.html','Guest-facing Meguro source remains the correct official access link');
console.log('PASS official external link audit: five exact venue identities preserved, four bot access cases and server 503 classified separately');
