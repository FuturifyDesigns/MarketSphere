import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { isCmsEditActive } from '../lib/cmsEditMode'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

type Point = { x: number; y: number }

function getPoint(el: HTMLElement, svg: SVGSVGElement): Point {
  const rect = el.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - svgRect.left,
    y: rect.top + rect.height / 2 - svgRect.top,
  }
}

function ensurePath(group: SVGGElement, role: string) {
  let path = group.querySelector<SVGPathElement>(`[data-role="${role}"]`)
  if (!path) {
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('class', 'staff-tree__path')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', 'var(--color-gold)')
    path.setAttribute('stroke-width', '2.25')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')
    path.dataset.role = role
    group.appendChild(path)
  }
  return path
}

function preparePath(path: SVGPathElement, d: string, hide = true) {
  path.setAttribute('d', d)
  const length = Math.max(path.getTotalLength(), 1)
  if (hide) {
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 })
  } else {
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0, opacity: 1 })
  }
  return path
}

function rebuildStaffPaths(root: HTMLElement, hide = true) {
  const svg = root.querySelector<SVGSVGElement>('.staff-tree__svg')
  const pathsGroup = root.querySelector<SVGGElement>('.staff-tree__paths')
  const hub = root.querySelector<HTMLElement>('.staff-tree__hub')
  const rootNode = root.querySelector<HTMLElement>('.staff-tree__node--root')
  const branchNodes = gsap.utils.toArray<HTMLElement>('.staff-tree__node--branch', root)
  if (!svg || !pathsGroup || !hub || !rootNode || !branchNodes.length) return null

  const svgRect = svg.getBoundingClientRect()
  const width = Math.max(svgRect.width, 1)
  const height = Math.max(svgRect.height, 1)
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))

  const rootPoint = getPoint(rootNode, svg)
  const hubPoint = getPoint(hub, svg)
  const branchPoints = branchNodes.map((node) => getPoint(node, svg))
  const leftX = Math.min(...branchPoints.map((point) => point.x))
  const rightX = Math.max(...branchPoints.map((point) => point.x))

  const trunk = preparePath(
    ensurePath(pathsGroup, 'trunk'),
    `M ${rootPoint.x} ${rootPoint.y + rootNode.offsetHeight * 0.38} L ${hubPoint.x} ${hubPoint.y}`,
    hide,
  )
  const arm = preparePath(
    ensurePath(pathsGroup, 'arm'),
    `M ${leftX} ${hubPoint.y} L ${rightX} ${hubPoint.y}`,
    hide,
  )

  // Remove stale drops, then recreate for current branch count.
  pathsGroup.querySelectorAll('[data-role^="drop"]').forEach((node) => node.remove())
  const drops = branchPoints.map((point, index) =>
    preparePath(
      ensurePath(pathsGroup, `drop-${index}`),
      `M ${point.x} ${hubPoint.y} L ${point.x} ${point.y - branchNodes[index].offsetHeight * 0.38}`,
      hide,
    ),
  )

  return { trunk, arm, drops }
}

/**
 * Scroll-driven staff tree: title fades in first, then connectors draw and people appear.
 */
export function initStaffTreeReveal(root: HTMLElement) {
  const header = root.querySelector<HTMLElement>('.staff-tree__header')
  const hub = root.querySelector<HTMLElement>('.staff-tree__hub')
  const rootNode = root.querySelector<HTMLElement>('.staff-tree__node--root')
  const branchNodes = gsap.utils.toArray<HTMLElement>('.staff-tree__node--branch', root)

  if (!header || !rootNode) return () => undefined

  if (prefersReducedMotion() || isCmsEditActive()) {
    gsap.set([header, rootNode, hub, ...branchNodes].filter(Boolean), { clearProps: 'all' })
    rebuildStaffPaths(root, false)
    return () => undefined
  }

  const ctx = gsap.context(() => {
    let paths = rebuildStaffPaths(root, true)
    let tl: gsap.core.Timeline | null = null

    const buildTimeline = () => {
      tl?.kill()
      paths = rebuildStaffPaths(root, true)
      if (!paths) return

      gsap.set(header, { autoAlpha: 0, y: 28 })
      gsap.set(rootNode, { autoAlpha: 0, y: 24, scale: 0.96 })
      if (hub) gsap.set(hub, { autoAlpha: 0, scale: 0.35 })
      gsap.set(branchNodes, { autoAlpha: 0, y: 30, scale: 0.96 })

      tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: root,
          start: 'top 80%',
          end: 'bottom 55%',
          scrub: 1.1,
          invalidateOnRefresh: true,
        },
      })

      // 1) Leadership title / section copy
      tl.to(header, { autoAlpha: 1, y: 0, duration: 1 }, 0)
        // 2) CEO appears
        .to(rootNode, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9 }, 0.7)
        // 3) Tree forms: trunk → hub → arm → drops → people
        .to(paths.trunk, { strokeDashoffset: 0, opacity: 1, duration: 0.75 }, 1.35)

      if (hub) {
        tl.to(hub, { autoAlpha: 1, scale: 1, duration: 0.4 }, 1.7)
      }

      tl.to(paths.arm, { strokeDashoffset: 0, opacity: 1, duration: 0.7 }, 1.8)

      if (paths.drops.length) {
        tl.to(paths.drops, { strokeDashoffset: 0, opacity: 1, duration: 0.55, stagger: 0.1 }, 2.15)
      }

      if (branchNodes.length) {
        tl.to(branchNodes, { autoAlpha: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.14 }, 2.35)
      }
    }

    buildTimeline()

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const progress = tl?.scrollTrigger?.progress ?? 0
        buildTimeline()
        tl?.progress(progress)
        ScrollTrigger.refresh()
      }, 140)
    }

    window.addEventListener('resize', onResize)
    scheduleScrollRefresh()

    return () => {
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      tl?.kill()
    }
  }, root)

  return () => ctx.revert()
}
