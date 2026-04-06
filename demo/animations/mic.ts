import type { Animation } from './types'

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let micStream: MediaStream | null = null
const freqData = new Uint8Array(512)

let peaks: number[] = []
let peakDecay: number[] = []
let cachedBands: Array<{ lo: number; hi: number }> | null = null

async function startMic() {
  if (analyser) return
  audioCtx = new AudioContext()
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const source = audioCtx.createMediaStreamSource(micStream)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0.75
  source.connect(analyser)
}

function stopMic() {
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop())
    micStream = null
  }
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
  analyser = null
}

// Build octave band edges (logarithmic) mapped to FFT bins
function buildBands(cols: number, binCount: number, sampleRate: number): Array<{ lo: number; hi: number }> {
  const minFreq = 60    // lowest freq we care about
  const maxFreq = sampleRate / 2  // Nyquist
  const bands: Array<{ lo: number; hi: number }> = []
  const minLog = Math.log(minFreq)
  const maxLog = Math.log(maxFreq)

  for (let i = 0; i < cols; i++) {
    const loFreq = Math.exp(minLog + (i / cols) * (maxLog - minLog))
    const hiFreq = Math.exp(minLog + ((i + 1) / cols) * (maxLog - minLog))
    const loBin = Math.max(0, Math.floor(loFreq / (sampleRate / 2) * binCount))
    const hiBin = Math.min(binCount - 1, Math.ceil(hiFreq / (sampleRate / 2) * binCount))
    bands.push({ lo: loBin, hi: Math.max(loBin, hiBin) })
  }
  return bands
}

// Get average amplitude for a range of bins
function bandAmplitude(lo: number, hi: number): number {
  let sum = 0
  const count = hi - lo + 1
  for (let i = lo; i <= hi; i++) {
    sum += freqData[i]
  }
  return sum / count / 255
}

const EQ_PALETTE = [
  '#1a1a2e', // 0: dark bg
  '#00d4ff', // 1: light blue (low)
  '#ff6600', // 2: orange (mid)
  '#ff0040', // 3: red (high)
  '#0099cc', // 4: teal blue
  '#ff8800', // 5: amber
  '#cc0033', // 6: deep red
  '#33bbff', // 7: sky blue
  '#ff4400', // 8: red-orange
  '#0066aa', // 9: dark blue
  '#ff2200', // 10: bright red
  '#66ddff', // 11: pale blue
  '#ff5500', // 12: deep orange
  '#0088dd', // 13: medium blue
  '#ff0000', // 14: pure red
  '#ffffff', // 15: white
]

export const mic: Animation = {
  name: 'EQ',
  presets: { palette: EQ_PALETTE },
  async onStart() {
    peaks = []
    peakDecay = []
    cachedBands = null
    await startMic()
  },
  onStop() {
    stopMic()
    cachedBands = null
  },
  fn(display) {
    display.clear()
    if (!analyser || !audioCtx) return
    analyser.getByteFrequencyData(freqData)
    const binCount = analyser.frequencyBinCount
    const cols = display.width
    const rows = display.height
    const sampleRate = audioCtx.sampleRate

    // Initialize peak arrays
    if (peaks.length !== cols) {
      peaks = new Array(cols).fill(0)
      peakDecay = new Array(cols).fill(0)
    }

    if (!cachedBands) cachedBands = buildBands(cols, binCount, sampleRate)
    const bands = cachedBands

    // Compute overall volume for depth scaling
    let totalSum = 0
    for (let i = 0; i < binCount; i++) totalSum += freqData[i]
    const avgVolume = totalSum / binCount / 255
    const volumeBoost = 0.5 + avgVolume * 1.5

    // Scale depth with volume
    display.setDepth(Math.min(5, Math.floor(avgVolume * 20)))

    for (let x = 0; x < cols; x++) {
      const amp = bandAmplitude(bands[x].lo, bands[x].hi)
      const barHeight = Math.min(Math.floor(amp * volumeBoost * rows), rows)

      // Update peak hold
      if (barHeight >= peaks[x]) {
        peaks[x] = barHeight
        peakDecay[x] = 0
      } else {
        peakDecay[x]++
        // Peak falls after holding for 10 frames
        if (peakDecay[x] > 10) {
          peaks[x] = Math.max(0, peaks[x] - 1)
        }
      }

      // Draw bar
      for (let y = 0; y < barHeight; y++) {
        const ratio = y / rows
        let color: number
        if (ratio < 0.33) color = 1       // light blue
        else if (ratio < 0.66) color = 2  // orange
        else color = 3                     // red
        display.setPixel(x, y, color)
      }

      // Draw peak dot
      const peakY = peaks[x]
      if (peakY > 0 && peakY < rows) {
        display.setPixel(x, peakY, 15) // white peak
      }
    }
  },
}
