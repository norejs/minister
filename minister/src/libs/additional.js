import { appInstanceMap } from '../create_app'
import { elementInstanceMap } from '../minister_element'
import { releasePatches } from '../source/patch'
import { isShadowRoot } from './utils'
function unmountNestedApp () {
  replaseUnmountOfNestedApp()
  appInstanceMap.forEach(app => {
    let element = app.container
    if (element) {
      if (isShadowRoot(element)) {
        element = element.host
      }
      element.disconnectedCallback()
    }
  })
  if (!window.__MINI_APP_UMD_MODE__) { appInstanceMap.clear() }
  if (elementInstanceMap.size) {
    elementInstanceMap.clear()
    releasePatches()
  }
}
// 如果微应用运行在微应用中，当收到卸载事件时，删除所有的下一代应用
export function listenUmountOfNestedApp () {
  if (window.__MINI_APP_ENVIRONMENT__) {
    window.addEventListener('unmount', unmountNestedApp, false)
  }
}
// 释放 listener
export function replaseUnmountOfNestedApp () {
  if (window.__MINI_APP_ENVIRONMENT__) {
    window.removeEventListener('unmount', unmountNestedApp, false)
  }
}
