import './Marquee.css'

interface MarqueeProps {
  items: string[]
  speed?: 'slow' | 'normal'
}

export function Marquee({ items, speed = 'normal' }: MarqueeProps) {
  const text = items.join('  ·  ')
  return (
    <div className={`marquee marquee--${speed}`}>
      <div className="marquee__track">
        <span>{text}</span>
        <span aria-hidden="true">{text}</span>
      </div>
    </div>
  )
}
