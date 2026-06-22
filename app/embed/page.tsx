// Страница WebRTC-трансляции арены (/embed).
// Показывает прямой видеопоток с арены через WebRTC (WHiP/WHaP) поверх canvas-оверлея
// с маркерами AprilTag для отображения позиций роботов в реальном времени.
// Параметры URL: ?id=R1&name=Игрок1&color=%23ff0000 (можно повторять для нескольких роботов)
'use client'

import { useEffect, useRef } from 'react'

// Конфигурация подключения к медиасерверу и WebSocket детектора тегов
const CONFIG = {
  domain: 'miniserv.robo-arena.ru',
  streamHigh: 'polygon_high', // HD-поток (основной)
  streamLow: 'polygon_low',   // SD-поток (переключается автоматически при потерях пакетов)
  user: 'bro',
  pass: 'zaq1xsw2',
  tagsWsUrl: 'wss://play.robo-arena.ru/ws-detect', // WebSocket сервер компьютерного зрения
}

// Соответствие имён роботов (R1..R4) числовым идентификаторам AprilTag-маркеров
const ROBOT_MAP: Record<string, number> = { R1: 101, R2: 102, R3: 103, R4: 104 }

interface TagData {
  id: number
  center: [number, number]
  corners: [number, number][]
}

export default function EmbedPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const wsStatusRef = useRef<HTMLSpanElement>(null)
  const pingRef = useRef<HTMLSpanElement>(null)
  const jitterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ids = params.getAll('id')
    const names = params.getAll('name')
    const colors = params.getAll('color')

    const activeTargets: Record<number, { name: string; color: string }> = {}
    ids.forEach((id, i) => {
      const tagId = ROBOT_MAP[id.trim()]
      if (tagId) activeTargets[tagId] = { name: names[i] || id, color: colors[i] || '#007AFF' }
    })

    let currentStream = CONFIG.streamHigh
    let pc: RTCPeerConnection | null = null
    let statsInterval: ReturnType<typeof setInterval> | null = null
    let isSwitching = false
    let latestTags: TagData[] = []
    let lastFramesDecoded = 0
    let blackScreenTimer = 0
    let animFrame: number
    let mounted = true
    let wsTags: WebSocket | null = null
    let videoWs: WebSocket | null = null

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    function setStatus(text: string, color?: string) {
      if (statusRef.current) { statusRef.current.innerText = text; if (color) statusRef.current.style.color = color }
    }

    // Периодически опрашивает WebRTC-статистику: ping, jitter, потери пакетов.
    // Если framesDecoded не меняется 5 секунд подряд (чёрный экран) — переподключаемся.
    // Если потерь пакетов > 30 за секунду — переключаемся на низкое качество (SD).
    function startStats() {
      if (statsInterval) clearInterval(statsInterval)
      let lastPacketsLost = 0
      statsInterval = setInterval(async () => {
        if (!pc || pc.signalingState === 'closed') return
        const stats = await pc.getStats()
        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded')
            if (pingRef.current) pingRef.current.innerText = String(Math.round(report.currentRoundTripTime * 1000))
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            if (jitterRef.current) jitterRef.current.innerText = String(Math.round(report.jitter * 1000))
            // Детектируем зависший поток: если framesDecoded не растёт 5 итераций — переподключаем
            if (report.framesDecoded === lastFramesDecoded) blackScreenTimer++
            else blackScreenTimer = 0
            lastFramesDecoded = report.framesDecoded
            if (blackScreenTimer >= 5) { blackScreenTimer = 0; connectVideo() }
            const losses = report.packetsLost - lastPacketsLost
            lastPacketsLost = report.packetsLost
            // Адаптивное переключение качества при плохом соединении
            if (losses > 30 && currentStream === CONFIG.streamHigh) {
              currentStream = CONFIG.streamLow
              isSwitching = true
              connectVideo().then(() => { isSwitching = false })
            }
          }
        })
      }, 1000)
    }

    async function connectVideo() {
      if (pc) { pc.close(); pc = null }
      setStatus('CONNECTING...')
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:89.104.65.166:3478', username: 'robot', credential: 'arena_turn_2024' },
          { urls: 'turn:91.229.8.26:3478', username: 'robot', credential: 'arena_turn_2024' },
        ],
      })
      pc.ontrack = ev => {
        const video = videoRef.current!
        video.srcObject = ev.streams[0] || new MediaStream([ev.track])
        video.play().catch(() => {
          setStatus('TAP TO START', '#f0f')
          const start = () => { video.play(); window.removeEventListener('click', start) }
          window.addEventListener('click', start)
        })
        setStatus(currentStream === CONFIG.streamHigh ? 'LIVE (HD)' : 'LIVE (SD)')
        startStats()
      }
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })

      const wsUrl = `wss://${CONFIG.user}:${CONFIG.pass}@${CONFIG.domain}/api/ws?src=${currentStream}`
      videoWs = new WebSocket(wsUrl)
      const ws = videoWs
      ws.onopen = () => {
        pc!.onicecandidate = ev => ev.candidate && ws.send(JSON.stringify({ type: 'webrtc/candidate', value: ev.candidate.candidate }))
        pc!.createOffer()
          .then(offer => pc!.setLocalDescription(offer))
          .then(() => ws.send(JSON.stringify({ type: 'webrtc/offer', value: pc!.localDescription!.sdp })))
      }
      ws.onmessage = async ev => {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'webrtc/answer') await pc!.setRemoteDescription({ type: 'answer', sdp: msg.value })
        else if (msg.type === 'webrtc/candidate') await pc!.addIceCandidate({ candidate: msg.value, sdpMid: '0' })
      }
      ws.onclose = () => { if (!isSwitching && mounted) setTimeout(connectVideo, 3000) }
    }

    // Подключается к WebSocket серверу компьютерного зрения.
    // Сервер присылает массив обнаруженных AprilTag-маркеров с координатами.
    // При потере соединения автоматически переподключается через 2 секунды.
    function connectTagsWS() {
      wsTags = new WebSocket(CONFIG.tagsWsUrl)
      wsTags.onopen = () => { if (wsStatusRef.current) { wsStatusRef.current.innerText = 'ONLINE'; wsStatusRef.current.style.color = '#0f0' } }
      wsTags.onmessage = ev => {
        try { const data = JSON.parse(ev.data); latestTags = data.tags || [] } catch {}
      }
      wsTags.onclose = () => {
        if (!mounted) return
        if (wsStatusRef.current) { wsStatusRef.current.innerText = 'OFFLINE'; wsStatusRef.current.style.color = 'red' }
        setTimeout(connectTagsWS, 2000)
      }
    }

    function drawMarker(tag: TagData, name: string, color: string) {
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      tag.corners.forEach((c, i) => i === 0 ? ctx.moveTo(c[0], c[1]) : ctx.lineTo(c[0], c[1]))
      ctx.closePath()
      ctx.stroke()

      const fontSize = 16
      ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`
      const tw = ctx.measureText(name).width
      const pad = 6
      const x = tag.center[0]
      const y = tag.center[1] - 55

      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(x - tw / 2 - pad, y - fontSize, tw + pad * 2, fontSize + pad)
      ctx.lineWidth = 2
      ctx.strokeRect(x - tw / 2 - pad, y - fontSize, tw + pad * 2, fontSize + pad)
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.fillText(name, x, y)
      ctx.beginPath()
      ctx.moveTo(x, y + pad)
      ctx.lineTo(x, tag.center[1] - 15)
      ctx.strokeStyle = color
      ctx.stroke()
    }

    // Цикл отрисовки HUD через requestAnimationFrame.
    // Каждый кадр очищает canvas и рисует маркеры для всех активных роботов.
    function hudLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      latestTags.forEach(tag => {
        const target = activeTargets[tag.id]
        if (target) drawMarker(tag, target.name, target.color)
      })
      animFrame = requestAnimationFrame(hudLoop)
    }

    connectVideo()
    connectTagsWS()
    hudLoop()

    return () => {
      mounted = false
      if (pc) pc.close()
      if (statsInterval) clearInterval(statsInterval)
      cancelAnimationFrame(animFrame)
      if (wsTags) wsTags.close()
      if (videoWs) videoWs.close()
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', maxWidth: '100%', maxHeight: '100%', aspectRatio: '16/9', objectFit: 'contain', zIndex: 1 }} />
      <canvas ref={canvasRef} width={1280} height={720} style={{ position: 'absolute', maxWidth: '100%', maxHeight: '100%', aspectRatio: '16/9', objectFit: 'contain', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: '8px', borderRadius: '4px', color: '#0f0', fontSize: '11px', border: '1px solid #333', lineHeight: '1.4', zIndex: 10, fontFamily: 'monospace' }}>
        <div>STREAM: <span ref={statusRef} style={{ color: '#fff', fontWeight: 'bold' }}>CONNECTING...</span></div>
        <div>TAGS WS: <span ref={wsStatusRef} style={{ color: 'red', fontWeight: 'bold' }}>OFFLINE</span></div>
        <div>PING: <span ref={pingRef} style={{ color: '#fff', fontWeight: 'bold' }}>--</span> ms | JITTER: <span ref={jitterRef} style={{ color: '#fff', fontWeight: 'bold' }}>--</span> ms</div>
      </div>
    </div>
  )
}
