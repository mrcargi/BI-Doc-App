import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { Reporte, Tabla } from '@/types'
import { useStore } from '@/store/useStore'

interface Props {
  doc: Reporte
}

interface NodeData extends Tabla {
  id: string
  x: number
  y: number
  fx: number
  fy: number
}

interface LinkData {
  source: NodeData | string
  target: NodeData | string
  fromCol: string
  toCol: string
  card: string
  active: boolean
  dir: string
}

const paletteLight: Record<string, { fill: string; stroke: string; hdr: string; label: string; glow: string }> = {
  import: { fill: '#dcfce7', stroke: '#16a34a', hdr: '#16a34a', label: 'Import', glow: 'rgba(22,163,74,.2)' },
  calc:   { fill: '#dbeafe', stroke: '#2563eb', hdr: '#2563eb', label: 'Calculada', glow: 'rgba(37,99,235,.2)' },
  empty:  { fill: '#ede9fe', stroke: '#7c3aed', hdr: '#7c3aed', label: 'Medidas', glow: 'rgba(124,58,237,.2)' },
  param:  { fill: '#fef3c7', stroke: '#d97706', hdr: '#d97706', label: 'Parametro', glow: 'rgba(217,119,6,.2)' },
}
const paletteDark: Record<string, { fill: string; stroke: string; hdr: string; label: string; glow: string }> = {
  import: { fill: '#0a2618', stroke: '#22c55e', hdr: '#16a34a', label: 'Import', glow: 'rgba(34,197,94,.25)' },
  calc:   { fill: '#0c1a30', stroke: '#60a5fa', hdr: '#2563eb', label: 'Calculada', glow: 'rgba(96,165,250,.25)' },
  empty:  { fill: '#1a0f30', stroke: '#a78bfa', hdr: '#7c3aed', label: 'Medidas', glow: 'rgba(167,139,250,.25)' },
  param:  { fill: '#1e1505', stroke: '#fbbf24', hdr: '#d97706', label: 'Parametro', glow: 'rgba(251,191,36,.25)' },
}
const defaultLight = { fill: '#f4f4f5', stroke: '#71717a', hdr: '#71717a', label: 'Otro', glow: 'rgba(113,113,122,.2)' }
const defaultDark  = { fill: '#1e1e22', stroke: '#a1a1aa', hdr: '#71717a', label: 'Otro', glow: 'rgba(161,161,170,.2)' }
const typeIcons: Record<string, string> = { import: '⬇', calc: 'ƒ', empty: '📐', param: '⚙' }

