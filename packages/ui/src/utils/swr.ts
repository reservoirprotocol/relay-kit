import { ComponentPropsWithoutRef } from 'react'
import { Cache, SWRConfig } from 'swr'

export const defaultFetcher = (params: string[] | string) => {
  let resource
  if (Array.isArray(params)) {
    resource = params[0]
  } else {
    resource = params
  }
  return fetch(resource)
    .then((res) => res.json())
    .catch((e) => {
      throw e
    })
}

const CACHE_KEY = 'relay.swr.cache'
const CACHE_KEY_TTL = 'relay.swr.cache-TTL'

export const localStorageProvider = (): Cache<any> => {
  let map = new Map([])
  let cacheTTL: Record<string, number> = {}
  try {
    map =
      typeof window !== 'undefined'
        ? new Map(JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'))
        : new Map([])
    cacheTTL =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem(CACHE_KEY_TTL) || '{}')
        : {}
    for (let key in cacheTTL) {
      const ttl: number = cacheTTL[key]
      const response = map.get(key) as any
      let purge = false
      if (Date.now() >= ttl) {
        purge = true
      } else if (
        !response ||
        (response.value &&
          response.data &&
          response.data.some((data: any) => !data))
      ) {
        purge = true
      }

      if (purge) {
        map.delete(key)
        delete cacheTTL[key]
      }
    }
  } catch (e) {
    console.warn('Failed to rehydrate SWR cache', e)
  }

  //Handlers to set TTL:
  const mapSet = map.set.bind(map)
  map.set = (key: unknown, value: unknown) => {
    const url = key as string
    if (url.includes('prices/rates')) {
      cacheTTL[url] = Date.now() + 60000 //1m
    } else {
      cacheTTL[url] = Date.now() + 60000 * 5 //5m
    }
    return mapSet(key, value)
  }

  // Before unloading the app, we write back all the data into `localStorage`.
  if (typeof window !== 'undefined') {
    //Allowlist of all domains or urls we want to cache locally
    window.addEventListener('beforeunload', () => {
      const cachedApis = ['/prices/rates']
      for (let url of map.keys()) {
        if (
          !cachedApis.some((cachedApi) => (url as string).includes(cachedApi))
        ) {
          map.delete(url)
        }
      }
      const appCache = JSON.stringify(Array.from(map.entries()))
      localStorage.setItem(CACHE_KEY_TTL, JSON.stringify(cacheTTL))
      localStorage.setItem(CACHE_KEY, appCache)
    })
  }

  // We still use the map for write & read for performance.
  return map as Cache<any>
}

export const swrDefaultOptions: ComponentPropsWithoutRef<
  typeof SWRConfig
>['value'] = {
  fetcher: defaultFetcher,
  revalidateOnFocus: false,
  provider: localStorageProvider
}
