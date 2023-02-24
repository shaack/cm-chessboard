/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Extension, EXTENSION_POINT} from "../../model/Extension.js"

export class RenderVideo extends Extension {

    constructor(chessboard, props) {
        super(chessboard, props)
        this.props = {
            mediaType: "auto"
        }
        Object.assign(this.props, props)
        if(this.props.mediaType === "auto") {
            if(MediaRecorder.isTypeSupported("video/mp4")) {
                this.props.mediaType = "video/mp4"
            } else if(MediaRecorder.isTypeSupported("video/webm;codecs=H264")) {
                this.props.mediaType = "video/webm;codecs=H264"
            } else if(MediaRecorder.isTypeSupported("video/webm")) {
                this.props.mediaType = "video/webm"
            } else {
                console.error("no suitable mediaType found")
            }
        }
        console.log("recorder mediaType", this.props.mediaType)
        this.image = new Image()
        document.body.append(this.image)
        this.makeSpriteInline()
        this.registerExtensionPoint(EXTENSION_POINT.animation, () => {
            if (this.recorder && this.recorder.state === "recording") {
                setTimeout(() => {
                    this.cloneImageAndRender()
                })
            }
        })
        this.registerMethod("recorderInit", () => {
            return new Promise((resolve) => {
                let all = document.querySelectorAll("svg *")
                for (let i = 0; i < all.length; i++) {
                    this.transferComputedStyle(all[i])
                }
                const dimensions = this.chessboard.view.svg.getBBox()
                this.canvas = document.createElement("canvas")
                this.canvas.style.backgroundColor = "#000"
                this.canvas.style.display = "none"
                this.canvas.width = dimensions.width
                this.canvas.height = dimensions.height
                this.context = this.canvas.getContext('2d')
                document.body.append(this.canvas)

                this.image = new Image()
                this.image.width = this.canvas.width
                this.image.height = this.canvas.height
                this.image.style.position = "absolute"
                this.image.style.visibility = "hidden"
                document.body.append(this.image)

                this.stream = this.canvas.captureStream()
                this.recorder = new MediaRecorder(this.stream, {mimeType: this.props.mediaType})
                this.recorder.ondataavailable = (event) => {
                    if (event.data && event.data.size) {
                        this.recordedData.push(event.data)
                    }
                }
                setTimeout(() => {
                    resolve()
                }, 100)
            })
        })
        this.registerMethod("recorderStart", () => {
            return new Promise((resolve) => {
                if (this.recorder && this.recorder.state === "recording") {
                    console.error("recorder is running")
                    return
                }
                this.recordedData = []
                this.recorder.start()
                console.log("recorder", this.recorder.state)
                resolve()
            })
        })
        /**
         * returns the url of the recorded media
         */
        this.registerMethod("recorderStop", () => {
            return new Promise((resolve, reject) => {
                if (!this.recorder || this.recorder.state !== "recording") {
                    reject("recorder is not recording")
                }
                this.cloneImageAndRender()
                setTimeout(() => {
                    this.recorder.stop()
                    console.log("recorder", this.recorder.state)
                    resolve(URL.createObjectURL(new Blob(this.recordedData, {type: this.props.mediaType})))
                }, 200)
            })
        })
        this.registerMethod("recorderPause", (ms) => {
            return new Promise((resolve) => {
                this.cloneImageAndRender()
                const interval = setInterval(() => {
                    this.cloneImageAndRender()
                }, 20)
                setTimeout(() => {
                    clearInterval(interval)
                    this.cloneImageAndRender()
                    resolve()
                }, ms)
            })
        })
    }

    cloneImageAndRender() {
        if(this.rendering) {
            return
        }
        this.rendering = true
        let serialized = new XMLSerializer().serializeToString(this.chessboard.view.svg)
        const blob = new Blob([serialized], {type: "image/svg+xml"})
        const blobURL = URL.createObjectURL(blob)
        this.image.onload = () => {
            this.context.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height)
            this.recorder.requestData()
            this.rendering = false
        }
        this.image.src = blobURL
    }

    transferComputedStyle(element) {
        const computedStyle = getComputedStyle(element, null)
        for (let i = 0; i < computedStyle.length; i++) {
            const style = computedStyle[i] + ""
            if (["fill", "stroke", "stroke-width", "font-size"].includes(style)) {
                element.style[style] = computedStyle[style]
            }
        }
    }

    makeSpriteInline() {
        const wrapper = document.createElement("div")
        wrapper.style.display = "none"
        document.body.appendChild(wrapper)
        const svg = this.chessboard.view.svg
        const xhr = new XMLHttpRequest()
        xhr.open("GET", this.chessboard.props.sprite.url, true)
        xhr.onload = function () {
            const doc = new DOMParser().parseFromString(xhr.response, "text/xml")
            svg.prepend(doc.getElementById("Sprite-PD"))
        }
        xhr.send()
    }

}
