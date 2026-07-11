import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { flushScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const PATH_CLASS = 'about-tree__path'
const REVEAL_EASE = 'power2.out'
const FADE_EASE = 'power2.inOut'
const SCROLL_UNIT = 0.44

function getJointCenter(joint: HTMLElement, svg: SVGSVGElement) {
  const jointRect = joint.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  return {
    x: jointRect.left + jointRect.width / 2 - svgRect.left,
    y: jointRect.top + jointRect.height / 2 - svgRect.top,
  }
}

function getSpineX(root: HTMLElement, svg: SVGSVGElement) {
  const spine = root.querySelector<HTMLElement>('.about-tree__spine')
  if (!spine) return svg.getBoundingClientRect().width / 2
  const spineRect = spine.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  return spineRect.left + spineRect.width / 2 - svgRect.left
}

function buildBranchPath(
  spineX: number,
  jointY: number,
  node: HTMLElement,
  svg: SVGSVGElement,
  side: 'left' | 'right' | 'center',
) {
  if (side === 'center') return ''

  const nodeRect = node.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  const toX =
    side === 'left'
      ? nodeRect.right - svgRect.left + 4
      : nodeRect.left - svgRect.left - 4

  return `M ${spineX} ${jointY} L ${toX} ${jointY}`
}

function rebuildPaths(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.about-tree__svg')
  const pathsGroup = root.querySelector<SVGGElement>('.about-tree__paths')
  if (!svg || !pathsGroup) return

  pathsGroup.innerHTML = ''

  const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)
  const spineX = getSpineX(root, svg)

  steps.forEach((step, index) => {
    if (index === 0) return

    const side = (step.dataset.side as 'left' | 'right' | 'center') || 'center'
    if (side === 'center') return

    const joint = step.querySelector<HTMLElement>('.about-tree__joint')
    const node = step.querySelector<HTMLElement>('.about-tree__node')
    if (!joint || !node) return

    const jointPoint = getJointCenter(joint, svg)
    const d = buildBranchPath(spineX, jointPoint.y, node, svg, side)
    if (!d) return

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('class', PATH_CLASS)
    path.setAttribute('data-step-index', String(index))
    path.setAttribute('d', d)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', 'var(--color-gold)')
    path.setAttribute('stroke-width', '2')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('opacity', '0.6')

    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 })
    pathsGroup.appendChild(path)
  })
}

function getStepScrollDuration(step: HTMLElement) {
  const revealItems = step.querySelectorAll('.about-tree__reveal-item').length
  if (revealItems > 4) return 1.35 + revealItems * 0.07
  if (revealItems > 1) return 1.05 + revealItems * 0.06
  return 1.1
}

export function initAboutTreeAnimation(root: HTMLElement) {
  if (prefersReducedMotion()) {
    gsap.set(root.querySelectorAll('.about-tree__step'), { autoAlpha: 1, pointerEvents: 'auto' })
    gsap.set(root.querySelectorAll('.about-tree__reveal-item'), {
      opacity: 1,
      y: 0,
      clearProps: 'transform,opacity',
    })
    gsap.set(root.querySelectorAll(`.${PATH_CLASS}`), { opacity: 0.6, strokeDashoffset: 0 })
    gsap.set(root.querySelector('.about-tree__spine'), { scaleY: 1 })
    return () => {}
  }

  const onRefreshInit = () => rebuildPaths(root)
  ScrollTrigger.addEventListener('refreshInit', onRefreshInit)

  const ctx = gsap.context(() => {
    const stage = root.querySelector<HTMLElement>('.about-tree__stage')
    const pin = root.querySelector<HTMLElement>('.about-tree__pin')
    const spine = root.querySelector<HTMLElement>('.about-tree__spine')
    const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)

    if (!stage || !pin || steps.length === 0) return

    rebuildPaths(root)

    const paths = () => gsap.utils.toArray<SVGPathElement>(`.${PATH_CLASS}`, root)

    gsap.set(steps, { autoAlpha: 0, pointerEvents: 'none' })
    gsap.set(root.querySelectorAll('.about-tree__reveal-item'), { opacity: 0, y: 18 })
    if (spine) gsap.set(spine, { scaleY: 0, transformOrigin: 'top center' })

    const tl = gsap.timeline({
      defaults: { ease: REVEAL_EASE },
      paused: true,
    })

    steps.forEach((step, index) => {
      const side = (step.dataset.side as 'left' | 'right' | 'center') || 'center'
      const node = step.querySelector<HTMLElement>('.about-tree__node')
      const revealItems = gsap.utils.toArray<HTMLElement>('.about-tree__reveal-item', step)
      const path = paths().find((p) => p.dataset.stepIndex === String(index))
      const segment = getStepScrollDuration(step)
      const label = `tree-step-${index}`

      if (index > 0) {
        const prev = steps[index - 1]
        tl.to(prev, { autoAlpha: 0, duration: 0.22, ease: FADE_EASE })
        tl.set(prev, { pointerEvents: 'none' })
      }

      tl.addLabel(label)
      tl.set(step, { autoAlpha: 1, pointerEvents: 'auto' }, label)

      if (spine) {
        tl.to(
          spine,
          { scaleY: (index + 0.45) / steps.length, duration: segment * 0.2, ease: 'none' },
          label,
        )
      }

      if (path) {
        tl.to(
          path,
          { strokeDashoffset: 0, opacity: 0.6, duration: segment * 0.22, ease: 'none' },
          label,
        )
      }

      if (node) {
        const enterX = side === 'left' ? -72 : side === 'right' ? 72 : 0
        tl.fromTo(
          node,
          { opacity: 0, x: enterX, y: 28, scale: 0.96 },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: segment * 0.28 },
          path ? `${label}+=${segment * 0.08}` : label,
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
          path ? `${label}+=${segment * 0.18}` : `${label}+=${segment * 0.1}`,
        )
      }

      tl.to({}, { duration: segment * 0.12 })
    })

    ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: () => `+=${tl.duration() * window.innerHeight * SCROLL_UNIT}`,
      pin,
      scrub: 1.35,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: tl,
      id: 'about-tree-pin',
    })

    gsap.set(steps[0], { autoAlpha: 1, pointerEvents: 'auto' })

    flushScrollRefresh()
  }, root)

  return () => {
    ScrollTrigger.removeEventListener('refreshInit', onRefreshInit)
    ctx.revert()
  }
}
