import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const logoPath = path.join(root, "client/public/celsyn-logo.png");
const previewDirectory = path.join(root, "client/public/landing");
const previews = ["overview.png", "fleet.png", "incidents.png", "compliance.png", "system.png"];

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let current = value;
  for (let bit = 0; bit < 8; bit += 1) current = (current & 1) ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  return current >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const dataChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
      if (data[8] !== 8 || data[12] !== 0) throw new Error("Only non-interlaced 8-bit PNG files are supported.");
    } else if (type === "IDAT") dataChunks.push(data);
    offset += length + 12;
  }

  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!bytesPerPixel) throw new Error(`Unsupported PNG color type: ${colorType}`);

  const source = zlib.inflateSync(Buffer.concat(dataChunks));
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = source[y * (stride + 1)];
    const row = Buffer.from(source.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let index = 0; index < stride; index += 1) {
      const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
      const above = previous[index];
      const upperLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
      if (filter === 1) row[index] = (row[index] + left) & 255;
      else if (filter === 2) row[index] = (row[index] + above) & 255;
      else if (filter === 3) row[index] = (row[index] + Math.floor((left + above) / 2)) & 255;
      else if (filter === 4) {
        const estimate = left + above - upperLeft;
        const leftDistance = Math.abs(estimate - left);
        const aboveDistance = Math.abs(estimate - above);
        const cornerDistance = Math.abs(estimate - upperLeft);
        const predictor = leftDistance <= aboveDistance && leftDistance <= cornerDistance ? left : aboveDistance <= cornerDistance ? above : upperLeft;
        row[index] = (row[index] + predictor) & 255;
      }
    }
    for (let x = 0; x < width; x += 1) {
      const input = x * bytesPerPixel;
      const output = (y * width + x) * 4;
      pixels[output] = row[input];
      pixels[output + 1] = row[input + 1];
      pixels[output + 2] = row[input + 2];
      pixels[output + 3] = bytesPerPixel === 4 ? row[input + 3] : 255;
    }
    previous = row;
  }

  return { width, height, pixels };
}

function encodePng({ width, height, pixels }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);

  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, checksum]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function pixel(image, x, y) {
  const offset = (y * image.width + x) * 4;
  return [image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2], image.pixels[offset + 3]];
}

function drawBrandMark(target, logo) {
  const targetX = 24;
  const targetY = 21;
  const size = 38;
  const radius = 10;
  const cropX = 348;
  const cropY = 348;
  const cropSize = 558;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const edgeX = Math.min(x, size - 1 - x);
      const edgeY = Math.min(y, size - 1 - y);
      if (edgeX < radius && edgeY < radius && ((edgeX - radius) ** 2 + (edgeY - radius) ** 2) > radius ** 2) continue;

      const sourceX = Math.min(logo.width - 1, Math.round(cropX + ((x + 0.5) / size) * cropSize));
      const sourceY = Math.min(logo.height - 1, Math.round(cropY + ((y + 0.5) / size) * cropSize));
      const [red, green, blue, alpha] = pixel(logo, sourceX, sourceY);
      const output = ((targetY + y) * target.width + targetX + x) * 4;
      target.pixels[output] = red;
      target.pixels[output + 1] = green;
      target.pixels[output + 2] = blue;
      target.pixels[output + 3] = alpha;
    }
  }
}

const logo = decodePng(fs.readFileSync(logoPath));
for (const file of previews) {
  const previewPath = path.join(previewDirectory, file);
  const preview = decodePng(fs.readFileSync(previewPath));
  drawBrandMark(preview, logo);
  fs.writeFileSync(previewPath, encodePng(preview));
  process.stdout.write(`Updated ${file}\n`);
}
