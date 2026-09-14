import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PIANO_DIR = path.join(rootDir, 'public', 'samples', 'piano');
const BASS_DIR = path.join(rootDir, 'public', 'samples', 'bass');

// Ensure directories exist
fs.mkdirSync(PIANO_DIR, { recursive: true });
fs.mkdirSync(BASS_DIR, { recursive: true });

// 30 Salamander Grand Piano Samples from Tonejs/audio
const PIANO_FILES = [
  'A0.mp3', 'A1.mp3', 'A2.mp3', 'A3.mp3', 'A4.mp3', 'A5.mp3', 'A6.mp3', 'A7.mp3',
  'C1.mp3', 'C2.mp3', 'C3.mp3', 'C4.mp3', 'C5.mp3', 'C6.mp3', 'C7.mp3', 'C8.mp3',
  'Ds1.mp3', 'Ds2.mp3', 'Ds3.mp3', 'Ds4.mp3', 'Ds5.mp3', 'Ds6.mp3', 'Ds7.mp3',
  'Fs1.mp3', 'Fs2.mp3', 'Fs3.mp3', 'Fs4.mp3', 'Fs5.mp3', 'Fs6.mp3', 'Fs7.mp3'
];

const PIANO_BASE_URL = 'https://raw.githubusercontent.com/Tonejs/audio/master/salamander/';

// 17 Electric Bass Samples from nbrosowsky/tonejs-instruments
const BASS_FILES = [
  'As1.mp3', 'As2.mp3', 'As3.mp3', 'As4.mp3',
  'Cs1.mp3', 'Cs2.mp3', 'Cs3.mp3', 'Cs4.mp3', 'Cs5.mp3',
  'E1.mp3', 'E2.mp3', 'E3.mp3', 'E4.mp3',
  'G1.mp3', 'G2.mp3', 'G3.mp3', 'G4.mp3'
];

const BASS_BASE_URL = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/bass-electric/';

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    return { skipped: true };
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (status: ${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return { skipped: false, size: buffer.length };
}

async function downloadAll() {
  console.log('--- Starting Piano Samples Download ---');
  let pianoDownloaded = 0;
  for (const file of PIANO_FILES) {
    const url = `${PIANO_BASE_URL}${file}`;
    const dest = path.join(PIANO_DIR, file);
    try {
      const res = await downloadFile(url, dest);
      if (res.skipped) {
        console.log(`[Piano] ${file} already exists, skipping.`);
      } else {
        console.log(`[Piano] Downloaded ${file} (${Math.round(res.size / 1024)} KB)`);
        pianoDownloaded++;
      }
    } catch (err) {
      console.error(`[Piano Error] Failed to download ${file}:`, err.message);
    }
  }

  console.log('\n--- Starting Electric Bass Samples Download ---');
  let bassDownloaded = 0;
  for (const file of BASS_FILES) {
    const url = `${BASS_BASE_URL}${file}`;
    const dest = path.join(BASS_DIR, file);
    try {
      const res = await downloadFile(url, dest);
      if (res.skipped) {
        console.log(`[Bass] ${file} already exists, skipping.`);
      } else {
        console.log(`[Bass] Downloaded ${file} (${Math.round(res.size / 1024)} KB)`);
        bassDownloaded++;
      }
    } catch (err) {
      console.error(`[Bass Error] Failed to download ${file}:`, err.message);
    }
  }

  console.log(`\nDownload complete: ${pianoDownloaded} new piano samples, ${bassDownloaded} new bass samples.`);
}

downloadAll().catch(console.error);
