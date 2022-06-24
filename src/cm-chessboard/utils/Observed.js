/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export function Observed(target) {
    const self = this
    this.target = target
    this.observers = []
    this.target.addObserver = (callback, propertyName = undefined) => {
        self.observers.push({callback: callback, property: propertyName})
        // console.log(this.observers)
    }
    this.target.destruct = () => {
        self.observers = []
    }
    this.proxy = new Proxy(this.target, {
        set(target, property, value) {
            const oldValue = target[property]
            target[property] = value
            // console.log("set", "property", property, "value", value)
            for (const observer of self.observers) {
                if (!observer.property || observer.property === property) {
                    observer.callback({
                        target: target,
                        property: property,
                        value: value,
                        oldValue: oldValue
                    })
                }
            }
            return true
        }
    })
    return this.proxy
}
