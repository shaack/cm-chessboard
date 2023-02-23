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
        this.images = []
        this.makeSpriteInline()
        this.registerExtensionPoint(EXTENSION_POINT.animation, (event) => {
            if (this.recorder && this.recorder.state === "recording") {
                setTimeout(() => {
                    this.cloneImageAndRender()
                })
            }
        })
        this.registerMethod("recorderStart", () => {
            if (this.recorder && this.recorder.state === "recording") {
                console.error("recorder is running")
                return
            }
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
            return new Promise((resolve, reject) => {
                if (!this.recorder || this.recorder.state !== "recording") {
                    reject("recorder is not recording")
                }
                this.recorder.requestData()
                setTimeout(() => {
                    this.recorder.stop()
                    console.log("recorder", this.recorder.state)
                    resolve(URL.createObjectURL(new Blob(this.recordedData, {type: this.props.mediaType})))
                }, 100)
            })
        })
    }

    cloneImageAndRender() {
        let serialized = new XMLSerializer().serializeToString(this.chessboard.view.svg)
        const blob = new Blob([serialized], {type: "image/svg+xml"})
        const blobURL = URL.createObjectURL(blob)
        // console.log(blobURL)
        const image = new Image()
        // needed for safari
        image.width = this.canvas.width
        image.height = this.canvas.height
        image.style.position = "absolute"
        image.style.visibility = "hidden"
        //
        document.body.append(image)
        image.onload = () => {
            this.contect.drawImage(image, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height)
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
