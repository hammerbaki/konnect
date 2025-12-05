import { db } from "../server/db";
import { careers } from "../shared/schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importCareers() {
  console.log("Starting career data import...");
  
  const dataPath = path.resolve(__dirname, "../client/public/data/careerData.json");
  
  if (!fs.existsSync(dataPath)) {
    console.error("Career data file not found:", dataPath);
    process.exit(1);
  }
  
  console.log("Reading career data from:", dataPath);
  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const careerData = rawData.career_data;
  
  console.log(`Found ${careerData.length} careers to import`);
  
  const batchSize = 50;
  let imported = 0;
  
  for (let i = 0; i < careerData.length; i += batchSize) {
    const batch = careerData.slice(i, i + batchSize);
    
    const values = batch.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      fullData: item.full_data ? JSON.parse(item.full_data) : null,
      detailData: item.detail_data ? JSON.parse(item.detail_data) : null,
    }));
    
    try {
      await db.insert(careers).values(values).onConflictDoUpdate({
        target: careers.id,
        set: {
          name: values[0].name,
          category: values[0].category,
          description: values[0].description,
          fullData: values[0].fullData,
          detailData: values[0].detailData,
        }
      });
      imported += batch.length;
      console.log(`Imported ${imported}/${careerData.length} careers...`);
    } catch (error) {
      console.error(`Error importing batch starting at ${i}:`, error);
      
      for (const item of batch) {
        try {
          await db.insert(careers).values({
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description,
            fullData: item.full_data ? JSON.parse(item.full_data) : null,
            detailData: item.detail_data ? JSON.parse(item.detail_data) : null,
          }).onConflictDoNothing();
          imported++;
        } catch (e) {
          console.error(`Failed to import career ${item.id}:`, e);
        }
      }
    }
  }
  
  console.log(`\nImport complete! Total imported: ${imported} careers`);
  process.exit(0);
}

importCareers().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
