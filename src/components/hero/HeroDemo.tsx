import { motion } from 'framer-motion'
import { Search, Check } from 'lucide-react'
import './HeroDemo.css'

export function HeroDemo() {
  return (
    <div className="hero-demo">
      <div className="hero-demo__frame">
        <div className="hero-demo__bar">
          <span /><span /><span />
        </div>
        <div className="hero-demo__content">
          <motion.div
            className="hero-demo__search"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Search size={14} />
            <motion.span
              animate={{ width: ['0%', '70%', '70%', '0%'] }}
              transition={{ duration: 7.5, repeat: Infinity, times: [0, 0.25, 0.5, 0.75] }}
            >
              tutoring in Gaborone
            </motion.span>
          </motion.div>

          <motion.div
            className="hero-demo__card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, 12] }}
            transition={{ duration: 7.5, repeat: Infinity, times: [0, 0.3, 0.55, 0.75] }}
          >
            <div className="hero-demo__avatar">A</div>
            <div>
              <strong>Academic Excellence</strong>
              <small>Gaborone · Tuition</small>
            </div>
          </motion.div>

          <motion.button
            className="hero-demo__cta"
            animate={{
              scale: [1, 1.05, 1, 1],
              boxShadow: [
                '0 0 0 0 rgba(201,162,75,0)',
                '0 0 0 8px rgba(201,162,75,0.2)',
                '0 0 0 0 rgba(201,162,75,0)',
                '0 0 0 0 rgba(201,162,75,0)',
              ],
            }}
            transition={{ duration: 7.5, repeat: Infinity, times: [0, 0.45, 0.55, 0.75] }}
          >
            Sign Up
          </motion.button>

          <motion.div
            className="hero-demo__check"
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.5, 0.5, 1, 1, 0.5] }}
            transition={{ duration: 7.5, repeat: Infinity, times: [0, 0.55, 0.65, 0.85, 1] }}
          >
            <Check size={20} />
            <span>Enquiry sent!</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
