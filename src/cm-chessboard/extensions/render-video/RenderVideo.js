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
            mediaType: "video/webm;codecs=h264"
        }
        Object.assign(this.props, props)
        this.images = []
        this.makeSpriteInline()
        this.registerExtensionPoint(EXTENSION_POINT.animation, () => {
            // console.log("EXTENSION_POINT.animation", data)
            let clonedSvgElement = this.chessboard.view.svg.cloneNode(true)
            // this.makeStyleInline(clonedSvgElement)
            let serialized = new XMLSerializer().serializeToString(clonedSvgElement)
            // console.log(serialized)
            const blob = new Blob([serialized], {type: "image/svg+xml"})
            const blobURL = URL.createObjectURL(blob)
            const image = new Image()
            this.images.push(image)
            image.onload = (event) => {
                // console.log("onload", event)
                let context = this.canvas.getContext('2d')
                // console.log(image)
                context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
            }
            image.src = blobURL
        })
        this.registerMethod("recorderStart", () => {
            let all = document.querySelectorAll("svg *")
            for (let i = 0; i < all.length; i++) {
                this.transferComputedStyle(all[i])
            }
            const dimensions = this.chessboard.view.svg.getBBox()
            this.canvas = document.createElement("canvas")
            this.canvas.style.display = "none"
            this.canvas.width = dimensions.width
            this.canvas.height = dimensions.height
            document.body.append(this.canvas)
            this.stream = this.canvas.captureStream()
            this.recorder = new MediaRecorder(this.stream, {mimeType: this.props.mediaType})
            this.recordedData = []
            this.recorder.ondataavailable = (event) => {
                console.log(event)
                if (event.data && event.data.size) {
                    this.recordedData.push(event.data)
                }
            }
            this.recorder.start(0.1)
            console.log("recorder", this.recorder.state)
        })
        /**
         * returns the url of the recorded media
         */
        this.registerMethod("recorderStop", () => {
            this.recorder.stop()
            console.log("recorder", this.recorder.state)
            return URL.createObjectURL(new Blob(this.recordedData, {type: this.props.mediaType}))
        })
    }

    transferComputedStyle(element) {
        const computedStyle = getComputedStyle(element, null)
        for (let i = 0; i < computedStyle.length; i++) {
            const style = computedStyle[i] + ""
            if (style === "fill") {
                element.style[style] = computedStyle[style]
            }
        }
    }

    makeSpriteInline() {
        const wrapper = document.createElement("div")
        wrapper.style.display = "none"
        // wrapper.id = "wrapperId"
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
