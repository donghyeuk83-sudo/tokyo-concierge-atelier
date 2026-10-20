#!/usr/bin/env python3
"""Attempt unattended photorealistic AI venue concepts using a public image endpoint.
Only publishes successfully downloaded, valid, non-duplicate raster images.
Never claims AI art is a real photograph of a venue.
"""
import hashlib, json, os, pathlib, time, urllib.parse, urllib.request, random
from io import BytesIO
from PIL import Image, ImageEnhance, ImageOps
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/photos'
HTML=ROOT/'assets/atelier-media.js'
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
'r49':'Illustrative concept of a refined Japanese performance dining lounge in Shinbashi Grand Hammer, atmospheric lanterns, no real identifiable venue, no text',
'r50':'Illustrative concept of a sophisticated Ginza restaurant table with abstract immersive light reflections, do not reproduce or imitate teamLab artwork, no text',
'r51':'Illustrative concept inspired by Nihonbashi SUIGIAN cultural dining with a classical Noh stage and tatami seating, not a real site photograph',
'r52':'Japanese matcha tea tasting in a minimalist Tokyo tea salon',
'w05':'Traditional Japanese open air onsen with steaming mineral water and natural stone bath',
'w06':'Modern Japanese onsen spa with private cedar soaking bath and garden view',
'a26':'Traditional Japanese tea ceremony in tatami room with tea whisk and matcha bowl',
'a27':'Hands on matcha whisking workshop in bright Tokyo tea studio',
'a28':'Illustrative Asakusa Japanese indigo textile dye workshop with navy blue fabric and dipping vats, no logos or people',
'a29':'Illustrative indoor ninja trick-house experience in Shinjuku with hidden doors and shuriken-target props, no venue likeness claims',
'a31':'Illustrative Roppongi premium Japanese sake tasting counter with handcrafted sake vessels, no brand labels or actual studio likeness',
'a32':'Illustrative Kimono Photo Studio in the Meguro area, elegant traditional Uchikake fabric and portrait backdrop, not Asakusa',
'a33':'Asakusa Sensoji temple cultural walking experience with red lantern and temple gate',
'a34':'Illustrative Ginza sumo performance restaurant with a small exhibition dohyo and cultural theatre, no identifiable performers or original artwork',
'a36':'Illustrative Ginza sumo cultural event, demonstration ring and guest seating, no identifiable actual participants',
'a37':'Illustrative Tokyo traditional artisan cultural workshop with handmade craft objects, not a particular Wabunka partner venue',
'a38':'Illustrative Tokyo hands-on traditional culture class using ceramics and textiles, not an actual Deeper Japan workshop',
'a39':'Illustrative Japanese traditional crafts workshop with handmade crafting tools, location unspecified; avoid representing Kyoto facilities as Tokyo',
'a40':'Illustrative Tokyo sightseeing tour departure point with coach and city map, without depicting an exact Sunrise Tours itinerary',
's15':'Illustrative Ryogoku sumo memorabilia shop shelf with miniature ring figurines and souvenir textiles, not Ueno park',
'r45':'Japanese fishing restaurant with indoor fish pond and tables, lively Tokyo atmosphere',
'r03':'High end Tokyo tempura omakase restaurant with chef frying seasonal tempura at cedar counter',
'r04':'Elegant Nakameguro tempura kaiseki restaurant with golden tempura course and Japanese pottery',
'r05':'Refined Japanese tempura restaurant in Tokyo serving crisp shrimp and vegetable tempura',
'r06':'Authentic Neapolitan pizzeria in Tokyo with wood fired oven and blistered margherita pizza',
'r08':'Intimate Tokyo artisan pizzeria with rustic brick oven and fresh Neapolitan pizza',
'r09':'Illustrative Daikanyama Italian fine-dining restaurant with refined European tasting-course plating and leafy terrace',
'r11':'Illustrative Minami-Aoyama yakiniku restaurant counter with premium grilled beef, no sister-restaurant likeness',
'r18':'Illustrative contemporary French fine dining at a Marunouchi high-rise restaurant, meticulous French plating',
'r21':'Illustrative intimate Mandarin Oriental Tokyo 38th-floor pizza bar, chef preparing artisanal Neapolitan pizza at stone counter',
'r28':'Illustrative casual Tokyo dining experience in a neighborhood restaurant, no precise location or identity claims',
'r29':'Illustrative Nakameguro conveyor-belt sushi restaurant with simple nigiri plates, not a high-end omakase counter',
'r31':'Japanese sushi counter with carefully prepared toro tuna nigiri and ceramic sake cup',
'r32':'Tokyo sushi restaurant with chef serving fresh seasonal seafood nigiri on wooden counter',
'r33':'Elegant Japanese sushi bar with sea urchin and tuna nigiri served on black ceramics',
'r34':'Illustrative Harajuku Harakado tuna seafood counter, modern casual nigiri dining, not an unrelated omakase shop',
'r36':'Japanese sushi restaurant interior with chef preparing nigiri under warm lighting',
'r37':'Illustrative Oshiage two-storey conveyor-belt sushi family dining atmosphere near Tokyo Skytree, not a high-end omakase restaurant',
}
PROMPTS.update({k:'Illustrative editorial visual concept (NOT a verified photo of an actual venue), '+v+', soft natural light, no logos, no text, distinctive original composition' for k,v in MORE_PROMPTS.items()})
# Closed and invitation-only places must never be automatically given fictional real-venue photographs.
for blocked_id in ('r31','r52'):
    PROMPTS.pop(blocked_id, None)

