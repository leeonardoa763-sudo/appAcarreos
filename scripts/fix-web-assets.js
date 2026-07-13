// Vercel nunca despliega ninguna carpeta llamada "node_modules", sin
// importar .vercelignore/.gitignore (regla dura de la plataforma). Expo
// exporta los assets de librerias (iconos, imagenes de navegacion) con su
// ruta original bajo dist/assets/node_modules/..., asi que quedan 404 en
// produccion aunque funcionen en localhost. Este script renombra esa
// carpeta despues de "expo export -p web" y corrige las referencias en el
// bundle. Ejecutar siempre via "npm run export:web", nunca "expo export"
// directo.
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const oldDir = path.join(distDir, "assets", "node_modules");
const newDirName = "vendor";
const newDir = path.join(distDir, "assets", newDirName);

if (!fs.existsSync(oldDir)) {
  console.log("fix-web-assets: no se encontro dist/assets/node_modules, nada que hacer.");
  process.exit(0);
}

fs.renameSync(oldDir, newDir);
console.log(`fix-web-assets: dist/assets/node_modules -> dist/assets/${newDirName}`);

const jsDir = path.join(distDir, "_expo", "static", "js", "web");
const archivos = fs.existsSync(jsDir)
  ? fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"))
  : [];

let totalReemplazos = 0;
for (const archivo of archivos) {
  const ruta = path.join(jsDir, archivo);
  const contenido = fs.readFileSync(ruta, "utf8");
  const actualizado = contenido.split("/assets/node_modules/").join(`/assets/${newDirName}/`);
  const reemplazos = (contenido.match(/\/assets\/node_modules\//g) || []).length;
  if (reemplazos > 0) {
    fs.writeFileSync(ruta, actualizado);
    totalReemplazos += reemplazos;
    console.log(`fix-web-assets: ${archivo} - ${reemplazos} referencia(s) corregida(s)`);
  }
}

if (totalReemplazos === 0) {
  console.warn("fix-web-assets: ADVERTENCIA - no se corrigio ninguna referencia en el bundle JS.");
}

fs.writeFileSync(path.join(distDir, ".vercelignore"), "");
