import type { RangeMode } from '../types'
import semver from 'semver'

export function getVersionRangePrefix(v: string) {
  const leadings = ['>=', '<=', '>', '<', '~', '^']
  const ver = v.trim()

  if (ver === '*' || ver === '')
    return '*'
  if (ver[0] === '~' || ver[0] === '^')
    return ver[0]
  for (const leading of leadings) {
    if (ver.startsWith(leading))
      return leading
  }
  if (ver.includes('x')) {
    const parts = ver.split('.')
    if (parts[0] === 'x')
      return '*'
    if (parts[1] === 'x')
      return '^'
    if (parts[2] === 'x')
      return '~'
  }
  if (+ver[0] < 10)
    return ''
  return null
}

export function changeVersionRange(version: string, mode: Exclude<RangeMode, 'latest' | 'newest' | 'next'>) {
  if (!semver.validRange(version))
    return null

  if (mode === 'default')
    return version

  const min = semver.minVersion(version)
  if (!min)
    return null

  return {
    major: '>=',
    minor: '^',
    patch: '~',
  }[mode] + min
}

export function applyVersionRangePrefix(version: string | null, prefix: string | null) {
  if (version == null || prefix == null)
    return null

  if (prefix === '*')
    return '*'

  return prefix + version
}

export function getPrefixedVersion(current: string, target: string) {
  const prefix = getVersionRangePrefix(current)
  return applyVersionRangePrefix(
    target,
    prefix,
  )
}

export function getMaxSatisfying(versions: string[], current: string, mode: RangeMode, tags: Record<string, string>): string | undefined {
  let version = null

  if (mode === 'latest') {
    version = tags.latest
  }
  else if (mode === 'newest') {
    version = versions[versions.length - 1]
  }
  else if (mode === 'next') {
    version = tags.next
  }
  else if (mode === 'default' && (current === '*' || current.trim() === '')) {
    return
  }
  else {
    const range = changeVersionRange(current, mode)
    if (!range)
      throw new Error('invalid_range')

    version = semver.maxSatisfying(versions, range, { includePrerelease: true })
  }

  if (!version)
    return

  return version
}
