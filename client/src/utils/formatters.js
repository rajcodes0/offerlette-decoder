export const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatRelativeDate = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(dateStr)
}

export const getRiskColor = (score) => {
  if (score <= 3) return 'var(--risk-green)'
  if (score <= 6) return 'var(--risk-yellow)'
  return 'var(--risk-red)'
}

export const getRiskLabel = (score) => {
  if (score <= 3) return 'Low Risk'
  if (score <= 6) return 'Medium Risk'
  return 'High Risk'
}

export const getRiskBadgeClass = (level) => {
  if (!level) return 'badge-purple'
  const l = level.toLowerCase()
  if (l === 'green' || l === 'low') return 'badge-green'
  if (l === 'yellow' || l === 'medium') return 'badge-yellow'
  if (l === 'red' || l === 'high') return 'badge-red'
  return 'badge-purple'
}

export const truncate = (str, n = 100) => {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}
