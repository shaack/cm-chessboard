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
            mediaType: "video/webm;codecs=H264"
        }
        Object.assign(this.props, props)
        this.images = []
        this.makeSpriteInline()
        this.registerExtensionPoint(EXTENSION_POINT.animation, (event) => {
            // console.log(event)
            if (this.recorder && this.recorder.state === "recording") {
                setTimeout(() => {
                    this.cloneImageAndRender()
                })
            }
        })
        this.registerMethod("recorderStart", () => {
            if(this.recorder && this.recorder.state === "recording") {
                console.error("recorder is running")
                return
            }
            let all = document.querySelectorAll("svg *")
            for (let i = 0; i < all.length; i++) {
                this.transferComputedStyle(all[i])
            }
            const dimensions = this.chessboard.view.svg.getBBox()
            this.canvas = document.createElement("canvas")
            this.canvas.style.display = "none"
            this.canvas.width = dimensions.width
            this.canvas.height = dimensions.height
            this.contect = this.canvas.getContext('2d')
            document.body.append(this.canvas)
            this.stream = this.canvas.captureStream()
            this.recorder = new MediaRecorder(this.stream, {mimeType: this.props.mediaType})
            this.recordedData = []
            this.recorder.ondataavailable = (event) => {
                if (event.data && event.data.size) {
                    this.recordedData.push(event.data)
                }
            }
            this.recorder.start()
            setTimeout(() => {
                this.cloneImageAndRender()
            }, 50)
            console.log("recorder", this.recorder.state)
        })
        /**
         * returns the url of the recorded media
         */
        this.registerMethod("recorderStop", () => {
            if(!this.recorder || this.recorder.state !== "recording") {
                console.error("recorder is not recording")
                return
            }
            this.recorder.requestData()
            this.recorder.stop()
            console.log("recorder", this.recorder.state)
            return URL.createObjectURL(new Blob(this.recordedData, {type: this.props.mediaType}))
        })
    }

    cloneImageAndRender() {
        let serialized = new XMLSerializer().serializeToString(this.chessboard.view.svg)
        const blob = new Blob([serialized], {type: "image/svg+xml"})
        const blobURL = URL.createObjectURL(blob)
        const image = new Image()
        image.onload = () => {
            this.contect.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
            this.recorder.requestData()
        }
        image.src = blobURL
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
