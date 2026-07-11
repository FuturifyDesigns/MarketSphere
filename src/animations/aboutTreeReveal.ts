import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const PATH_CLASS = 'about-tree__path'
const TRUNK_CLASS = 'about-tree__trunk'
const REVEAL_EASE = 'power2.out'
const FADE_EASE = 'power2.inOut'
const SCROLL_UNIT = 0.42

type Point = { x: number; y: number }

function getPoint(el: HTMLElement, svg: SVGSVGElement): Point {
  const rect = el.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - svgRect.left,
    y: rect.top + rect.height / 2 - svgRect.top,
  }
}

function getHub(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('.about-tree__spine-hub')
}

function getCardEdgeX(node: HTMLElement, svg: SVGSVGElement, side: 'left' | 'right'): number {
  const nodeRect = node.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  return side === 'left' ? nodeRect.right - svgRect.left + 8 : nodeRect.left - svgRect.left - 8
}

function createSvgPath(
  d: string,
  className: string,
  dataset: Record<string, string> = {},
) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('class', className)
  path.setAttribute('d', d)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'var(--color-gold)')
  path.setAttribute('stroke-width', '2')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  Object.entries(dataset).forEach(([key, value]) => {
    path.dataset[key] = value
  })
  const length = path.getTotalLength()
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 })
  return path
}

function measureBranchSteps(root: HTMLElement) {
  const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)
  const leftStep = steps.find((step) => step.dataset.side === 'left')
  const rightStep = steps.find((step) => step.dataset.side === 'right')
  const rootStep = steps.find((step) => step.dataset.side === 'center')
  return { steps, leftStep, rightStep, rootStep }
}

function rebuildPaths(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.about-tree__svg')
  const pathsGroup = root.querySelector<SVGGElement>('.about-tree__paths')
  const canvas = root.querySelector<HTMLElement>('.about-tree__canvas')
  const hub = getHub(root)
  if (!svg || !pathsGroup || !canvas || !hub) return

  pathsGroup.innerHTML = ''

  const { leftStep, rightStep, rootStep } = measureBranchSteps(root)
  const hubPoint = getPoint(hub, svg)
  const canvasRect = canvas.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  const trunkTop = canvasRect.top - svgRect.top + 12
  const trunkBottom = canvasRect.bottom - svgRect.top - 12

  const trunk = createSvgPath(
    `M ${hubPoint.x} ${trunkTop} L ${hubPoint.x} ${trunkBottom}`,
    TRUNK_CLASS,
    { role: 'trunk' },
  )
  pathsGroup.appendChild(trunk)

  if (rootStep) {
    const rootNode = rootStep.querySelector<HTMLElement>('.about-tree__node')
    if (rootNode) {
      const rootRect = rootNode.getBoundingClientRect()
      const rootTop = rootRect.top - svgRect.top + 16
      const rootStem = createSvgPath(
        `M ${hubPoint.x} ${trunkTop} L ${hubPoint.x} ${rootTop}`,
        PATH_CLASS,
        { role: 'root-stem', stepIndex: '0' },
      )
      pathsGroup.appendChild(rootStem)
    }
  }

  if (leftStep) {
    const leftNode = leftStep.querySelector<HTMLElement>('.about-tree__node')
    if (leftNode) {
      const toX = getCardEdgeX(leftNode, svg, 'left')
      const leftBranch = createSvgPath(
        `M ${hubPoint.x} ${hubPoint.y} L ${toX} ${hubPoint.y}`,
        PATH_CLASS,
        { role: 'branch-left', stepIndex: String(leftStep.dataset.stepIndex || '1') },
      )
      pathsGroup.appendChild(leftBranch)
    }
  }

  if (rightStep) {
    const rightNode = rightStep.querySelector<HTMLElement>('.about-tree__node')
    if (rightNode) {
      const toX = getCardEdgeX(rightNode, svg, 'right')
      const rightBranch = createSvgPath(
        `M ${hubPoint.x} ${hubPoint.y} L ${toX} ${hubPoint.y}`,
        PATH_CLASS,
        { role: 'branch-right', stepIndex: String(rightStep.dataset.stepIndex || '2') },
      )
      pathsGroup.appendChild(rightBranch)
    }
  }

  return gsap.utils.toArray<SVGPathElement>(`.${PATH_CLASS}, .${TRUNK_CLASS}`, root)
}

function getStepScrollDuration(step: HTMLElement) {
  const revealItems = step.querySelectorAll('.about-tree__reveal-item').length
  if (revealItems > 4) return 1.35 + revealItems * 0.07
  if (revealItems > 1) return 1.05 + revealItems * 0.06
  return 1.1
}

function getBranchPath(root: HTMLElement, side: string) {
  const paths = gsap.utils.toArray<SVGPathElement>(`.${PATH_CLASS}`, root)
  if (side === 'left') {
    return paths.find((path) => path.dataset.role === 'branch-left')
  }
  if (side === 'right') {
    return paths.find((path) => path.dataset.role === 'branch-right')
  }
  if (side === 'center') {
    return paths.find((path) => path.dataset.role === 'root-stem')
  }
  return undefined
}

