const {GoogleAuth}=require('google-auth-library');
const path=require('path');
const WS='accounts/6343431875/containers/245865019/workspaces/12';
async function token(){
  const auth=new GoogleAuth({
    keyFile:path.join(__dirname,'..','secrets','gtm-service-account.json'),
    scopes:[
      'https://www.googleapis.com/auth/tagmanager.edit.containers',
      'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
      'https://www.googleapis.com/auth/tagmanager.publish'
    ]
  });
  const c=await auth.getClient();
  return (await c.getAccessToken()).token;
}
async function api(p,m='GET',b){
  const t=await token();
  const r=await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${p}`,{
    method:m,
    headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},
    body:b?JSON.stringify(b):undefined
  });
  const text=await r.text();
  let j={}; try{j=text?JSON.parse(text):{}}catch{j={raw:text}};
  if(!r.ok) throw new Error(`${m} ${p} -> HTTP ${r.status}: ${JSON.stringify(j)}`);
  return j;
}
(async()=>{
  const v=await api(`${WS}:create_version`,'POST',{name:'Publish scroll/timer/internal nav from workspace 12'});
  console.log(JSON.stringify(v,null,2));
  const cv=v.containerVersion?.path;
  if(!cv) throw new Error('No containerVersion path');
  const p=await api(`${cv}:publish`,'POST');
  console.log(JSON.stringify(p,null,2));
})();
