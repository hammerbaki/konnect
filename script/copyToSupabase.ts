import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function copyData() {
  const devPool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const prodPool = new Pool({ 
    connectionString: process.env.PROD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Fetching careers from development...');
    const { rows } = await devPool.query('SELECT * FROM careers');
    console.log(`Found ${rows.length} careers`);

    if (rows.length === 0) {
      console.log('No careers to copy');
      return;
    }

    console.log('Copying to Supabase...');
    let copied = 0;
    
    for (const row of rows) {
      await prodPool.query(
        `INSERT INTO careers (id, name, category, description, full_data, detail_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           full_data = EXCLUDED.full_data,
           detail_data = EXCLUDED.detail_data,
           updated_at = EXCLUDED.updated_at`,
        [row.id, row.name, row.category, row.description, 
         JSON.stringify(row.full_data), JSON.stringify(row.detail_data),
         row.created_at, row.updated_at]
      );
      copied++;
      if (copied % 100 === 0) {
        console.log(`Copied ${copied}/${rows.length}...`);
      }
    }

    console.log(`✓ Copied ${copied} careers to Supabase`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

copyData();
