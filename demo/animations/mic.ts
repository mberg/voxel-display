import type { Animation } from './types'

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let micStream: MediaStream | null = null
const freqData = new Uint8Array(1024)

// Peak hold state: one peak per column, decays over time
let peaks: number[] = []
let peakDecay: number[] = []

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

export const mic: Animation = {
  name: 'Mic',
  async onStart() {
    peaks = []
    peakDecay = []
    await startMic()
  },
  onStop() {
    stopMic()
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

    const bands = buildBands(cols, binCount, sampleRate)

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
        if (ratio < 0.33) color = 1       // green
        else if (ratio < 0.66) color = 4  // yellow
        else color = 2                     // red
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
