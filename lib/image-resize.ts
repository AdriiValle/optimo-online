/**
 * Reduce una foto en el navegador antes de subirla: lado largo ≤1200 px y ≤300 KB.
 * WebP si el navegador lo codifica; si no, JPEG. Solo cliente (canvas).
 */

const MAX_SIDE = 1200;
const MAX_BYTES = 300 * 1024;
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];

/** Tipos que el servidor guarda tal cual si ya vienen pequeños. */
const PASS_THROUGH = new Set(["image/jpeg", "image/webp"]);

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // Safari antiguo: sin opciones o sin el formato; probamos con <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Devuelve la foto lista para `POST /api/meals/[id]/photo`; lanza si el navegador no puede leerla. */
export async function resizeImage(file: File): Promise<File> {
  const img = await decode(file);
  try {
    const long = Math.max(img.width, img.height);
    if (!long) throw new Error("empty image");
    if (file.size <= MAX_BYTES && long <= MAX_SIDE && PASS_THROUGH.has(file.type)) return file;

    let scale = Math.min(1, MAX_SIDE / long);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");

    let type = "image/webp";
    let best: Blob | null = null;
    // Si ni a la calidad más baja cabe, se encoge un 20 % y se repite (fotos muy ruidosas).
    for (let round = 0; round < 4; round++) {
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      ctx.fillStyle = "#fff"; // JPEG no tiene alfa: transparente → blanco, no negro.
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img.source, 0, 0, canvas.width, canvas.height);
      for (const q of QUALITIES) {
        let blob = await encode(canvas, type, q);
        // Sin codificador WebP el navegador devuelve PNG: a partir de aquí, JPEG.
        if (blob && blob.type !== type) {
          type = "image/jpeg";
          blob = await encode(canvas, type, q);
        }
        if (!blob) continue;
        best = blob;
        if (blob.size <= MAX_BYTES) break;
      }
      if (best && best.size <= MAX_BYTES) break;
      scale *= 0.8;
    }
    if (!best) throw new Error("encode failed");
    const ext = best.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([best], `${base}.${ext}`, { type: best.type });
  } finally {
    img.close();
  }
}
