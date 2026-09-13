/**
 * Converts an AudioBuffer into a standard stereo 16-bit 44.1kHz PCM WAV file Blob.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length;
  const dataLength = length * blockAlign;
  const bufferSize = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII string to DataView
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // ChunkSize
  writeString(8, 'WAVE');

  // 2. "fmt " Subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // 3. "data" Subchunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write Interleaved PCM Samples
  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : left;

  let offset = 44;
  for (let i = 0; i < length; i++) {
    // Left Channel
    let sLeft = Math.max(-1, Math.min(1, left[i]));
    let intSampleLeft = sLeft < 0 ? sLeft * 0x8000 : sLeft * 0x7fff;
    view.setInt16(offset, intSampleLeft, true);
    offset += 2;

    // Right Channel
    if (numChannels > 1) {
      let sRight = Math.max(-1, Math.min(1, right[i]));
      let intSampleRight = sRight < 0 ? sRight * 0x8000 : sRight * 0x7fff;
      view.setInt16(offset, intSampleRight, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Triggers a browser download of the WAV audio Blob.
 */
export function downloadWavFile(blob: Blob, title: string = 'music_closer_track'): void {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filename = `${cleanTitle}.wav`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