function debounce(fn: () => void, ms: number) {
  let timer: number | undefined
  return () => {
    if (timer !== undefined) window.clearTimeout(timer)
    timer = window.setTimeout(fn, ms)
  }
}

export function initAboutTreeAnimation(root: HTMLElement) {
  if (prefersReducedMotion()) {
    gsap.set(root.querySelectorAll('.about-tree__step'), { autoAlpha: 1, pointerEvents: 'auto' })
    gsap.set(root.querySelectorAll('.about-tree__reveal-item'), {
      opacity: 1,
      y: 0,
      clearProps: 'transform,opacity',
    })
    gsap.set(root.querySelectorAll(`.${PATH_CLASS}, .${TRUNK_CLASS}`), {
      opacity: 0.65,
      strokeDashoffset: 0,
    })
    return () => {}
  }

  let resizeHandler: (() => void) | undefined
  let treeTrigger: ScrollTrigger | undefined

  const ctx = gsap.context(() => {
    const pin = root.querySelector<HTMLElement>('.about-tree__pin')
    const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)

    if (!pin || steps.length === 0) return

    const syncPaths = () => {
      rebuildPaths(root)
    }

    syncPaths()

    resizeHandler = debounce(() => {
      if (treeTrigger) {
        const progress = treeTrigger.progress
        syncPaths()
        treeTrigger.animation?.progress(progress)
      } else {
        syncPaths()
      }
    }, 180)

    window.addEventListener('resize', resizeHandler)

    const trunk = () => root.querySelector<SVGPathElement>(`.${TRUNK_CLASS}`)
    const drawnBranches = new Set<'left' | 'right'>()
    let trunkScheduled = false

    gsap.set(steps, { autoAlpha: 0, pointerEvents: 'none' })
    gsap.set(root.querySelectorAll('.about-tree__reveal-item'), { opacity: 0, y: 18 })

    const tl = gsap.timeline({
      defaults: { ease: REVEAL_EASE },
      paused: true,
    })

    steps.forEach((step, index) => {
      const side = (step.dataset.side as 'left' | 'right' | 'center') || 'center'
      const node = step.querySelector<HTMLElement>('.about-tree__node')
      const revealItems = gsap.utils.toArray<HTMLElement>('.about-tree__reveal-item', step)
      const branchPath = getBranchPath(root, side)
      const trunkPath = trunk()
      const segment = getStepScrollDuration(step)
      const label = `tree-step-${index}`

      if (index > 0) {
        const prev = steps[index - 1]
        tl.to(prev, { autoAlpha: 0, duration: 0.22, ease: FADE_EASE })
        tl.set(prev, { pointerEvents: 'none' })
      }

      tl.addLabel(label)
      tl.set(step, { autoAlpha: 1, pointerEvents: 'auto' }, label)

      if (trunkPath && !trunkScheduled) {
        trunkScheduled = true
        tl.to(
          trunkPath,
          {
            strokeDashoffset: 0,
            opacity: 0.65,
            duration: segment * 0.28,
            ease: 'none',
          },
          label,
        )
      }

      if (side === 'center' && index === 0 && branchPath) {
        tl.to(
          branchPath,
          { strokeDashoffset: 0, opacity: 0.65, duration: segment * 0.22, ease: 'none' },
          label,
        )
      }

      if ((side === 'left' || side === 'right') && branchPath && !drawnBranches.has(side)) {
        drawnBranches.add(side)
        tl.to(
          branchPath,
          { strokeDashoffset: 0, opacity: 0.65, duration: segment * 0.24, ease: 'none' },
          label,
        )
      }

      if (node) {
        const enterX = side === 'left' ? -72 : side === 'right' ? 72 : 0
        const hasBranch = Boolean(branchPath && (side === 'center' || drawnBranches.has(side)))
        tl.fromTo(
          node,
          { opacity: 0, x: enterX, y: 28, scale: 0.96 },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: segment * 0.28 },
          hasBranch ? `${label}+=${segment * 0.08}` : label,
        )
      }

      if (revealItems.length) {
        tl.fromTo(
          revealItems,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: segment * 0.2,
            stagger: segment * 0.045,
            ease: REVEAL_EASE,
          },
          `${label}+=${segment * 0.16}`,
        )
      }

      tl.to({}, { duration: segment * 0.12 })
    })

    treeTrigger = ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: () => `+=${tl.duration() * window.innerHeight * SCROLL_UNIT}`,
      pin: true,
      pinSpacing: true,
      scrub: 1.35,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      animation: tl,
      id: 'about-tree-pin',
    })

    gsap.set(steps[0], { autoAlpha: 1, pointerEvents: 'auto' })
    scheduleScrollRefresh()
  }, root)

  return () => {
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    treeTrigger = undefined
    ctx.revert()
  }
}