html=HTML.read_text(encoding='utf-8')
changed=[]
failed=[]
attempted=0
MAX_NEW_PER_RUN=13
# Retry missing images first; never overwrite an already published unique concept.
existing_hashes={hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob('ai-unique-*.webp')}
for i,(id,prompt) in enumerate(sorted(PROMPTS.items(),key=lambda pair: (OUT/f'ai-unique-{pair[0]}.webp').exists())):
    target=OUT/f'ai-unique-{id}.webp'
    if not target.exists():
        if attempted>=MAX_NEW_PER_RUN: continue
        attempted+=1
        query=urllib.parse.quote(prompt,safe='')
        url=f'https://image.pollinations.ai/prompt/{query}?width=640&height=480&seed={20261019+i}&nologo=true&model=flux'
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'TokyoConciergeAtelier/1.0'})
            with urllib.request.urlopen(req,timeout=20) as resp:
                data=resp.read(6_000_000)
            im=Image.open(BytesIO(data)); im.load()
            if im.width<320 or im.height<240: raise ValueError('image too small')
            if im.format not in ('JPEG','PNG','WEBP'): raise ValueError('unsupported image format')
            im.convert('RGB').save(target,'WEBP',quality=80,method=5)
            fingerprint=hashlib.sha256(target.read_bytes()).hexdigest()
            if fingerprint in existing_hashes:
                target.unlink()
                raise ValueError('duplicate generated image')
            existing_hashes.add(fingerprint)
        except Exception as e:
            if target.exists(): target.unlink()
            print('AI provider failed',id,type(e).__name__,str(e)[:100],flush=True)
            # Do not substitute another venue's image or a recolored crop.
            failed.append(id)
            continue
    if not target.exists() or target.stat().st_size < 1500:
        failed.append(id)
        print('Invalid output skipped',id,flush=True)
        if target.exists(): target.unlink()
        continue
    try:
        with Image.open(target) as check:
            check.verify()
    except Exception as e:
        failed.append(id)
        print('Corrupt WebP skipped',id,str(e)[:100],flush=True)
        target.unlink(missing_ok=True)
        continue
    new=f'assets/photos/ai-unique-{id}.webp'
    import re
    pat=rf'\b{id}:\{{url:\x27assets/photos/[^\x27]+\x27\}}'
    if not re.search(pat,html): raise RuntimeError('AI registry missing '+id)
    if not re.search(re.escape(new),html):
        html=re.sub(pat,id+':{url:\x27'+new+'\x27}',html,count=1)
        changed.append(id)
    time.sleep(0.15)
if changed:
    HTML.write_text(html,encoding='utf-8')
print(json.dumps({'changed':changed,'total':len(changed),'failed':failed,'remaining':sum(not (OUT/f'ai-unique-{id}.webp').exists() for id in PROMPTS),'attempted':attempted},ensure_ascii=False))
