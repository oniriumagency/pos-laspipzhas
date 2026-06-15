import fs from 'fs/promises';
import path from 'path';

const productos = [
  { nombre: 'postobon_manzana', query: 'postobon manzana botella png transparente' },
  { nombre: 'postobon_uva', query: 'postobon uva botella png transparente' },
  { nombre: 'postobon_colombiana', query: 'colombiana la nuestra botella png transparente' },
  { nombre: 'pepsi', query: 'pepsi botella vidrio 250ml png transparente' },
  { nombre: 'natumalta', query: 'natumalta botella png transparente' },
  { nombre: 'canada_dry', query: 'canada dry ginger ale botella plastica png transparente' },
  { nombre: 'bretana', query: 'bretaña soda botella png transparente' },
  { nombre: 'limonada_natural', query: 'vaso limonada natural png transparente' },
  { nombre: 'poker', query: 'cerveza poker botella png transparente' },
  { nombre: 'aguila', query: 'cerveza aguila botella png transparente' },
  { nombre: 'aguila_light', query: 'cerveza aguila light botella png transparente' },
  { nombre: 'club_colombia', query: 'cerveza club colombia dorada botella png transparente' }
];

const DIR = path.join(process.cwd(), 'public', 'images', 'productos');

async function searchImage(query) {
  // We use duckduckgo HTML search to avoid API limits
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
      }
    });
    const text = await res.text();
    // DuckDuckGo HTML doesn't show images easily. Let's try another public endpoint or simply use hardcoded fallback images if we can't scrape.
    // Actually, finding a good regex for image URLs in ddg HTML might be hard.
    // Let's use Wikipedia / Wikimedia where possible or a generic placeholder generator that allows custom text if everything fails.
  } catch (e) {
    console.error(e);
  }
  return null;
}

// Since reliable web scraping from Node without a browser might fail, 
// I will provide a set of hardcoded URLs for these popular Colombian brands 
// or use a free logo API (like clearbit) for brands.
const fallbackUrls = {
  'postobon_manzana': 'https://s3.amazonaws.com/storage.wobiz.com/132/132517/images/Original/1676648057_0e68f869cf16c723cc5a51c4a45a646c.png',
  'postobon_uva': 'https://s3.amazonaws.com/storage.wobiz.com/132/132517/images/Original/1676648092_0e68f869cf16c723cc5a51c4a45a646c.png',
  'postobon_colombiana': 'https://s3.amazonaws.com/storage.wobiz.com/132/132517/images/Original/1676648021_0e68f869cf16c723cc5a51c4a45a646c.png',
  'pepsi': 'https://purepng.com/public/uploads/large/purepng.com-pepsi-bottlepepsicola-drink-beverage-cola-bottle-pepsi-bottle-141152761664150t7m.png',
  'natumalta': 'https://exitocol.vtexassets.com/arquivos/ids/17391925/bebida-de-malta-natumalta-250-ml-3294336_c.png',
  'canada_dry': 'https://freepngimg.com/thumb/water_bottle/94917-ale-bottle-dry-water-canada-ginger-glass.png',
  'bretana': 'https://www.mercamio.com/wp-content/uploads/2021/04/000000000001004128-BRETAA-1.5L.png',
  'limonada_natural': 'https://png.pngtree.com/png-vector/20240129/ourmid/pngtree-glass-of-lemonade-isolated-png-image_11565439.png',
  'poker': 'https://micorrientazo.com/wp-content/uploads/2020/09/poker-botella.png',
  'aguila': 'https://micorrientazo.com/wp-content/uploads/2020/09/aguila-original.png',
  'aguila_light': 'https://micorrientazo.com/wp-content/uploads/2020/09/aguila-light.png',
  'club_colombia': 'https://micorrientazo.com/wp-content/uploads/2020/09/club-colombia-dorada.png'
};

async function run() {
  await fs.mkdir(DIR, { recursive: true });
  for (const prod of productos) {
    const url = fallbackUrls[prod.nombre];
    if (!url) continue;
    try {
      console.log(`Downloading ${prod.nombre} from ${url}...`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': 'https://www.google.com/'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(path.join(DIR, `${prod.nombre}.png`), buffer);
      console.log(`Saved ${prod.nombre}.png`);
    } catch (e) {
      console.error(`Failed to download ${prod.nombre}:`, e.message);
    }
  }
}

run();
