import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

async function migrate() {
  const devUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;

  if (!devUrl || !prodUrl) {
    console.error('Missing DATABASE_URL or PROD_DATABASE_URL');
    process.exit(1);
  }

  const devPool = new Pool({ 
    connectionString: devUrl,
    connectionTimeoutMillis: 30000,
  });
  const devDb = drizzle({ client: devPool, schema });

  const prodPool = new Pool({ 
    connectionString: prodUrl,
    connectionTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false },
  });
  const prodDb = drizzle({ client: prodPool, schema });

  console.log('Fetching careers from development database...');
  const careers = await devDb.select().from(schema.careers);
  console.log(`Found ${careers.length} careers`);

  if (careers.length === 0) {
    console.log('No careers to migrate');
    await devPool.end();
    await prodPool.end();
    return;
  }

  console.log('Checking production database...');
  const existingCareers = await prodDb.select().from(schema.careers);
  console.log(`Production has ${existingCareers.length} careers`);

  if (existingCareers.length > 0) {
    console.log('Production already has careers data. Skipping migration.');
    await devPool.end();
    await prodPool.end();
    return;
  }

  console.log('Inserting careers into production database...');
  
  const batchSize = 50;
  for (let i = 0; i < careers.length; i += batchSize) {
    const batch = careers.slice(i, i + batchSize);
    await prodDb.insert(schema.careers).values(batch);
    console.log(`Inserted ${Math.min(i + batchSize, careers.length)}/${careers.length}`);
  }

  console.log('Migration complete!');
  
  await devPool.end();
  await prodPool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
