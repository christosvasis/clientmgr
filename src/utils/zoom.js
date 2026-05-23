export function applyZoom(zoom) {
  const root = document.getElementById('zoom-root')
  if (!root) return
  if (zoom === 100) {
    root.style.transform = ''
    root.style.width = ''
    root.style.height = ''
    return
  }
  const scale = zoom / 100
  root.style.transform = `scale(${scale})`
  root.style.transformOrigin = 'top left'
  root.style.width = `${100 / scale}%`
  root.style.height = `${100 / scale}vh`
}
