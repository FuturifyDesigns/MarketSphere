import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  to,
  children,
  className = '',
  onClick,
  'aria-disabled': ariaDisabled,
  ...props
}: ButtonProps) {
  const classes = `btn btn--${variant} btn--${size} ${className}`

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
        aria-disabled={ariaDisabled}
      >
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} onClick={onClick} aria-disabled={ariaDisabled} {...props}>
      {children}
    </button>
  )
}
