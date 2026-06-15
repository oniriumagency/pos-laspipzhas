import Scraper from 'images-scraper';
import fs from 'fs/promises';
import path from 'path';

const productos = [
  { nombre: 'postobon_manzana', query: 'postobon manzana botella png transparente filetype:png' },
  { nombre: 'postobon_uva', query: 'postobon uva botella png transparente filetype:png' },
  { nombre: 'postobon_colombiana', query: 'gaseosa colombiana la nuestra botella png transparente filetype:png' },
  { nombre: 'pepsi', query: 'pepsi botella vidrio 250ml png transparente filetype:png' },
  { nombre: 'natumalta', query: 'natumalta botella png transparente filetype:png' },
  { nombre: 'canada_dry', query: 'canada dry ginger ale botella plastica png transparente filetype:png' },
  { nombre: 'bretana', query: 'bretaña soda botella png transparente filetype:png' },
  { nombre: 'limonada_natural', query: 'vaso limonada natural png transparente filetype:png' },
  { nombre: 'poker', query: 'cerveza poker botella png transparente filetype:png' },
  { nombre: 'aguila', query: 'cerveza aguila botella png transparente filetype:png' },
  { nombre: 'aguila_light', query: 'cerveza aguila light botella png transparente filetype:png' },
  { nombre: 'club_colombia', query: 'cerveza club colombia dorada botella png transparente filetype:png' }
];

const DIR = path.join(process.cwd(), 'public', 'images', 'productos');

const google = new Scraper({
  puppeteer: {
    headless: "new"
  }
});

async function download(url, dest) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(dest, buffer);
    return true;
  } catch (e) {
    return false;
  }
}

async function run() {
  await fs.mkdir(DIR, { recursive: true });

  for (const prod of productos) {
    // skip if file exists
    try {
      await fs.access(path.join(DIR, `${prod.nombre}.png`));
      console.log(`Skipping ${prod.nombre}, already downloaded`);
      continue;
    } catch (e) {}

    console.log(`Searching for ${prod.nombre}...`);
    try {
      const results = await google.scrape(prod.query, 3);
      let success = false;
      for (const res of results) {
        if (await download(res.url, path.join(DIR, `${prod.nombre}.png`))) {
          console.log(`Saved ${prod.nombre}.png`);
          success = true;
          break;
        }
      }
      if (!success) {
        console.log(`Failed to download ${prod.nombre}`);
      }
    } catch (e) {
      console.error(`Error scraping ${prod.nombre}:`, e.message);
    }
  }
  process.exit(0);
}

run();
