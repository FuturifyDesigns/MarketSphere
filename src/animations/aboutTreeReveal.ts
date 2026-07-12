import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const PATH_CLASS = 'about-tree__path'
const TRUNK_CLASS = 'about-tree__trunk'
const REVEAL_EASE = 'power2.out'
const FADE_EASE = 'power2.inOut'

type TreeConfig = {
  scrub: number
  scrollUnit: number
  enterX: number
}

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

function rebuildPaths(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.about-tree__svg')
  const pathsGroup = root.querySelector<SVGGElement>('.about-tree__paths')
  const canvas = root.querySelector<HTMLElement>('.about-tree__canvas')
  const hub = getHub(root)
  if (!svg || !pathsGroup || !canvas || !hub) return

  pathsGroup.innerHTML = ''

  const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)
  const hubPoint = getPoint(hub, svg)
  const canvasRect = canvas.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  const trunkTop = canvasRect.top - svgRect.top + 12
  const trunkBottom = canvasRect.bottom - svgRect.top - 12

  pathsGroup.appendChild(
    createSvgPath(
      `M ${hubPoint.x} ${trunkTop} L ${hubPoint.x} ${trunkBottom}`,
      TRUNK_CLASS,
      { role: 'trunk' },
    ),
  )

  steps.forEach((step) => {
    const side = step.dataset.side as 'left' | 'right' | undefined
    const stepIndex = step.dataset.stepIndex
    const node = step.querySelector<HTMLElement>('.about-tree__node')
    if (!side || !stepIndex || !node) return

    const toX = getCardEdgeX(node, svg, side)
    pathsGroup.appendChild(
      createSvgPath(
        `M ${hubPoint.x} ${hubPoint.y} L ${toX} ${hubPoint.y}`,
        PATH_CLASS,
        { role: 'branch', step: stepIndex, side },
      ),
    )
  })
}

function getScrollMax(scrollEl: HTMLElement) {
  return Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
}

function getStepScrollDuration(step: HTMLElement) {
  const revealItems = step.querySelectorAll('.about-tree__reveal-item').length
  const scrollBody = step.querySelector<HTMLElement>('.about-tree__card-scroll')
  const scrollMax = scrollBody ? getScrollMax(scrollBody) : 0
  const scrollBoost = scrollMax > 0 ? 0.65 + scrollMax / 280 : 0

  if (scrollBody && scrollMax > 0) return 1.45 + scrollBoost + revealItems * 0.04
  if (revealItems > 4) return 1.25 + revealItems * 0.06
  if (revealItems > 1) return 1.1 + revealItems * 0.05
  return 1.1
}

function getBranchPath(root: HTMLElement, stepIndex: string) {
  return root.querySelector<SVGPathElement>(`.${PATH_CLASS}[data-step="${stepIndex}"]`)
}

function debounce(fn: () => void, ms: number) {
  let timer: number | undefined
  return () => {
    if (timer !== undefined) window.clearTimeout(timer)
    timer = window.setTimeout(fn, ms)
  }
}

function runMobileAboutTreeStack(root: HTMLElement) {
  const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)

  gsap.set(steps, {
    autoAlpha: 1,
    pointerEvents: 'auto',
    clearProps: 'transform,x,y,scale',
  })
  gsap.set(root.querySelectorAll('.about-tree__reveal-item'), { opacity: 1, y: 0 })
  gsap.set(root.querySelectorAll('.about-tree__card-scroll'), {
    opacity: 1,
    scrollTop: 0,
    clearProps: 'transform,y',
  })

  steps.forEach((step) => {
    gsap.from(step, {
      opacity: 0,
      y: 28,
      duration: 0.55,
      ease: REVEAL_EASE,
      scrollTrigger: {
        trigger: step,
        start: 'top 88%',
        once: true,
      },
    })

    const items = gsap.utils.toArray<HTMLElement>('.about-tree__reveal-item', step)
    if (items.length) {
      gsap.from(items, {
        opacity: 0,
        y: 16,
        duration: 0.45,
        stagger: 0.05,
        ease: REVEAL_EASE,
        scrollTrigger: {
          trigger: step,
          start: 'top 85%',
          once: true,
        },
      })
    }
  })

  scheduleScrollRefresh()
  return () => {}
}

