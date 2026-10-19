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
MORE_PROMPTS={
'a30':'Asakusa Tokyo cultural activity workshop, Japanese lantern crafting and archery equipment',
'r47':'Traditional Japanese robatayaki restaurant in Roppongi, chef grilling skewers over charcoal at wooden counter',
'r48':'Ninja themed immersive Japanese restaurant with dramatic black and red interior',
'r49':'Nostalgic narrow Tokyo izakaya alley with lanterns and tiny yakitori shops at night',
'r50':'Elegant Tokyo dining with Tokyo Tower illuminated through large windows at night',
'r51':'Japanese garden restaurant beside a serene traditional pond and pine trees',
'r52':'Japanese matcha tea tasting in a minimalist Tokyo tea salon',
'w05':'Traditional Japanese open air onsen with steaming mineral water and natural stone bath',
'w06':'Modern Japanese onsen spa with private cedar soaking bath and garden view',
'a26':'Traditional Japanese tea ceremony in tatami room with tea whisk and matcha bowl',
'a27':'Hands on matcha whisking workshop in bright Tokyo tea studio',
'a28':'Japanese calligraphy class with ink brushes, rice paper and instructor hands',
'a29':'Samurai armor dressing experience in Japanese historical studio',
'a31':'Modern Tokyo Japanese tea tasting workshop with matcha and wagashi',
'a32':'Japanese kimono dressing studio with elegant colorful silk kimono on stands',
'a33':'Asakusa Sensoji temple cultural walking experience with red lantern and temple gate',
'a34':'Japanese samurai sword handling lesson in historical indoor dojo',
'a36':'Traditional Japanese samurai costume photography experience in Tokyo studio',
'a37':'Japanese brush calligraphy lesson at low wooden table in tatami studio',
'a38':'Japanese sushi making class with chef teaching hand pressed nigiri',
'a39':'Traditional Japanese tea ceremony with wagashi sweets and matcha',
'a40':'Sightseeing river cruise on Sumida River passing Tokyo bridges',
's15':'Ueno park Tokyo in spring with cherry blossoms and broad pedestrian paths',
'r45':'Japanese fishing restaurant with indoor fish pond and tables, lively Tokyo atmosphere',
'r03':'High end Tokyo tempura omakase restaurant with chef frying seasonal tempura at cedar counter',
'r04':'Elegant Nakameguro tempura kaiseki restaurant with golden tempura course and Japanese pottery',
'r05':'Refined Japanese tempura restaurant in Tokyo serving crisp shrimp and vegetable tempura',
'r06':'Authentic Neapolitan pizzeria in Tokyo with wood fired oven and blistered margherita pizza',
'r08':'Intimate Tokyo artisan pizzeria with rustic brick oven and fresh Neapolitan pizza',
'r09':'Elegant Ginza Tokyo restaurant interior with beautiful Japanese contemporary dining table',
'r11':'Luxury Ginza Japanese restaurant with sophisticated wood interior and seasonal tasting menu',
'r18':'Traditional Nihonbashi Tokyo Japanese dining room with exquisite seasonal cuisine',
'r21':'Modern Tokyo Italian restaurant serving fresh handmade pasta and elegant plated food',
'r28':'Small atmospheric Golden Gai Tokyo izakaya bar with lanterns and cozy wooden counter',
'r29':'Premium Japanese sushi omakase chef plating seasonal nigiri at intimate counter',
'r31':'Japanese sushi counter with carefully prepared toro tuna nigiri and ceramic sake cup',
'r32':'Tokyo sushi restaurant with chef serving fresh seasonal seafood nigiri on wooden counter',
'r33':'Elegant Japanese sushi bar with sea urchin and tuna nigiri served on black ceramics',
'r34':'Small Japanese sushi omakase restaurant with pristine white fish nigiri on hinoki wood',
'r36':'Japanese sushi restaurant interior with chef preparing nigiri under warm lighting',
'r37':'High end Tokyo sushi chef arranging seasonal nigiri on wooden counter',
}
PROMPTS.update({k:'Photorealistic editorial travel photography, '+v+', authentic details, natural light, no logos, no text, distinct composition' for k,v in MORE_PROMPTS.items()})
\nhtml=HTML.read_text()
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
    time.sleep(0.3)
if changed:
    HTML.write_text(html)
print(json.dumps({'changed':changed,'total':len(changed)}))
