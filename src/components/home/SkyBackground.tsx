import './SkyBackground.css'

export function SkyBackground() {
  return (
    <div className="sky-bg" aria-hidden="true">
      <div className="sky-bg__layer sky-bg__dawn" />
      <div className="sky-bg__layer sky-bg__dusk" />
      <div className="sky-bg__layer sky-bg__night" />
      <div className="sky-bg__grain" />
      <div className="sky-bg__glow sky-bg__glow--1" />
      <div className="sky-bg__glow sky-bg__glow--2" />
    </div>
  )
}
