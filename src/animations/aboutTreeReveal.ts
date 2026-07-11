import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../lib/intro'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'

gsap.registerPlugin(ScrollTrigger)

const PATH_CLASS = 'about-tree__path'
const REVEAL_EASE = 'power2.out'

function getJointCenter(joint: HTMLElement, svg: SVGSVGElement) {
  const jointRect = joint.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  return {
    x: jointRect.left + jointRect.width / 2 - svgRect.left,
    y: jointRect.top + jointRect.height / 2 - svgRect.top,
  }
}

function buildBranchPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  side: 'left' | 'right' | 'center',
) {
  if (side === 'center') {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }

  const midY = from.y + (to.y - from.y) * 0.45
  const elbowX = side === 'left' ? Math.min(from.x, to.x) : Math.max(from.x, to.x)
  return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${elbowX} ${midY} L ${to.x} ${to.y}`
}

function rebuildPaths(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.about-tree__svg')
  const pathsGroup = root.querySelector<SVGGElement>('.about-tree__paths')
  if (!svg || !pathsGroup) return

  pathsGroup.innerHTML = ''

  const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)
  const joints = steps
    .map((step) => step.querySelector<HTMLElement>('.about-tree__joint'))
    .filter((joint): joint is HTMLElement => Boolean(joint))

  if (joints.length < 2) return

  const spineJoint = root.querySelector<HTMLElement>('.about-tree__joint--spine')
  const spinePoint = spineJoint ? getJointCenter(spineJoint, svg) : getJointCenter(joints[0], svg)

  for (let i = 1; i < joints.length; i++) {
    const step = steps[i]
    const side = (step.dataset.side as 'left' | 'right' | 'center') || 'center'
    const from = i === 1 ? spinePoint : getJointCenter(joints[i - 1], svg)
    const to = getJointCenter(joints[i], svg)

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('class', PATH_CLASS)
    path.setAttribute('d', buildBranchPath(from, to, side))
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', 'var(--color-gold)')
    path.setAttribute('stroke-width', '2')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')
    path.setAttribute('opacity', '0.55')
    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 })
    pathsGroup.appendChild(path)
  }
}

export function initAboutTreeAnimation(root: HTMLElement) {
  if (prefersReducedMotion()) {
    gsap.set(root.querySelectorAll('.about-tree__node, .about-tree__cluster-item'), {
      opacity: 1,
      y: 0,
      scale: 1,
      clearProps: 'transform,opacity',
    })
    gsap.set(root.querySelectorAll(`.${PATH_CLASS}`), { opacity: 0.55 })
    gsap.set(root.querySelector('.about-tree__spine'), { scaleY: 1 })
    return () => {}
  }

  const onRefreshInit = () => rebuildPaths(root)
  ScrollTrigger.addEventListener('refreshInit', onRefreshInit)

  const ctx = gsap.context(() => {
    const spine = root.querySelector<HTMLElement>('.about-tree__spine')
    const steps = gsap.utils.toArray<HTMLElement>('.about-tree__step', root)

    rebuildPaths(root)

    const paths = () => gsap.utils.toArray<SVGPathElement>(`.${PATH_CLASS}`, root)

    paths().forEach((path) => {
      const length = path.getTotalLength()
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 })
    })

    gsap.set(root.querySelectorAll('.about-tree__node'), { opacity: 0, y: 36, scale: 0.96 })
    gsap.set(root.querySelectorAll('.about-tree__cluster-item'), { opacity: 0, y: 16 })
    if (spine) gsap.set(spine, { scaleY: 0, transformOrigin: 'top center' })

    const tl = gsap.timeline({
      defaults: { ease: REVEAL_EASE },
      scrollTrigger: {
        trigger: root,
        start: 'top 72%',
        end: 'bottom 28%',
        scrub: 1.15,
        invalidateOnRefresh: true,
      },
    })

    if (spine) {
      tl.to(spine, { scaleY: 1, duration: 1, ease: 'none' }, 0)
    }

    steps.forEach((step, index) => {
      const node = step.querySelector<HTMLElement>('.about-tree__node')
      const path = paths()[index - 1]
      const clusterItems = gsap.utils.toArray<HTMLElement>('.about-tree__cluster-item', step)
      const position = index === 0 ? 0 : `+=${index === 1 ? 0.22 : 0.28}`

      if (path) {
        tl.to(path, { strokeDashoffset: 0, opacity: 0.55, duration: 0.35, ease: 'none' }, position)
      }

      if (node) {
        tl.fromTo(
          node,
          { opacity: 0, y: 36, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45 },
          path ? '-=0.12' : position,
        )
      }

      if (clusterItems.length) {
        tl.fromTo(
          clusterItems,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.32, stagger: 0.035 },
          '-=0.08',
        )
      }
    })

    scheduleScrollRefresh()
  }, root)

  return () => {
    ScrollTrigger.removeEventListener('refreshInit', onRefreshInit)
    ctx.revert()
  }
}
