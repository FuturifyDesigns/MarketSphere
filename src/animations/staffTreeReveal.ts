import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { isCmsEditActive } from '../lib/cmsEditMode'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

type Point = { x: number; y: number }

type StaffPaths = {
  trunk: SVGPathElement
  arm: SVGPathElement | null
  drops: SVGPathElement[]
  stacked: boolean
}

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

function isStackedBranches(branchTops: Point[]) {
  if (branchTops.length <= 1) return true
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) return true
  const xs = branchTops.map((point) => point.x)
  return Math.max(...xs) - Math.min(...xs) < 28
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

function rebuildStaffPaths(root: HTMLElement): StaffPaths | null {
  const svg = root.querySelector<SVGSVGElement>('.staff-tree__svg')
  const pathsGroup = root.querySelector<SVGGElement>('.staff-tree__paths')
  const hub = root.querySelector<HTMLElement>('.staff-tree__hub')
  const rootNode = root.querySelector<HTMLElement>('.staff-tree__node--root')
  const branchNodes = gsap.utils.toArray<HTMLElement>('.staff-tree__node--branch', root)
  if (!svg || !pathsGroup || !hub || !rootNode || !branchNodes.length) return null

  svg.removeAttribute('viewBox')
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  pathsGroup.replaceChildren()

  const from = relativePoint(rootNode, svg, 'bottom')
  const hubPoint = relativePoint(hub, svg, 'center')
  const branchTops = branchNodes.map((node) => relativePoint(node, svg, 'top'))
  const branchBottoms = branchNodes.map((node) => relativePoint(node, svg, 'bottom'))
  const stacked = isStackedBranches(branchTops)

  root.dataset.staffTreeLayout = stacked ? 'stacked' : 'forked'

  const fragment = document.createDocumentFragment()
  const trunk = createPath(`M ${from.x} ${from.y + 2} L ${hubPoint.x} ${hubPoint.y}`, 'trunk')
  fragment.appendChild(trunk)

  let arm: SVGPathElement | null = null
  const drops: SVGPathElement[] = []

  if (stacked) {
    drops.push(createPath(`M ${hubPoint.x} ${hubPoint.y} L ${branchTops[0].x} ${branchTops[0].y - 2}`, 'drop-0'))
    for (let index = 1; index < branchNodes.length; index += 1) {
      const prevBottom = branchBottoms[index - 1]
      const nextTop = branchTops[index]
      const midX = (prevBottom.x + nextTop.x) / 2
      drops.push(
        createPath(
          `M ${prevBottom.x} ${prevBottom.y + 2} L ${midX} ${prevBottom.y + 2} L ${midX} ${nextTop.y - 2} L ${nextTop.x} ${nextTop.y - 2}`,
          `drop-${index}`,
        ),
      )
    }
  } else {
    const leftX = Math.min(...branchTops.map((point) => point.x))
    const rightX = Math.max(...branchTops.map((point) => point.x))
    arm = createPath(`M ${leftX} ${hubPoint.y} L ${rightX} ${hubPoint.y}`, 'arm')
    fragment.appendChild(arm)
    branchTops.forEach((point, index) => {
      drops.push(createPath(`M ${point.x} ${hubPoint.y} L ${point.x} ${point.y - 2}`, `drop-${index}`))
    })
  }

  drops.forEach((drop) => fragment.appendChild(drop))
  pathsGroup.appendChild(fragment)

  return { trunk, arm, drops, stacked }
}

function showAllContent(
  header: HTMLElement,
  rootNode: HTMLElement,
  hub: HTMLElement | null,
  branchNodes: HTMLElement[],
  paths: StaffPaths | null,
) {
  gsap.set([header, rootNode, hub, ...branchNodes].filter(Boolean), {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    clearProps: 'visibility',
  })
  if (paths) {
    ;[paths.trunk, paths.arm, ...paths.drops].filter(Boolean).forEach((path) => {
      gsap.set(path as SVGPathElement, { strokeDashoffset: 0, autoAlpha: 1 })
    })
  }
}

