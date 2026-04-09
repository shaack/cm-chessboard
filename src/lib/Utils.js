/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export class Utils {

    static delegate(element, eventName, selector, handler) {
        const eventListener = function (event) {
            let target = event.target
            while (target && target !== this) {
                if (target.matches(selector)) {
                    handler.call(target, event)
                }
                target = target.parentNode
            }
        }
        element.addEventListener(eventName, eventListener)
        return {
            remove: function () {
                element.removeEventListener(eventName, eventListener)
            }
        }
    }

    static mergeObjects(target, source) {
        const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj)
        if (!isObject(target) || !isObject(source)) {
            return source
        }
        const result = Object.assign({}, target)
        for (const key of Object.keys(source)) {
            if (isObject(source[key]) && isObject(target[key])) {
                result[key] = Utils.mergeObjects(target[key], source[key])
            } else {
                result[key] = source[key]
            }
        }
        Object.assign(target, result)
        return target
    }

    static createDomElement(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstChild
    }

    static createTask() {
        let resolve, reject
        const promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve
            reject = _reject
        })
        promise.resolve = resolve
        promise.reject = reject
        return promise
    }

    static isAbsoluteUrl(url) {
        return url.indexOf("://") !== -1 || url.startsWith("/")
    }

}
