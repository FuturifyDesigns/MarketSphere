import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { isCmsEditActive } from '../lib/cmsEditMode'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

type Point = { x: number; y: number }

function relativePoint(el: HTMLElement, svg: SVGSVGElement, edge: 'center' | 'top' | 'bottom' = 'center'): Point {
  const rect = el.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  const y =
    edge === 'top' ? rect.top : edge === 'bottom' ? rect.bottom : rect.top + rect.height / 2
  return {
    x: rect.left + rect.width / 2 - svgRect.left,
    y: y - svgRect.top,
  }
}

function createPath(d: string, role: string) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('class', 'staff-tree__path')
  path.setAttribute('d', d)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  path.dataset.role = role
  const length = Math.max(path.getTotalLength(), 1)
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, autoAlpha: 0 })
  return path
}

function rebuildStaffPaths(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.staff-tree__svg')
  const pathsGroup = root.querySelector<SVGGElement>('.staff-tree__paths')
  const hub = root.querySelector<HTMLElement>('.staff-tree__hub')
  const rootNode = root.querySelector<HTMLElement>('.staff-tree__node--root')
  const branchNodes = gsap.utils.toArray<HTMLElement>('.staff-tree__node--branch', root)
  if (!svg || !pathsGroup || !hub || !rootNode || !branchNodes.length) return null

  // Match AboutCompanyTree: no viewBox — path units = CSS pixels inside the SVG box.
  svg.removeAttribute('viewBox')
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  pathsGroup.replaceChildren()

  const from = relativePoint(rootNode, svg, 'bottom')
  const hubPoint = relativePoint(hub, svg, 'center')
  const branchTops = branchNodes.map((node) => relativePoint(node, svg, 'top'))
  const leftX = Math.min(...branchTops.map((point) => point.x))
  const rightX = Math.max(...branchTops.map((point) => point.x))

  // Slight inset so the trunk meets the card edge cleanly.
  const trunkStartY = from.y + 2
  const trunk = createPath(`M ${from.x} ${trunkStartY} L ${hubPoint.x} ${hubPoint.y}`, 'trunk')
  const arm = createPath(`M ${leftX} ${hubPoint.y} L ${rightX} ${hubPoint.y}`, 'arm')
  const drops = branchTops.map((point, index) =>
    createPath(`M ${point.x} ${hubPoint.y} L ${point.x} ${point.y - 2}`, `drop-${index}`),
  )

  const fragment = document.createDocumentFragment()
  fragment.appendChild(trunk)
  fragment.appendChild(arm)
  drops.forEach((drop) => fragment.appendChild(drop))
  pathsGroup.appendChild(fragment)

  return { trunk, arm, drops }
}

function revealPaths(paths: { trunk: SVGPathElement; arm: SVGPathElement; drops: SVGPathElement[] }) {
  ;[paths.trunk, paths.arm, ...paths.drops].forEach((path) => {
    gsap.set(path, { strokeDashoffset: 0, autoAlpha: 1 })
  })
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
    const paths = rebuildStaffPaths(root)
    if (paths) revealPaths(paths)
    return () => undefined
  }

  const ctx = gsap.context(() => {
    let tl: gsap.core.Timeline | null = null

    const buildTimeline = () => {
      tl?.scrollTrigger?.kill()
      tl?.kill()

      const paths = rebuildStaffPaths(root)
      if (!paths) return

      gsap.set(header, { autoAlpha: 0, y: 28 })
      gsap.set(rootNode, { autoAlpha: 0, y: 24, scale: 0.96 })
      if (hub) gsap.set(hub, { autoAlpha: 0, scale: 0.35 })
      gsap.set(branchNodes, { autoAlpha: 0, y: 30, scale: 0.96 })

      tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: root,
          start: 'top 78%',
          end: '+=90%',
          scrub: 0.85,
          invalidateOnRefresh: true,
        },
      })

      tl.to(header, { autoAlpha: 1, y: 0, duration: 1 }, 0)
        .to(rootNode, { autoAlpha: 1, y: 0, scale: 1, duration: 0.85 }, 0.55)
        .to(paths.trunk, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.7 }, 1.15)

      if (hub) {
        tl.to(hub, { autoAlpha: 1, scale: 1, duration: 0.35 }, 1.45)
      }

      tl.to(paths.arm, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.65 }, 1.55)

      if (paths.drops.length) {
        tl.to(paths.drops, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08 }, 1.9)
      }

      if (branchNodes.length) {
        tl.to(branchNodes, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12 }, 2.15)
      }
    }

    // Wait a tick so layout (and fonts) settle before measuring connectors.
    const boot = window.requestAnimationFrame(() => {
      buildTimeline()
      scheduleScrollRefresh()
    })

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const progress = tl?.scrollTrigger?.progress ?? 0
        buildTimeline()
        tl?.progress(progress)
        ScrollTrigger.refresh()
      }, 160)
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.cancelAnimationFrame(boot)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      tl?.scrollTrigger?.kill()
      tl?.kill()
    }
  }, root)

  return () => ctx.revert()
}
