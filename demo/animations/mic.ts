import type { Animation } from './types'

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let micStream: MediaStream | null = null
const freqData = new Uint8Array(256)

async function startMic() {
  if (analyser) return
  audioCtx = new AudioContext()
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const source = audioCtx.createMediaStreamSource(micStream)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.8
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

export const mic: Animation = {
  name: 'Mic',
  async onStart() {
    await startMic()
  },
  onStop() {
    stopMic()
  },
  fn(display) {
    display.clear()
    if (!analyser) return
    analyser.getByteFrequencyData(freqData)
    const binCount = analyser.frequencyBinCount
    const cols = display.width
    const rows = display.height

    // Compute overall volume to scale the display
    let sum = 0
    for (let i = 0; i < binCount; i++) sum += freqData[i]
    const avgVolume = sum / binCount / 255
    const volumeBoost = 0.5 + avgVolume * 1.5

    // Scale depth (extrusion) with volume — clamp between 0 and 5
    const depthFromVolume = Math.min(5, Math.floor(avgVolume * 20))
    display.setDepth(depthFromVolume)

    for (let x = 0; x < cols; x++) {
      // Logarithmic scale: spread low frequencies across more columns
      const minLog = Math.log(1)
      const maxLog = Math.log(binCount)
      const logIdx = Math.exp(minLog + (x / cols) * (maxLog - minLog))
      const binIdx = Math.min(Math.floor(logIdx), binCount - 1)
      const amplitude = freqData[binIdx] / 255
      const barHeight = Math.min(Math.floor(amplitude * volumeBoost * rows), rows)
      for (let y = 0; y < barHeight; y++) {
        const ratio = y / rows
        let color: number
        if (ratio < 0.33) color = 1
        else if (ratio < 0.66) color = 4
        else color = 2
        display.setPixel(x, y, color)
      }
    }
  },
}
