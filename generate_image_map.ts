
import fs from 'fs';
import path from 'path';

const imagesDir = path.join(process.cwd(), 'client/public/careers/webp_images');
const outputFile = path.join(process.cwd(), 'client/src/lib/careerImages.json');

try {
    const files = fs.readdirSync(imagesDir);
    const mapping: Record<string, { male?: string, female?: string }> = {};

    files.forEach(file => {
        if (!file.endsWith('.webp')) return;

        // Format: ID_Name_Gender.webp
        // Example: K000000839_표백·염색기조작원_male.webp
        
        const parts = file.split('_');
        if (parts.length < 3) return;

        const id = parts[0];
        // Gender is the last part before .webp
        const genderPart = parts[parts.length - 1].replace('.webp', '').toLowerCase();
        
        if (!mapping[id]) {
            mapping[id] = {};
        }

        if (genderPart === 'male') {
            mapping[id].male = file;
        } else if (genderPart === 'female') {
            mapping[id].female = file;
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(mapping, null, 2));
    console.log(`Generated mapping for ${Object.keys(mapping).length} careers.`);

} catch (e) {
    console.error("Error:", e);
}
