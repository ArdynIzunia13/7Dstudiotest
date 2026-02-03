import './style.css'

const viewport = document.getElementById('viewport')
const space = document.getElementById('space')
const constellationsLayer = document.getElementById('constellations')
const popup = document.getElementById('popup')



/* ---------- CAMERA ---------- */

let scale = 1
let offsetX = -2000
let offsetY = -2000
let isDragging = false
let startX = 0
let startY = 0

function updateTransform() {
  space.style.transform =
    `translate(${offsetX}px, ${offsetY}px) scale(${scale})`

  updateStarsDetail()
 
}

/* ---------- DRAG ---------- */

viewport.addEventListener('mousedown', e => {
  isDragging = true
  startX = e.clientX - offsetX
  startY = e.clientY - offsetY
  viewport.style.cursor = 'grabbing'
})

window.addEventListener('mouseup', () => {
  isDragging = false
  viewport.style.cursor = 'grab'
})

window.addEventListener('mousemove', e => {
  if (!isDragging) return
  offsetX = e.clientX - startX
  offsetY = e.clientY - startY
  updateTransform()
})

/* ---------- ZOOM ---------- */

window.addEventListener('wheel', e => {
  e.preventDefault()

  const zoomSpeed = 0.1
  const oldScale = scale

  const rect = viewport.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const worldX = (mouseX - offsetX) / oldScale
  const worldY = (mouseY - offsetY) / oldScale

  const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed
  let newScale = oldScale + delta
  newScale = Math.min(Math.max(newScale, 0.5), 4)

  offsetX = mouseX - worldX * newScale
  offsetY = mouseY - worldY * newScale
  scale = newScale

  updateTransform()
}, { passive: false })


/* ---------- STARS ---------- */

let starsCount = 800
const maxStars = 4000

function createStars(count) {
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div')
    star.className = 'star'
    star.style.left = Math.random() * 4000 + 'px'
    star.style.top = Math.random() * 4000 + 'px'
    star.style.width = '1px'
    star.style.height = '1px'
    space.appendChild(star)
  }
}

createStars(starsCount)

function updateStarsDetail() {
  if (scale > 2 && starsCount < maxStars) {
    createStars(400)
    starsCount += 400
  }

  document.querySelectorAll('.star').forEach(star => {
    star.style.opacity = scale > 2 ? 1 : 0.5
  })
}

/* ---------- CONSTELLATIONS DATA ---------- */

const constellations = [
  {
    name: 'Orion',
    stars: [
      { x: 1900, y: 1800 },
      { x: 2000, y: 1700 },
      { x: 2100, y: 1800 },
      { x: 2000, y: 1900 }
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3]
    ]
  },
  {
    name: 'Lyra',
    stars: [
      { x: 2500, y: 1500 },
      { x: 2600, y: 1450 },
      { x: 2700, y: 1500 },
      { x: 2600, y: 1550 }
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0]
    ]
  },
  {
    name: 'Crux',
    stars: [
      { x: 1200, y: 2300 },
      { x: 1300, y: 2200 },
      { x: 1400, y: 2300 },
      { x: 1300, y: 2400 }
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3]
    ]
  }
]


/* ---------- DRAW CONSTELLATIONS ---------- */

function drawConstellations() {
  constellations.forEach(c => {
    c.lines.forEach(([a, b]) => {
      const A = c.stars[a]
      const B = c.stars[b]

      const dx = B.x - A.x
      const dy = B.y - A.y
      const length = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)

      const line = document.createElement('div')
      line.className = 'constellation-line'
      line.dataset.name = c.name
      line.dataset.minZoom = c.minZoom

      line.style.width = length + 'px'
      line.style.left = A.x + 'px'
      line.style.top = A.y + 'px'
      line.style.transform = `rotate(${angle}rad)`

      constellationsLayer.appendChild(line)
    })
  })
}

drawConstellations()



/* ---------- INTERACTION ---------- */

constellationsLayer.addEventListener('mouseover', e => {
  if (!e.target.classList.contains('constellation-line')) return
  const name = e.target.dataset.name

  document
    .querySelectorAll(`.constellation-line[data-name="${name}"]`)
    .forEach(l => l.classList.add('hover'))
})

constellationsLayer.addEventListener('mouseout', e => {
  if (!e.target.classList.contains('constellation-line')) return
  const name = e.target.dataset.name

  document
    .querySelectorAll(`.constellation-line[data-name="${name}"]`)
    .forEach(l => l.classList.remove('hover'))
})

constellationsLayer.addEventListener('click', e => {
  e.stopPropagation() // 🔥 важно
  if (!e.target.classList.contains('constellation-line')) return

  popup.innerText = e.target.dataset.name
  popup.style.display = 'block'

  const rect = viewport.getBoundingClientRect()
  popup.style.left = e.clientX - rect.left + 'px'
  popup.style.top = e.clientY - rect.top - 10 + 'px'
})

window.addEventListener('click', () => {
  popup.style.display = 'none'
})

updateTransform()

