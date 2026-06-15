/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export class Utils {

    static delegate(element, eventName, selector, handler) {
        const eventListener = function (event) {
            const match = event.target.closest(selector)
            if (match && this.contains(match)) {
                handler.call(match, event)
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
        const isObject = (obj) => obj && typeof obj === 'object'
        if (!isObject(target) || !isObject(source)) {
            return source
        }
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object) {
                Object.assign(source[key], Utils.mergeObjects(target[key], source[key]))
            }
        }
        Object.assign(target || {}, source)
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
