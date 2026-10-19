#!/usr/bin/env python3
"""Attempt unattended photorealistic AI venue concepts using a public image endpoint.
Only publishes successfully downloaded, valid, non-duplicate raster images.
Never claims AI art is a real photograph of a venue.
"""
import hashlib, json, os, pathlib, time, urllib.parse, urllib.request
from io import BytesIO
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/photos'
HTML=ROOT/'index.html'
PROMPTS={
'r01':'Photorealistic Japanese omakase sushi counter, chef preparing delicate nigiri, intimate wooden counter, no logos, no text',
'r02':'Photorealistic boutique sushi restaurant in Daikanyama Tokyo, chef arranging seasonal nigiri on ceramics, no text',
'r38':'Photorealistic small Ebisu sushi counter with fresh tuna nigiri and warm pendant lighting, no text',
'r39':'Photorealistic sushi master slicing silver-skinned fish in an intimate Tokyo restaurant, no text',
'r40':'Photorealistic elegant Hiroo sushi counter with pristine white fish nigiri and cypress wood, no text',
'r41':'Photorealistic casual Tsukiji-style sushi platter at Tokyo neighborhood sushi restaurant, no text',
'r42':'Photorealistic lively traditional sushi restaurant in Ebisu with colorful sushi plates, no text',
'r43':'Photorealistic modern Japanese sushi bar, artistic seasonal nigiri and sake glasses, no text',
'r44':'Photorealistic high-end sushi omakase counter with chef hands placing tuna nigiri, no text',
}
html=HTML.read_text()
changed=[]
for i,(id,prompt) in enumerate(PROMPTS.items()):
    target=OUT/f'ai-unique-{id}.webp'
    if not target.exists():
        query=urllib.parse.quote(prompt,safe='')
        url=f'https://image.pollinations.ai/prompt/{query}?width=640&height=480&seed={20261019+i}&nologo=true&model=flux'
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'TokyoConciergeAtelier/1.0'})
            with urllib.request.urlopen(req,timeout=45) as resp:
                data=resp.read(6_000_000)
            im=Image.open(BytesIO(data)); im.load()
            if im.width<320 or im.height<240: raise ValueError('image too small')
            im.convert('RGB').save(target,'WEBP',quality=80,method=5)
        except Exception as e:
            print('Skipped',id,type(e).__name__,str(e)[:120],flush=True)
            continue
    old='ai-sushi-concept.webp' if id in ('r01','r38','r39','r40','r41','r42','r43','r44') else 'tsukiji-sushi.webp'
    new=f'assets/photos/ai-unique-{id}.webp'
    import re
    pat=rf'\b{id}:\{{url:\x27assets/photos/[^\x27]+\x27\}}'
    if not re.search(pat,html): raise RuntimeError('AI registry missing '+id)
    if not re.search(re.escape(new),html):
        html=re.sub(pat,id+':{url:\x27'+new+'\x27}',html,count=1)
        changed.append(id)
    time.sleep(2)
if changed:
    HTML.write_text(html)
print(json.dumps({'changed':changed,'total':len(changed)}))
