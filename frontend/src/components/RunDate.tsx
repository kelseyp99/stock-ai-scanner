import React from 'react'

interface RunDateProps {
  value?: string | null
  label?: string
  className?: string
}

export function formatRunDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export default function RunDate({ value, label = 'Run', className = '' }: RunDateProps) {
  const formatted = formatRunDate(value)
  if (!formatted) return null
  return (
    <div className={`text-xs text-slate-400 ${className}`}>
      {label} {formatted}
    </div>
  )
}
