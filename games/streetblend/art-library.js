'use strict';

(() => {
const ART_LIBRARY = [
  {
    id:20684,
    title:'Paris Street; Rainy Day',
    artist:'Gustave Caillebotte',
    date:'1877',
    imageId:'f8fd76e9-c396-5678-36ed-6a348c904d27',
    imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg/1280px-Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg',
    imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg/1280px-Gustave_Caillebotte_-_Paris_Street%3B_Rainy_Day_-_Google_Art_Project.jpg',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Gustave_Caillebotte_-_Paris_Street;_Rainy_Day_-_Google_Art_Project.jpg',
    publicDomain:true
  },
  {
    id:27992,
    title:'A Sunday on La Grande Jatte — 1884',
    artist:'Georges Seurat',
    date:'1884–86, border added 1888–89',
    imageId:'2d484387-2509-5e8e-2c43-22f9981972eb',
    imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg/1280px-A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg',
    imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg/1280px-A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg',
    publicDomain:true
  },
  {
    id:16568,
    title:'Water Lilies',
    artist:'Claude Monet',
    date:'1906',
    imageId:'3c27b499-af56-f0d5-93b5-a7f2f1ad5813',
    imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
    imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg',
    publicDomain:true
  },
  {
    id:14655,
    title:'Two Sisters (On the Terrace)',
    artist:'Pierre-Auguste Renoir',
    date:'1881',
    imageId:'3a608f55-d76e-fa96-d0b1-0789fbc48f1e',
    imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Two_Sisters_%28On_the_Terrace%29.jpg/1920px-Two_Sisters_%28On_the_Terrace%29.jpg',
    imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Two_Sisters_%28On_the_Terrace%29.jpg/1920px-Two_Sisters_%28On_the_Terrace%29.jpg',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Two_Sisters_(On_the_Terrace).jpg',
    publicDomain:true
  },
  {
    id:111442,
    title:"The Child's Bath",
    artist:'Mary Cassatt',
    date:'1893',
    imageId:'3b885ae0-4d46-5fe4-d70a-00474827f02c',
    imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg/960px-Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg',
    imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg/960px-Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Mary_Cassatt_-_The_Child%27s_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg',
    publicDomain:true
  },
  {
    id:16571,
    title:'Arrival of the Normandy Train, Gare Saint-Lazare',
    artist:'Claude Monet',
    date:'1877',
    imageId:'0f1cc0e0-e42e-be16-3f71-2022da38cb93',
    imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg',
    imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Arrival_of_the_Normandy_Train%2C_Gare_Saint-Lazare_-_Google_Art_Project.jpg',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Arrival_of_the_Normandy_Train,_Gare_Saint-Lazare_-_Google_Art_Project.jpg',
    publicDomain:true
  },
  {
    id:28560,
    title:'The Bedroom',
    artist:'Vincent van Gogh',
    date:'1889',
    imageId:'6644829f-f292-c5c4-a73c-0356a6fdbf0d',
    imageUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg/1280px-Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg',
    imageLarge:'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg/1280px-Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_Bedroom_-_1926.417_-_Art_Institute_of_Chicago.jpg',
    publicDomain:true
  }
];

  const ART_CACHE_KEY='streetblend.commons.catalog.v3';
  const ART_CACHE_MAX_AGE=7*24*60*60*1000;
  const CATEGORY_LABELS={
    mixed:'Mixed Collection',
    impressionism:'Impressionism',
    landscapes:'Landscapes',
    city:'City & Street',
    interiors:'Interiors',
    people:'People & Markets',
    water:'Water & Coast',
    gardens:'Gardens & Parks'
  };
  const CATEGORY_SEARCHES={
    mixed:[
      'painting landscape','painting city street','painting interior room','painting crowd market',
      'painting harbor river','painting garden park','painting village architecture','painting railway station',
      'painting beach coast','painting forest','painting festival','painting cafe'
    ],
    impressionism:[
      'impressionist painting','Claude Monet painting','Pierre-Auguste Renoir painting',
      'Camille Pissarro painting','Alfred Sisley painting','Edgar Degas painting','Mary Cassatt painting'
    ],
    landscapes:[
      'landscape painting','mountain landscape painting','forest landscape painting',
      'rural landscape painting','countryside painting','winter landscape painting','field landscape painting'
    ],
    city:[
      'cityscape painting','street scene painting','urban painting','market square painting',
      'railway station painting','cafe street painting','town square painting'
    ],
    interiors:[
      'interior painting room','domestic interior painting','bedroom painting','cafe interior painting',
      'church interior painting','artist studio interior painting','dining room painting'
    ],
    people:[
      'genre painting people','market painting people','crowd painting','workers painting',
      'family painting','group portrait painting','festival crowd painting'
    ],
    water:[
      'seascape painting','harbor painting','river painting','coast painting',
      'beach painting','boats painting','canal painting'
    ],
    gardens:[
      'garden painting','park painting','flower garden painting','water lilies painting',
      'orchard painting','public garden painting','botanical garden painting'
    ]
  };

  const libraries=new Map();
  const loadPromises=new Map();

  function plainText(value){
    const box=document.createElement('div');
    box.innerHTML=String(value||'');
    return (box.textContent||box.innerText||'').replace(/\s+/g,' ').trim();
  }
  
  function isPublicDomainMetadata(meta){
    const license=plainText(meta?.LicenseShortName?.value||meta?.License?.value||meta?.UsageTerms?.value).toLowerCase();
    return license.includes('public domain') || license==='cc0' || license.startsWith('pd-') || license.includes('pd-old') || license.includes('pd-art');
  }

  function cleanMetadataText(value){
    let text=plainText(value);
    text=text.replace(/\b(?:title|label|date)\s+QS:[\s\S]*$/i,'');
    text=text.replace(/\bQS:[A-Z0-9][\s\S]*$/i,'');
    text=text.replace(/\s*[|·]\s*$/,'').replace(/\s{2,}/g,' ').trim();
    return text;
  }

  function cleanYear(value){
    const text=cleanMetadataText(value);
    const match=text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    return match?match[1]:'';
  }

  function fileTitle(pageTitle){
    return String(pageTitle||'')
      .replace(/^File:/i,'')
      .replace(/\.[^.]+$/,'')
      .replace(/[_]+/g,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
  }
  
  async function fetchCommonsPaintings(query){
    const url=new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action','query');
    url.searchParams.set('format','json');
    url.searchParams.set('origin','*');
    url.searchParams.set('generator','search');
    url.searchParams.set('gsrnamespace','6');
    url.searchParams.set('gsrlimit','40');
    url.searchParams.set('gsrsearch',query);
    url.searchParams.set('prop','imageinfo');
    url.searchParams.set('iiprop','url|mime|size|extmetadata');
    url.searchParams.set('iiurlwidth','1600');
  
    const response=await fetch(url.toString(),{mode:'cors'});
    if(!response.ok) throw new Error('Commons catalog returned '+response.status);
    const json=await response.json();
    const pages=Object.values(json?.query?.pages||{});
    return pages.map(page=>{
      const info=page?.imageinfo?.[0];
      const meta=info?.extmetadata||{};
      if(!info || !isPublicDomainMetadata(meta)) return null;
      if(!String(info.mime||'').startsWith('image/')) return null;
      if((Number(info.width)||0)<900 || (Number(info.height)||0)<650) return null;
      const imageUrl=info.thumburl||info.url;
      if(!imageUrl) return null;
      const titleFromFile=fileTitle(page.title);
      const titleFromMeta=cleanMetadataText(meta.ObjectName?.value);
      const safeMetaTitle=titleFromMeta && !/\bQS:|P\d{2,}/i.test(titleFromMeta) ? titleFromMeta : '';
      return {
        id:'commons-'+page.pageid,
        title:safeMetaTitle||titleFromFile||'Untitled',
        artist:cleanMetadataText(meta.Artist?.value)||'Unknown artist',
        date:cleanYear(meta.DateTimeOriginal?.value||meta.DateTime?.value),
        imageUrl,
        imageLarge:imageUrl,
        sourceUrl:info.descriptionurl||('https://commons.wikimedia.org/?curid='+page.pageid),
        publicDomain:true
      };
    }).filter(Boolean);
  }
  
  function mergeArtworks(...groups){
    const out=[];
    const seen=new Set();
    for(const group of groups){
      for(const art of group||[]){
        const key=String(art.sourceUrl||art.imageUrl||art.id);
        if(!key || seen.has(key)) continue;
        seen.add(key);
        out.push(art);
      }
    }
    return out;
  }
  
  function normalizeCategory(category){
    return Object.prototype.hasOwnProperty.call(CATEGORY_SEARCHES,category)?category:'mixed';
  }

  function cacheKey(category){
    return ART_CACHE_KEY+'.'+normalizeCategory(category);
  }

  function readArtCache(category){
    try{
      const cached=JSON.parse(localStorage.getItem(cacheKey(category))||'null');
      if(!cached || !Array.isArray(cached.items) || cached.items.length<50) return null;
      if(Date.now()-Number(cached.savedAt||0)>ART_CACHE_MAX_AGE) return null;
      return cached.items;
    }catch(_){
      return null;
    }
  }
  
  function writeArtCache(category,items){
    try{
      localStorage.setItem(cacheKey(category),JSON.stringify({savedAt:Date.now(),items:items.slice(0,140)}));
    }catch(_){}
  }
  
  async function loadArtLibrary(category='mixed',statusFn=()=>{}){
    category=normalizeCategory(category);
    if(libraries.has(category)) return libraries.get(category);
    if(loadPromises.has(category)) return loadPromises.get(category);

    const promise=(async()=>{
      const cached=readArtCache(category);
      if(cached){
        const items=mergeArtworks(category==='mixed'?ART_LIBRARY:[],cached);
        libraries.set(category,items);
        statusFn('Ready',items.length+' '+CATEGORY_LABELS[category].toLowerCase()+' paintings ready.');
        return items;
      }

      statusFn('Loading art library','Building the '+CATEGORY_LABELS[category].toLowerCase()+' painting catalog…');
      const queries=CATEGORY_SEARCHES[category];
      const batches=await Promise.allSettled(queries.map(fetchCommonsPaintings));
      let items=mergeArtworks(
        category==='mixed'?ART_LIBRARY:[],
        batches.flatMap(result=>result.status==='fulfilled'?result.value:[])
      );

      if(items.length<50){
        const extraQueries=category==='mixed'
          ? ['oil painting','impressionist painting','genre painting','historical painting']
          : [
              CATEGORY_LABELS[category]+' painting art',
              CATEGORY_LABELS[category]+' oil painting',
              CATEGORY_LABELS[category]+' museum painting',
              CATEGORY_LABELS[category]+' classical painting'
            ];
        const extra=await Promise.allSettled(extraQueries.map(fetchCommonsPaintings));
        items=mergeArtworks(items,extra.flatMap(result=>result.status==='fulfilled'?result.value:[]));
      }

      if(items.length<50 && category==='mixed'){
        const masters=await Promise.allSettled([
          'Claude Monet painting','Pierre-Auguste Renoir painting','Vincent van Gogh painting',
          'Camille Pissarro painting','Alfred Sisley painting','Edgar Degas painting',
          'Mary Cassatt painting','J. M. W. Turner painting'
        ].map(fetchCommonsPaintings));
        items=mergeArtworks(items,masters.flatMap(result=>result.status==='fulfilled'?result.value:[]));
      }

      if(items.length>=50) writeArtCache(category,items);
      libraries.set(category,items);
      statusFn('Ready',items.length+' '+CATEGORY_LABELS[category].toLowerCase()+' paintings ready.');
      return items;
    })();

    loadPromises.set(category,promise);
    try{
      return await promise;
    }finally{
      loadPromises.delete(category);
    }
  }
  
  function shuffle(items){
    const list=(items||[]).slice();
    for(let i=list.length-1;i>0;i--){
      let unit=Math.random();
      if(globalThis.crypto?.getRandomValues){
        const data=new Uint32Array(1);
        globalThis.crypto.getRandomValues(data);
        unit=data[0]/4294967296;
      }
      const j=Math.floor(unit*(i+1));
      [list[i],list[j]]=[list[j],list[i]];
    }
    return list;
  }

  window.StreetblendArt={
    load:loadArtLibrary,
    shuffle,
    categories:{...CATEGORY_LABELS},
    seedCount:ART_LIBRARY.length
  };
})();
