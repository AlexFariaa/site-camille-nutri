const fs = require('fs');
const heicConvert = require('heic-convert');

(async () => {
  try {
    const inputBuffer = fs.readFileSync('images/IMG_7990.HEIC');
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 1
    });
    fs.writeFileSync('public/images/camille.jpg', outputBuffer);
    console.log('Converted successfully');
  } catch (err) {
    console.error('Error converting:', err);
  }
})();
