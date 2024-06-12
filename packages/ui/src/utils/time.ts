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
  var d = Math.floor(seconds / (3600 * 24))
  var h = Math.floor((seconds % (3600 * 24)) / 3600)
  var m = Math.floor((seconds % 3600) / 60)
  var s = Math.floor(seconds % 60)

  var dDisplay = d > 0 ? d + (d == 1 ? ' d' : 'd ') : ''
  var hDisplay = h > 0 ? h + (h == 1 ? ' h' : 'h ') : ''
  var mDisplay = m > 0 ? m + (m == 1 ? ' m' : 'm ') : ''
  var sDisplay = s > 0 ? s + (s == 1 ? ' s' : 's ') : ''
  return `${dDisplay} ${hDisplay} ${mDisplay} ${sDisplay}`.trim()
}
