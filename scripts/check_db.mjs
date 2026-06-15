import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="(.+)"/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="(.+)"/);

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];

async function checkProducts() {
  const url = `${supabaseUrl}/rest/v1/productos?select=id,nombre,imagen_url`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  const data = await response.json();
  console.log('Productos encontrados en la DB (Remota):');
  console.log(data);
}

checkProducts();
