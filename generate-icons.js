const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceLogo = 'spectrelogo.png';
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function generateIcons() {
  for (const [folder, size] of Object.entries(sizes)) {
    const targetPath = `android/app/src/main/res/${folder}`;
    
    // Generate ic_launcher.png
    await sharp(sourceLogo)
      .resize(size, size)
      .toFile(`${targetPath}/ic_launcher.png`)
      .then(() => console.log(`Generated ${targetPath}/ic_launcher.png (${size}x${size})`))
      .catch(err => console.error(`Error generating ${targetPath}/ic_launcher.png:`, err));
    
    // Generate ic_launcher_round.png
    await sharp(sourceLogo)
      .resize(size, size)
      .toFile(`${targetPath}/ic_launcher_round.png`)
      .then(() => console.log(`Generated ${targetPath}/ic_launcher_round.png (${size}x${size})`))
      .catch(err => console.error(`Error generating ${targetPath}/ic_launcher_round.png:`, err));
    
    // Generate ic_launcher_foreground.png for adaptive icons
    await sharp(sourceLogo)
      .resize(size, size)
      .toFile(`${targetPath}/ic_launcher_foreground.png`)
      .then(() => console.log(`Generated ${targetPath}/ic_launcher_foreground.png (${size}x${size})`))
      .catch(err => console.error(`Error generating ${targetPath}/ic_launcher_foreground.png:`, err));
  }
  
  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);
