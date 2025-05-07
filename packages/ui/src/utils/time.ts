import dayjs from 'dayjs'
import time from 'dayjs/plugin/relativeTime.js'

dayjs.extend(time)

export const relativeTime = (
  timeString?: string | number,
  from?: string | number,
  withoutSuffix?: boolean
): string => {
  return from
    ? `${dayjs(timeString).from(from, withoutSuffix)}`
    : `${dayjs(timeString).fromNow(withoutSuffix)}`
}

export const formatSeconds = (seconds: number): string => {
  seconds = Number(seconds)
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const dDisplay = d > 0 ? d + (d == 1 ? ' d' : 'd ') : ''
  const hDisplay = h > 0 ? h + (h == 1 ? ' h' : 'h ') : ''
  const mDisplay = m > 0 ? m + (m == 1 ? ' m' : 'm ') : ''
  const sDisplay = s > 0 ? s + (s == 1 ? ' s' : 's ') : ''
  return `${dDisplay} ${hDisplay} ${mDisplay} ${sDisplay}`.trim()
}

export const get15MinuteInterval = () => {
  const now = new Date()
  const minutes = now.getUTCMinutes()
  const interval = Math.floor(minutes / 15)
  const intervalStart = new Date(now)
  intervalStart.setUTCMinutes(interval * 15, 0, 0)
  return intervalStart.getTime()
}
