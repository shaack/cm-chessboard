/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-web-modules
 * License: MIT, see file 'LICENSE'
 *
 * Thanks to markosyan for the idea
 * https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
 */

export class PromiseQueue {

    constructor() {
        this.queue = []
        this.workingOnPromise = false
        this.stop = false
    }

    async enqueue(promise) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                promise, resolve, reject,
            })
            this.dequeue()
        })
    }

    dequeue() {
        if (this.workingOnPromise) {
            return
        }
        if (this.stop) {
            this.queue = []
            this.stop = false
            return
        }
        const entry = this.queue.shift()
        if (!entry) {
            return
        }
        try {
            this.workingOnPromise = true
            entry.promise().then((value) => {
                this.workingOnPromise = false
                entry.resolve(value)
                this.dequeue()
            }).catch(err => {
                this.workingOnPromise = false
                entry.reject(err)
                this.dequeue()
            })
        } catch (err) {
            this.workingOnPromise = false
            entry.reject(err)
            this.dequeue()
        }
        return true
    }

}
