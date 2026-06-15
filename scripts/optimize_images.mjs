import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directoryPath = path.join(process.cwd(), 'public', 'images', 'productos');

async function optimizeImages() {
  console.log(`Buscando imágenes en ${directoryPath}...`);

  try {
    const files = fs.readdirSync(directoryPath);
    let convertedCount = 0;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      
      // Procesamos png, jpg y webp (por si ya fueron convertidas antes)
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') {
        // Ignoramos los archivos temporales de intentos anteriores
        if (file.includes('_temp.webp')) {
          const tempPath = path.join(directoryPath, file);
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          continue;
        }

        const filePath = path.join(directoryPath, file);
        const fileNameWithoutExt = path.basename(file, ext);
        const newFilePath = path.join(directoryPath, `${fileNameWithoutExt}_temp.webp`);
        const finalFilePath = path.join(directoryPath, `${fileNameWithoutExt}.webp`);

        console.log(`Optimizando y unificando tamaño: ${file} -> ${fileNameWithoutExt}.webp`);

        try {
          // Solución para EBUSY en Windows: leer el archivo a memoria (buffer)
          // Esto cierra el "file handle" inmediatamente y permite borrar el archivo original
          const imageBuffer = fs.readFileSync(filePath);

          // Primero hacemos trim más agresivo (threshold alto para matar sombras o ruidos) y luego redimensionamos
          await sharp(imageBuffer)
            .trim({ threshold: 60 })
            .resize({
              width: 400,
              height: 600,
              fit: 'contain', // Ajusta la imagen dentro de la caja sin recortar
              background: { r: 0, g: 0, b: 0, alpha: 0 } // Rellena el espacio sobrante con transparente
            })
            .webp({ quality: 80 })
            .toFile(newFilePath);
          
          // Si el archivo original no es el temporal recién creado, lo podemos borrar sin problema
          if (filePath !== newFilePath) {
            fs.unlinkSync(filePath);
          }
          // Renombrar el temporal al nombre final
          fs.renameSync(newFilePath, finalFilePath);
          
          convertedCount++;
          console.log(`✅ ${fileNameWithoutExt}.webp unificada a 400x600.`);
        } catch (error) {
          console.error(`❌ Error procesando ${file}:`, error);
        }
      }
    }

    console.log(`\n¡Proceso finalizado! ${convertedCount} imágenes optimizadas a WebP.`);
  } catch (error) {
    console.error('Error accediendo al directorio:', error);
  }
}

optimizeImages();
