
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'client/src/lib/careerData.json');

try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    const firstItem = data.career_data[0];
    
    console.log("Root keys:", Object.keys(firstItem));
    
    if (firstItem.detail_data) {
        const detail = JSON.parse(firstItem.detail_data);
        console.log("Detail keys:", Object.keys(detail));
        
        if (detail.tabs) {
            console.log("Tabs keys:", Object.keys(detail.tabs));
            
            // Inspect each tab
            Object.keys(detail.tabs).forEach(key => {
                console.log(`\n--- Tab ${key} ---`);
                console.log(JSON.stringify(detail.tabs[key], null, 2).substring(0, 500)); // Print first 500 chars
            });
        }
    }
} catch (e) {
    console.error("Error:", e);
}