function runAboutTreePin(root: HTMLElement, config: TreeConfig) {
  let resizeHandler: (() => void) | undefined
  let treeTrigger: ScrollTrigger | undefined

  const pin = root.querySelector<HTMLElement>('.about-tree__pin')
  const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)

  if (!pin || steps.length === 0) return () => {}

  const syncPaths = () => {
    rebuildPaths(root)
  }

  syncPaths()

  const stepPlans = steps.map((step) => {
    const scrollBody = step.querySelector<HTMLElement>('.about-tree__card-scroll')
    return {
      segment: getStepScrollDuration(step),
      scrollMax: scrollBody ? getScrollMax(scrollBody) : 0,
    }
  })

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
  let trunkScheduled = false

  gsap.set(steps, { autoAlpha: 0, pointerEvents: 'none' })
  gsap.set(root.querySelectorAll('.about-tree__reveal-item'), { opacity: 0, y: 18 })
  gsap.set(root.querySelectorAll('.about-tree__card-scroll'), { opacity: 0, scrollTop: 0 })

  const tl = gsap.timeline({
    defaults: { ease: REVEAL_EASE },
    paused: true,
  })

  steps.forEach((step, index) => {
    const side = (step.dataset.side as 'left' | 'right') || 'left'
    const stepIndex = step.dataset.stepIndex || String(index)
    const node = step.querySelector<HTMLElement>('.about-tree__node')
    const revealItems = gsap.utils.toArray<HTMLElement>('.about-tree__reveal-item', step)
    const scrollBody = step.querySelector<HTMLElement>('.about-tree__card-scroll')
    const branchPath = getBranchPath(root, stepIndex)
    const trunkPath = trunk()
    const { segment, scrollMax } = stepPlans[index]
    const label = `tree-step-${index}`

    if (index > 0) {
      const prev = steps[index - 1]
      const prevStepIndex = prev.dataset.stepIndex || String(index - 1)
      const prevBranch = getBranchPath(root, prevStepIndex)
      const prevScrollBody = prev.querySelector<HTMLElement>('.about-tree__card-scroll')
      tl.to(prev, { autoAlpha: 0, duration: 0.22, ease: FADE_EASE })
      tl.set(prev, { pointerEvents: 'none' })
      if (prevBranch) {
        tl.to(prevBranch, { opacity: 0.18, duration: 0.18, ease: FADE_EASE }, '<')
      }
      if (prevScrollBody) {
        tl.set(prevScrollBody, { scrollTop: 0 }, '<')
      }
    }

    tl.addLabel(label)
    tl.set(step, { autoAlpha: 1, pointerEvents: 'auto' }, label)
    if (scrollBody) {
      tl.set(scrollBody, { scrollTop: 0 }, label)
    }

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

    if (branchPath) {
      tl.to(
        branchPath,
        { strokeDashoffset: 0, opacity: 0.65, duration: segment * 0.24, ease: 'none' },
        label,
      )
    }

    if (node) {
      const enterX = side === 'left' ? -config.enterX : config.enterX
      const branchOffset = branchPath ? segment * 0.08 : 0
      tl.fromTo(
        node,
        { opacity: 0, x: enterX, y: 28, scale: 0.96 },
        { opacity: 1, x: 0, y: 0, scale: 1, duration: segment * 0.28 },
        branchOffset ? `${label}+=${branchOffset}` : label,
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
          stagger: segment * 0.04,
          ease: REVEAL_EASE,
        },
        `${label}+=${segment * 0.12}`,
      )
    }

    if (scrollBody) {
      tl.fromTo(
        scrollBody,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: segment * 0.14, ease: REVEAL_EASE },
        `${label}+=${segment * 0.2}`,
      )

      if (scrollMax > 8) {
        tl.fromTo(
          scrollBody,
          { scrollTop: 0 },
          { scrollTop: scrollMax, duration: segment * 0.48, ease: 'none' },
          `${label}+=${segment * 0.3}`,
        )
      }
    }

    tl.to({}, { duration: segment * 0.1 })
  })

  treeTrigger = ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${tl.duration() * window.innerHeight * config.scrollUnit}`,
    pin: true,
    pinSpacing: true,
    scrub: config.scrub,
    anticipatePin: 0,
    invalidateOnRefresh: true,
    fastScrollEnd: true,
    animation: tl,
    id: 'about-tree-pin',
  })

  gsap.set(steps[0], { autoAlpha: 1, pointerEvents: 'auto' })
  scheduleScrollRefresh()

  return () => {
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)
    treeTrigger = undefined
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
    gsap.set(root.querySelectorAll('.about-tree__card-scroll'), { opacity: 1, clearProps: 'opacity' })
    gsap.set(root.querySelectorAll(`.${PATH_CLASS}, .${TRUNK_CLASS}`), {
      opacity: 0.65,
      strokeDashoffset: 0,
    })
    return () => {}
  }

  const ctx = gsap.context(() => {
    const mm = gsap.matchMedia()

    mm.add('(min-width: 901px)', () => {
      return runAboutTreePin(root, { scrub: 1.35, scrollUnit: 0.42, enterX: 72 })
    })

    mm.add('(max-width: 900px)', () => {
      return runMobileAboutTreeStack(root)
    })
  }, root)

  return () => ctx.revert()
}