/**
 * Scroll-driven staff tree: title fades in first, then connectors draw and people appear.
 * Uses play-once (not scrub) so content can never stay stuck invisible.
 */
export function initStaffTreeReveal(root: HTMLElement) {
  const header = root.querySelector<HTMLElement>('.staff-tree__header')
  const hub = root.querySelector<HTMLElement>('.staff-tree__hub')
  const rootNode = root.querySelector<HTMLElement>('.staff-tree__node--root')
  const branchNodes = gsap.utils.toArray<HTMLElement>('.staff-tree__node--branch', root)

  if (!header || !rootNode) return () => undefined

  root.classList.add('staff-tree--ready')

  if (prefersReducedMotion() || isCmsEditActive()) {
    const paths = rebuildStaffPaths(root)
    showAllContent(header, rootNode, hub, branchNodes, paths)
    return () => undefined
  }

  const ctx = gsap.context(() => {
    let tl: gsap.core.Timeline | null = null

    const buildTimeline = () => {
      tl?.scrollTrigger?.kill()
      tl?.kill()

      const paths = rebuildStaffPaths(root)
      if (!paths) {
        // Never leave the section blank if connectors fail to measure.
        showAllContent(header, rootNode, hub, branchNodes, null)
        return
      }

      gsap.set(header, { autoAlpha: 0, y: 28 })
      gsap.set(rootNode, { autoAlpha: 0, y: 24, scale: 0.96 })
      if (hub) gsap.set(hub, { autoAlpha: 0, scale: 0.35 })
      gsap.set(branchNodes, { autoAlpha: 0, y: 30, scale: 0.96 })

      tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: root,
          start: 'top 82%',
          once: true,
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
          // If the section is already on screen when created, play immediately.
          onRefresh(self) {
            if (self.progress > 0 || self.isActive) return
            const rect = root.getBoundingClientRect()
            if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
              self.animation?.progress(1)
            }
          },
        },
      })

      tl.to(header, { autoAlpha: 1, y: 0, duration: 0.7 }, 0)
        .to(rootNode, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6 }, 0.35)
        .to(paths.trunk, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.55 }, 0.75)

      if (hub) {
        tl.to(hub, { autoAlpha: 1, scale: 1, duration: 0.3 }, 1.0)
      }

      if (paths.arm) {
        tl.to(paths.arm, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.5 }, 1.05)
      }

      if (paths.stacked) {
        paths.drops.forEach((drop, index) => {
          const at = 1.15 + index * 0.45
          tl?.to(drop, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.4 }, at)
          if (branchNodes[index]) {
            tl?.to(branchNodes[index], { autoAlpha: 1, y: 0, scale: 1, duration: 0.45 }, at + 0.15)
          }
        })
      } else {
        if (paths.drops.length) {
          tl.to(paths.drops, { strokeDashoffset: 0, autoAlpha: 1, duration: 0.45, stagger: 0.08 }, 1.25)
        }
        if (branchNodes.length) {
          tl.to(branchNodes, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.1 }, 1.4)
        }
      }
    }

    const boot = window.requestAnimationFrame(() => {
      buildTimeline()
      scheduleScrollRefresh()
      // Safety net: if still hidden shortly after boot, force the finished state.
      window.setTimeout(() => {
        const hidden = Number(gsap.getProperty(header, 'opacity')) < 0.05
        if (hidden) {
          const paths = rebuildStaffPaths(root)
          showAllContent(header, rootNode, hub, branchNodes, paths)
          tl?.progress(1)
        }
      }, 1200)
    })

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const done = (tl?.progress() ?? 0) >= 0.99
        buildTimeline()
        if (done) tl?.progress(1)
        ScrollTrigger.refresh()
      }, 160)
    }

    window.addEventListener('resize', onResize)
    const mq = window.matchMedia('(max-width: 768px)')
    mq.addEventListener('change', onResize)

    return () => {
      window.cancelAnimationFrame(boot)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      mq.removeEventListener('change', onResize)
      tl?.scrollTrigger?.kill()
      tl?.kill()
    }
  }, root)

  return () => ctx.revert()
}
