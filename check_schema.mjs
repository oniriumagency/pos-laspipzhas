import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data: data2, error: err2 } = await supabase.from('historial_inventario').select('*').limit(1);
  console.log('Error?', err2);
  console.log('Data:', data2);
}
main();
