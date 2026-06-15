import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const productos = [
  { nombre: 'postobon_manzana', query: 'postobon manzana botella png transparente' },
  { nombre: 'postobon_uva', query: 'postobon uva botella png transparente' },
  { nombre: 'postobon_colombiana', query: 'gaseosa colombiana la nuestra botella png transparente' },
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

async function download(url, dest) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
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

async function searchDDG(query) {
  try {
    // 1. Get vqd
    const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html = await res.text();
    const vqdMatch = html.match(/vqd=["']([^"']+)["']/);
    if (!vqdMatch) throw new Error('VQD not found');
    const vqd = vqdMatch[1];

    // 2. Search images
    const searchUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}&f=,,,&p=1`;
    const imgRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const data = await imgRes.json();
    return data.results.map(r => r.image);
  } catch (e) {
    console.error('DDG Error:', e.message);
    return [];
  }
}

async function run() {
  await fs.mkdir(DIR, { recursive: true });

  for (const prod of productos) {
    try {
      await fs.access(path.join(DIR, `${prod.nombre}.png`));
      console.log(`Skipping ${prod.nombre}, already exists`);
      continue;
    } catch (e) {}

    console.log(`Searching for ${prod.nombre}...`);
    const urls = await searchDDG(prod.query);
    let success = false;
    for (const url of urls.slice(0, 3)) { // try top 3
      if (await download(url, path.join(DIR, `${prod.nombre}.png`))) {
        console.log(`Saved ${prod.nombre}.png from ${url}`);
        success = true;
        break;
      }
    }
    if (!success) {
      console.log(`Failed to download ${prod.nombre}`);
    }
  }
  process.exit(0);
}

run();
