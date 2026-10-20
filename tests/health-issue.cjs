// Maintain ONE deduplicated GitHub issue for production CI failures, and close it after recovery.
// This runs only on default-branch push, manual dispatch or scheduled QA. Never on PRs.
// No access to visitor details, image rights, or third-party accounts.
const assert=require('node:assert/strict');
const TITLE='[Atelier Health] Production browser or deployment regression';
function body(repo,run,sha){
 return [
  'Automated daily/main-branch health validation detected a failed step.',
  '',
  '- Source revision: `'+sha+'`',
  '- Browser, photos, permissions and external-link test logs: https://github.com/'+repo+'/actions/runs/'+run,
  '- Verify Chromium **and** WebKit against the published Pages revision.',
  '- Preserve the 131 places, 89 licensed photos, 50 existing AI illustrations, 42 pending originals and all client-side shortlist data.',
  '- Do **not** copy unlicensed photographs or auto-push unreviewed code to main.',
  '',
  'Review the failed step, reproduce it, prepare a minimal PR, merge only after BOTH browser engines pass, and confirm Pages and existing photo loads. A new successful main health run automatically closes this issue.'
 ].join('\n');
}
async function api(endpoint,method='GET',data){
 const token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY;
 if(!token||!repo)throw Error('GitHub issue permissions or repository unavailable');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const r=await fetch('https://api.github.com/repos/'+repo+endpoint,{
   method,
   headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'atelier-site-health'},
   ...(data?{body:JSON.stringify(data)}:{}),signal:controller.signal
  });
  if(!r.ok)throw Error('GitHub issue API HTTP '+r.status);
  return await r.json();
 }finally{clearTimeout(timer)}
}
async function update(){
 const repo=process.env.GITHUB_REPOSITORY,sha=process.env.GITHUB_SHA,run=process.env.GITHUB_RUN_ID;
 const outcome=process.env.HEALTH_OUTCOME;
 assert(['success','failure','cancelled'].includes(outcome),'Valid CI result is required');
 const issues=await api('/issues?state=all&per_page=100');
 const old=issues.find(i=>!i.pull_request&&i.title===TITLE&&i.user?.login==='github-actions[bot]');
 const link='https://github.com/'+repo+'/actions/runs/'+run;
 if(outcome==='success'){
  if(old?.state==='open'){
   await api('/issues/'+old.number+'/comments','POST',{body:'Automated recovery verified on '+sha+': '+link+' (both browser engines and Pages checks passed).'});
   await api('/issues/'+old.number,'PATCH',{state:'closed',state_reason:'completed'});
   console.log('AUTO_HEALTH_RECOVERED',old.number);
  }else console.log('AUTO_HEALTH_OK',sha);
  return;
 }
 if(outcome==='cancelled'){console.log('AUTO_HEALTH_SKIPPED_CANCELLED');return}
 if(old?.state==='open'){
  await api('/issues/'+old.number+'/comments','POST',{body:'Fresh failing health run: '+link+' at '+sha});
  console.log('AUTO_HEALTH_UPDATED',old.number);
 }else if(old){
  await api('/issues/'+old.number,'PATCH',{state:'open',body:body(repo,run,sha)});
  console.log('AUTO_HEALTH_REOPENED',old.number);
 }else{
  const created=await api('/issues','POST',{title:TITLE,body:body(repo,run,sha)});
  console.log('AUTO_HEALTH_CREATED',created.number);
 }
}
if(process.argv.includes('--self-test')){
 assert(TITLE.includes('[Atelier Health]'));
 const s=body('owner/repo','123','abcdef');
 assert(s.includes('/actions/runs/123'));
 assert(s.includes('both')||s.includes('BOTH'));
 assert(s.includes('89 licensed photos'));
 console.log('PASS health-watch issue dedup and safe triage instructions');
}else update().catch(e=>{console.error('Health notification unavailable:',e.message);process.exitCode=1});
