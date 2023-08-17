import { isFunction } from '../libs/utils'
import microApp from '../minister'
/**
 * 请求资源 html, js, css
 * @param url source path
 * @param appName app name
 * @param config config of fetch
 */
export function fetchSource (url, appName = null, options = {}) {
  if (isFunction(microApp.fetch)) {
    return microApp.fetch(url, options, appName)
  }
  return fetch(url, options).then((res) => {
    return res.text()
  })
}
