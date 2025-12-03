
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, 'client/public/careers/webp_images');
const outputFile = path.join(__dirname, 'client/src/lib/careerImages.json');

// Ensure directories exist
if (!fs.existsSync(imagesDir)) {
  console.error(`Directory not found: ${imagesDir}`);
  process.exit(1);
}

const imageMap = {};

try {
  const files = fs.readdirSync(imagesDir);
  
  files.forEach(file => {
    if (!file.endsWith('.webp')) return;
    
    // Filename format: K000000821_JobName_gender.webp
    // We want to extract the ID (K000000821) and gender
    
    const parts = file.split('_');
    if (parts.length < 3) return; // Unexpected format
    
    const id = parts[0];
    const lastPart = parts[parts.length - 1]; // gender.webp
    const gender = lastPart.replace('.webp', '');
    
    if (!imageMap[id]) {
      imageMap[id] = {};
    }
    
    if (gender === 'male' || gender === 'female') {
      // Store the public path
      imageMap[id][gender] = `/careers/webp_images/${file}`;
    }
  });
  
  fs.writeFileSync(outputFile, JSON.stringify(imageMap, null, 2));
  console.log(`Successfully generated image map with ${Object.keys(imageMap).length} careers.`);
  
} catch (error) {
  console.error('Error generating image map:', error);
}
