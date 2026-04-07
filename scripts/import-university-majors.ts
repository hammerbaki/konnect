import XLSX from 'xlsx';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = process.env.DATABASE_URL || '';

if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB_URL });

async function main() {
  const xlsxPath = path.join(__dirname, '../attached_assets/학과_찾기_1775540492902.xlsx');
  console.log(`Reading Excel file: ${xlsxPath}`);

  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];

  const headers = rawData[0];
  console.log('Headers:', headers);

  const rows = rawData.slice(1).filter(row => row[1] && row[2]);
  console.log(`Total data rows to import: ${rows.length}`);

  const client = await pool.connect();
  try {
    const existingCountResult = await client.query('SELECT COUNT(*) FROM university_majors');
    const existingCount = parseInt(existingCountResult.rows[0].count, 10);

    if (existingCount > 0) {
      console.log(`university_majors already has ${existingCount} rows. Skipping import to avoid duplicates.`);
      await printStats(client);
      return;
    }

    console.log('Starting batch insert...');
    const BATCH_SIZE = 500;
    let insertedTotal = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIdx = 1;

      for (const row of batch) {
        placeholders.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
        values.push(
          row[1] ?? null,
          row[2] ?? null,
          row[3] ?? null,
          row[4] ?? null,
          row[5] ?? null,
          row[6] ?? null,
          row[7] ?? null,
          row[8] ?? null,
          row[9] ?? null,
          row[10] ?? null,
          row[11] ?? null,
          row[12] ?? null,
          row[13] ?? null,
        );
      }

      const query = `
        INSERT INTO university_majors
          (major_name, university_name, division, university_type, region, location, location_detail, establishment, day_night, major_characteristic, category_large, category_medium, category_small)
        VALUES
          ${placeholders.join(', ')}
      `;

      await client.query(query, values);
      insertedTotal += batch.length;
      process.stdout.write(`\rInserted ${insertedTotal} / ${rows.length} rows...`);
    }

    console.log(`\nImport complete! Total inserted: ${insertedTotal}`);
    await printStats(client);
  } finally {
    client.release();
    await pool.end();
  }
}

async function printStats(client: pg.PoolClient) {
  const totalResult = await client.query('SELECT COUNT(*) FROM university_majors');
  const totalRows = parseInt(totalResult.rows[0].count, 10);
  console.log(`\n=== Import Statistics ===`);
  console.log(`Total rows in university_majors: ${totalRows}`);

  const matchedMajorsResult = await client.query(`
    SELECT COUNT(DISTINCT cm.id) as count
    FROM cached_majors cm
    WHERE EXISTS (
      SELECT 1 FROM university_majors um
      WHERE um.major_name = cm.major_name
         OR um.major_name ILIKE '%' || cm.major_name || '%'
         OR cm.major_name ILIKE '%' || um.major_name || '%'
    )
  `);
  console.log(`Matched majors (cached_majors basis): ${matchedMajorsResult.rows[0].count}`);

  const matchedUnivResult = await client.query(`
    SELECT COUNT(DISTINCT ui.id) as count
    FROM university_info ui
    WHERE EXISTS (
      SELECT 1 FROM university_majors um
      WHERE um.university_name = ui.univ_name
    )
  `);
  console.log(`Matched universities (university_info basis): ${matchedUnivResult.rows[0].count}`);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