export function RelationDiagram({ doc }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const { darkMode } = useStore()

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    container.innerHTML = ''

    if (animRef.current) cancelAnimationFrame(animRef.current)

    const dark = darkMode
    const getP = (type: string) => {
      const pal = dark ? paletteDark : paletteLight
      const def = dark ? defaultDark : defaultLight
      return pal[type] || def
    }
    const textPrimary = dark ? '#f4f4f5' : '#18181b'
    const textSecondary = dark ? '#a1a1aa' : '#52525b'
    const dotColor = dark ? 'rgba(161,161,170,0.08)' : 'rgba(113,113,122,0.12)'
    const dividerColor = dark ? 'rgba(161,161,170,0.15)' : 'rgba(113,113,122,0.2)'
    const headerColor = dark ? 'rgba(161,161,170,0.35)' : 'rgba(113,113,122,0.5)'

    const tables = (doc.tables || []).filter(t => !t.name.includes('Local'))
    const relations = (doc.relations || []).filter(r => !r.fromTable.includes('Local') && !r.toTable.includes('Local'))

    const W = container.clientWidth || 800
    const H = 620
    const NW = 170, NH = 76

    // Split related vs orphan
    const relatedNames = new Set<string>()
    relations.forEach(r => { relatedNames.add(r.fromTable); relatedNames.add(r.toTable) })
    const relatedTables = tables.filter(t => relatedNames.has(t.name))
    const orphanTables = tables.filter(t => !relatedNames.has(t.name))

    const divX = orphanTables.length > 0 ? W * 0.62 : W
    const leftW = divX
    const rightW = W - divX

    // Relation counts for finding fact table
    const relCounts: Record<string, number> = {}
    relations.forEach(r => {
      relCounts[r.fromTable] = (relCounts[r.fromTable] || 0) + 1
      relCounts[r.toTable] = (relCounts[r.toTable] || 0) + 1
    })
    const factTable = relatedTables.slice().sort((a, b) => {
      const diff = (relCounts[b.name] || 0) - (relCounts[a.name] || 0)
      return diff !== 0 ? diff : (b.cols || 0) - (a.cols || 0)
    })[0]

    const centerX = leftW * 0.5
    const centerY = H * 0.5
    const orbitR = Math.min(leftW, H) * 0.34

    // Position related tables in star layout
    const nodes: NodeData[] = []
    relatedTables.forEach(t => {
      if (factTable && t.name === factTable.name) {
        nodes.push({ ...t, id: t.name, fx: centerX, fy: centerY, x: centerX, y: centerY })
      } else {
        const others = relatedTables.filter(tt => !factTable || tt.name !== factTable.name)
        const idx = others.indexOf(t)
        const angle = (idx / others.length) * Math.PI * 2 - Math.PI / 2
        const px = centerX + Math.cos(angle) * orbitR
        const py = centerY + Math.sin(angle) * orbitR
        nodes.push({ ...t, id: t.name, fx: px, fy: py, x: px, y: py })
      }
    })

    // Position orphans in grid
    const orphanColW = NW + 20
    const colsRight = Math.max(1, Math.floor((rightW - 60) / orphanColW))
    orphanTables.forEach((t, i) => {
      const col = i % colsRight
      const row = Math.floor(i / colsRight)
      const totalColsW = colsRight * orphanColW
      const startX = divX + (rightW - totalColsW) / 2 + orphanColW / 2
      const px = startX + col * orphanColW
      const py = 45 + NH / 2 + row * (NH + 22)
      nodes.push({ ...t, id: t.name, fx: px, fy: py, x: px, y: py })
    })

    const links: LinkData[] = relations.map(r => ({
      source: r.fromTable, target: r.toTable,
      fromCol: r.fromCol, toCol: r.toCol,
      card: r.card, active: r.active, dir: r.dir,
    }))

    // SVG
    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H)
      .style('font-family', "'Geist', sans-serif")

    const defs = svg.append('defs')

    // Arrow markers
    const arrowColors = { active: '#16a34a', inactive: '#a1a1aa' }
    for (const [type, color] of Object.entries(arrowColors)) {
      defs.append('marker')
        .attr('id', `arrow-${type}`).attr('viewBox', '0 -6 12 12')
        .attr('refX', 12).attr('refY', 0).attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L12,0L0,5Z').attr('fill', color)
    }

    // Dot grid
    defs.append('pattern').attr('id', 'dot-grid').attr('width', 24).attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle').attr('cx', 12).attr('cy', 12).attr('r', 0.6).attr('fill', dotColor)

    // Zoom
    const g = svg.append('g')
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 2.5]).on('zoom', e => g.attr('transform', e.transform)) as any)

    g.append('rect').attr('width', W * 4).attr('height', H * 4).attr('x', -W * 2).attr('y', -H * 2).attr('fill', 'url(#dot-grid)')

    // Divider
    if (orphanTables.length > 0) {
      g.append('line').attr('x1', divX).attr('y1', 0).attr('x2', divX).attr('y2', H)
        .attr('stroke', dividerColor).attr('stroke-width', 1).attr('stroke-dasharray', '6 4')
      g.append('text').attr('x', leftW / 2).attr('y', 22).attr('text-anchor', 'middle')
        .attr('font-size', 11).attr('font-weight', 600).attr('fill', headerColor)
        .attr('letter-spacing', '1.5px').attr('font-family', "'Geist Mono', monospace").text('TABLAS CON RELACION')
      g.append('text').attr('x', divX + rightW / 2).attr('y', 22).attr('text-anchor', 'middle')
        .attr('font-size', 11).attr('font-weight', 600).attr('fill', headerColor)
        .attr('letter-spacing', '1.5px').attr('font-family', "'Geist Mono', monospace").text('SIN RELACION')
    }

    // Resolve links
    links.forEach(l => {
      if (typeof l.source === 'string') l.source = nodes.find(n => n.id === l.source) || l.source as any
      if (typeof l.target === 'string') l.target = nodes.find(n => n.id === l.target) || l.target as any
    })

    // Link paths
    const linkGroup = g.append('g')
    const linkPath = linkGroup.selectAll('path').data(links).join('path')
      .attr('fill', 'none')
      .attr('stroke', d => d.active ? '#16a34a' : '#d1d1d6')
      .attr('stroke-width', d => d.active ? 2.2 : 1.2)
      .attr('stroke-dasharray', d => d.active ? null : '5 3')
      .attr('stroke-opacity', d => d.active ? 0.65 : 0.35)
      .attr('marker-end', d => `url(#arrow-${d.active ? 'active' : 'inactive'})`)

    // Particles
    const particles: { link: LinkData; offset: number; speed: number }[] = []
    links.filter(l => l.active).forEach(l => {
      for (let p = 0; p < 2; p++) {
        particles.push({ link: l, offset: p * 0.5, speed: 0.002 + Math.random() * 0.0015 })
      }
    })
    const particleGroup = g.append('g')
    const particleDots = particleGroup.selectAll('circle').data(particles).join('circle')
      .attr('r', 2.5).attr('fill', '#22c55e').attr('opacity', 0.6)

    // Link labels
    const activeLinkData = links.filter(l => l.active)
    const linkLabelGroup = g.append('g')
    const linkLabelBg = linkLabelGroup.selectAll('rect').data(activeLinkData).join('rect')
      .attr('rx', 4).attr('ry', 4).attr('fill', '#18181b').attr('fill-opacity', 0.82)
      .attr('stroke', '#16a34a').attr('stroke-width', 0.4).attr('stroke-opacity', 0.25)
    const linkLabelText = linkLabelGroup.selectAll('text').data(activeLinkData).join('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', 8.5).attr('fill', '#86efac')
      .attr('font-family', "'Geist Mono', monospace").attr('font-weight', 500)
      .text(d => `${d.fromCol}  ${d.card}  ${d.toCol}`)

    // Nodes
    const node = g.append('g').selectAll<SVGGElement, NodeData>('g').data(nodes).join('g')
      .attr('cursor', 'grab')
      .call(d3.drag<SVGGElement, NodeData>()
        .on('start', () => { container.style.cursor = 'grabbing' })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; d.x = e.x; d.y = e.y; updatePositions() })
        .on('end', () => { container.style.cursor = 'grab' })
      )

    // Shadow
    node.append('rect').attr('width', NW + 3).attr('height', NH + 3).attr('x', -(NW + 3) / 2).attr('y', -(NH + 3) / 2).attr('rx', 9)
      .attr('fill', 'rgba(0,0,0,0.08)')

    // Card bg
    node.append('rect').attr('width', NW).attr('height', NH).attr('x', -NW / 2).attr('y', -NH / 2).attr('rx', 8)
      .attr('fill', d => getP(d.type).fill).attr('stroke', d => getP(d.type).stroke).attr('stroke-width', 1.5)

    // Header bar
    node.append('rect').attr('width', NW).attr('height', 20).attr('x', -NW / 2).attr('y', -NH / 2).attr('rx', 8)
      .attr('fill', d => getP(d.type).hdr)
    node.append('rect').attr('width', NW).attr('height', 10).attr('x', -NW / 2).attr('y', -NH / 2 + 10)
      .attr('fill', d => getP(d.type).hdr)

    // Type label
    node.append('text').attr('text-anchor', 'middle').attr('y', -NH / 2 + 14)
      .attr('font-size', 9).attr('font-weight', 600).attr('fill', '#fff').attr('letter-spacing', '0.6px')
      .text(d => `${typeIcons[d.type] || '○'} ${getP(d.type).label.toUpperCase()}`)

    // Table name
    node.append('text').attr('text-anchor', 'middle').attr('y', -NH / 2 + 38)
      .attr('font-size', 12).attr('font-weight', 700).attr('fill', textPrimary)
      .text(d => d.name.length > 20 ? d.name.slice(0, 19) + '…' : d.name)

    // Meta
    node.append('text').attr('text-anchor', 'middle').attr('y', -NH / 2 + 54)
      .attr('font-size', 9.5).attr('fill', textSecondary)
      .attr('font-family', "'Geist Mono', monospace")
      .text(d => `${d.cols} cols · ${d.rows || '—'} filas`)

    // Helper
    function linkArc(d: LinkData) {
      const s = d.source as NodeData, t = d.target as NodeData
      const sx = s.x || 0, sy = s.y || 0, tx = t.x || 0, ty = t.y || 0
      const dx = tx - sx, dy = ty - sy, dist = Math.sqrt(dx * dx + dy * dy) || 1
      const ox = (dx / dist) * (NW / 2 + 10), oy = (dy / dist) * (NH / 2 + 10)
      const ex = tx - ox, ey = ty - oy
      const mx = (sx + ex) / 2, my = (sy + ey) / 2
      const nx = -(ey - sy), ny = (ex - sx), nl = Math.sqrt(nx * nx + ny * ny) || 1
      return `M${sx},${sy} Q${mx + (nx / nl) * dist * 0.1},${my + (ny / nl) * dist * 0.1} ${ex},${ey}`
    }

    function updatePositions() {
      linkPath.attr('d', d => linkArc(d))
      activeLinkData.forEach((d, i) => {
        const s = d.source as NodeData, t = d.target as NodeData
        const mx = ((s.x || 0) + (t.x || 0)) / 2, my = ((s.y || 0) + (t.y || 0)) / 2
        linkLabelText.filter((_, j) => j === i).attr('x', mx).attr('y', my)
        const tn = linkLabelText.filter((_, j) => j === i).node() as SVGTextElement | null
        if (tn) {
          const bb = tn.getBBox()
          linkLabelBg.filter((_, j) => j === i)
            .attr('x', bb.x - 4).attr('y', bb.y - 2).attr('width', bb.width + 8).attr('height', bb.height + 4)
        }
      })
      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
    }

    updatePositions()

    // Animate particles
    function animateParticles() {
      particles.forEach(p => { p.offset = (p.offset + p.speed) % 1 })
      particleDots.each(function (p) {
        const el = linkPath.filter(l => l === p.link).node()
        if (el) {
          const pathEl = el as SVGPathElement
          const pt = pathEl.getPointAtLength(p.offset * pathEl.getTotalLength())
          d3.select(this).attr('cx', pt.x).attr('cy', pt.y)
        }
      })
      animRef.current = requestAnimationFrame(animateParticles)
    }
    animRef.current = requestAnimationFrame(animateParticles)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [doc.id, doc.tables, doc.relations, darkMode])

  return (
    <div
      ref={containerRef}
      className="w-full bg-surface-50 overflow-hidden"
      style={{ height: 620, cursor: 'grab' }}
    />
  )
}
