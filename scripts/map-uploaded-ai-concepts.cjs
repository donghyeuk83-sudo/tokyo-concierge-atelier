const fs=require('node:fs');
const mapping={
 r06:'seirinkan.webp',r45:'zauo-shibuya.webp',r48:'ninja-experience.webp',
 w05:'onsen-openair.webp',w06:'onsen-openair.webp',
 a26:'tea-ceremony.webp',a27:'matcha-experience.webp',
 a29:'samurai-experience.webp',a30:'outdoor-activity.webp',
 a32:'kimono-experience.webp',a37:'calligraphy-experience.webp',
 a38:'sushi-making.webp',a39:'samurai-experience.webp',
 r49:'omoide-yokocho.webp',r50:'tokyo-tower-night.webp',
 r51:'hamarikyu-gardens.webp',r52:'matcha-experience.webp'
};
let html=fs.readFileSync('index.html','utf8'),count=0;
for(const [id,file] of Object.entries(mapping)){
 const asset='assets/photos/'+file;
 if(!fs.existsSync(asset))continue;
 const begin=html.indexOf('const AI_VENUE_VISUALS={'),end=html.indexOf('};',begin);
 if(begin<0||end<0)throw Error('Missing AI image registry');
 const before=html.slice(begin,end);
 const re=new RegExp('\\b'+id+':\\{url:\\x27[^\\x27]+\\x27\\}');
 const value=id+':{url:\x27'+asset+'\x27}';
 if(re.test(before))html=html.slice(0,begin)+before.replace(re,value)+html.slice(end);
 else html=html.slice(0,begin+'const AI_VENUE_VISUALS={'.length)+value+','+html.slice(begin+'const AI_VENUE_VISUALS={'.length);
 count++;
}
fs.writeFileSync('index.html',html);
console.log('Mapped '+count+' AI image cards from uploaded assets');
