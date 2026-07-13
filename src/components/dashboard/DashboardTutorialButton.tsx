import { CircleHelp } from 'lucide-react'
import { Button } from '../ui/Button'
import './DashboardTutorialButton.css'

type DashboardTutorialButtonProps = {
  onClick: () => void
}

export function DashboardTutorialButton({ onClick }: DashboardTutorialButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="dashboard-tutorial-btn"
      onClick={onClick}
    >
      <CircleHelp size={16} aria-hidden="true" />
      Tutorial
    </Button>
  )
}
