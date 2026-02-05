import './style.css'

const canvas = document.getElementById('sky')
const ctx = canvas.getContext('2d')
const tooltip = document.getElementById('tooltip')

/* ---------- RESIZE ---------- */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

resizeCanvas()
window.addEventListener('resize', () => {
  resizeCanvas()
  centerCameraOnAllConstellations()
})

/* ---------- CAMERA ---------- */

let scale = 1
let offsetX = 0
let offsetY = 0

let isDragging = false
let dragStartX = 0
let dragStartY = 0

let focusTarget = null

/* ---------- TOUCH ---------- */

let isTouchDragging = false
let lastTouchX = 0
let lastTouchY = 0
let lastTouchDistance = 0

/* ---------- DATA ---------- */

const STAR_FIELD_SIZE = 6000
const stars = []

for (let i = 0; i < 3500; i++) {
  stars.push({
    x: Math.random() * STAR_FIELD_SIZE,
    y: Math.random() * STAR_FIELD_SIZE,
    r: Math.random() * 1.5 + 0.5,
    baseA: Math.random() * 0.4 + 0.6,
    phase: Math.random() * Math.PI * 2
  })
}

const constellations = [
  {
    name: 'Стрела',
    stars: [
      { x: 2800, y: 2800 },
      { x: 2900, y: 2650 },
      { x: 3000, y: 2800 },
      { x: 2900, y: 2950 }
    ],
    lines: [[0,1],[1,2],[1,3]]
  },
  {
    name: 'Хомяк',
    stars: [
      { x: 1800, y: 3600 },
      { x: 1900, y: 3500 },
      { x: 2000, y: 3600 },
      { x: 1850, y: 3750 },
      { x: 1950, y: 3780 },
      { x: 2050, y: 3750 }
    ],
    lines: [[0,1],[1,2],[0,3],[3,4],[4,5],[5,2]]
  },
  {
    name: 'Робот',
    stars: [
      { x: 4300, y: 3000 },
      { x: 4300, y: 3200 },
      { x: 4100, y: 3400 },
      { x: 4200, y: 3500 },
      { x: 4400, y: 3500 },
      { x: 4500, y: 3400 }
    ],
    lines: [[0,1],[1,2],[1,3],[1,4],[1,5]]
  },
  {
    name: 'Динозавр',
    stars: [
      { x: 3600, y: 4200 },
      { x: 3750, y: 4150 },
      { x: 3550, y: 4300 },
      { x: 3400, y: 4400 },
      { x: 3250, y: 4450 },
      { x: 3100, y: 4500 },
      { x: 3450, y: 4550 },
      { x: 3600, y: 4550 }
    ],
    lines: [[0,1],[0,2],[2,3],[3,4],[4,5],[3,6],[3,7]]
  }
]

/* ---------- INITIAL FIT ---------- */

