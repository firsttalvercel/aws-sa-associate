import type { Domain } from '../lib/types'

const DOMAIN_META: Record<Domain, { label: string; color: string }> = {
  1: { label: 'Secure', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  2: { label: 'Resilient', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  3: { label: 'High-Performing', color: 'bg-green-100 text-green-800 border-green-200' },
  4: { label: 'Cost-Optimized', color: 'bg-purple-100 text-purple-800 border-purple-200' },
}

export function DomainBadge({ domain }: { domain: Domain }) {
  const meta = DOMAIN_META[domain]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${meta.color}`}>
      D{domain}: {meta.label}
    </span>
  )
}

export function domainColor(domain: Domain): string {
  return DOMAIN_META[domain].color
}

export function domainLabel(domain: Domain): string {
  return DOMAIN_META[domain].label
}

export const DOMAIN_RING_COLORS: Record<Domain, string> = {
  1: 'stroke-orange-500',
  2: 'stroke-blue-500',
  3: 'stroke-green-500',
  4: 'stroke-purple-500',
}

export const DOMAIN_BG: Record<Domain, string> = {
  1: 'bg-orange-500',
  2: 'bg-blue-500',
  3: 'bg-green-500',
  4: 'bg-purple-500',
}