function getAllConstellationsBounds() {
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  for (const c of constellations) {
    for (const s of c.stars) {
      minX = Math.min(minX, s.x)
      minY = Math.min(minY, s.y)
      maxX = Math.max(maxX, s.x)
      maxY = Math.max(maxY, s.y)
    }
  }

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

function centerCameraOnAllConstellations() {
  const b = getAllConstellationsBounds()
  const padding = 300

  const sx = canvas.width / (b.width + padding)
  const sy = canvas.height / (b.height + padding)
  scale = Math.min(sx, sy, 0.8)

  offsetX = canvas.width / 2 - (b.minX + b.width / 2) * scale
  offsetY = canvas.height / 2 - (b.minY + b.height / 2) * scale
}

centerCameraOnAllConstellations()

/* ---------- COORDS ---------- */

function screenToWorld(x, y) {
  return {
    x: (x - offsetX) / scale,
    y: (y - offsetY) / scale
  }
}

/* ---------- HIT TEST ---------- */

function pointNearLine(px, py, ax, ay, bx, by, t) {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy
  let u = ((px - ax) * dx + (py - ay) * dy) / l2
  u = Math.max(0, Math.min(1, u))
  return Math.hypot(px - (ax + u * dx), py - (ay + u * dy)) < t
}

function getHoveredConstellation(mx, my) {
  const p = screenToWorld(mx, my)
  for (const c of constellations) {
    for (const [a, b] of c.lines) {
      const A = c.stars[a]
      const B = c.stars[b]
      if (pointNearLine(p.x, p.y, A.x, A.y, B.x, B.y, 6 / scale)) {
        return c
      }
    }
  }
  return null
}

/* ---------- FOCUS ---------- */

function focusOnConstellation(c) {
  let x = 0, y = 0
  for (const s of c.stars) {
    x += s.x
    y += s.y
  }
  x /= c.stars.length
  y /= c.stars.length

  focusTarget = {
    scale: 1.5,
    x: canvas.width / 2 - x * 1.5,
    y: canvas.height / 2 - y * 1.5
  }
}

/* ---------- MOUSE ---------- */

canvas.addEventListener('mousedown', e => {
  isDragging = true
  dragStartX = e.clientX - offsetX
  dragStartY = e.clientY - offsetY
})

window.addEventListener('mouseup', () => isDragging = false)

window.addEventListener('mousemove', e => {
  if (isDragging) {
    offsetX = e.clientX - dragStartX
    offsetY = e.clientY - dragStartY
  }

  const c = getHoveredConstellation(e.clientX, e.clientY)
  tooltip.style.display = c ? 'block' : 'none'
  if (c) {
    tooltip.innerText = c.name
    tooltip.style.left = e.clientX + 12 + 'px'
    tooltip.style.top = e.clientY + 12 + 'px'
  }
})

canvas.addEventListener('click', e => {
  const c = getHoveredConstellation(e.clientX, e.clientY)
  if (c) focusOnConstellation(c)
})

canvas.addEventListener('wheel', e => {
  e.preventDefault()
  const zoom = e.deltaY > 0 ? 0.9 : 1.1
  const wx = (e.clientX - offsetX) / scale
  const wy = (e.clientY - offsetY) / scale
  scale = Math.min(Math.max(scale * zoom, 0.4), 3)
  offsetX = e.clientX - wx * scale
  offsetY = e.clientY - wy * scale
}, { passive: false })

/* ---------- TOUCH ---------- */

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isTouchDragging = true
    lastTouchX = e.touches[0].clientX
    lastTouchY = e.touches[0].clientY
  }
}, { passive: false })

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && isTouchDragging) {
    const t = e.touches[0]
    offsetX += t.clientX - lastTouchX
    offsetY += t.clientY - lastTouchY
    lastTouchX = t.clientX
    lastTouchY = t.clientY
  }

  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.hypot(dx, dy)

    if (!lastTouchDistance) {
      lastTouchDistance = dist
      return
    }

    scale = Math.min(Math.max(scale * (dist / lastTouchDistance), 0.4), 3)
    lastTouchDistance = dist
  }
}, { passive: false })

canvas.addEventListener('touchend', () => {
  isTouchDragging = false
  lastTouchDistance = 0
})

/* ---------- RENDER ---------- */

let time = 0

function draw() {
  time += 0.01
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (focusTarget) {
    scale += (focusTarget.scale - scale) * 0.08
    offsetX += (focusTarget.x - offsetX) * 0.08
    offsetY += (focusTarget.y - offsetY) * 0.08
    if (Math.abs(scale - focusTarget.scale) < 0.01) focusTarget = null
  }

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.baseA})`
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(150,200,255,0.7)'
  ctx.lineWidth = 1 / scale

  for (const c of constellations) {
    for (const [a, b] of c.lines) {
      const A = c.stars[a]
      const B = c.stars[b]
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.stroke()
    }
  }

  ctx.restore()
  requestAnimationFrame(draw)
}

draw()