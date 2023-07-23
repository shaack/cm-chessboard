/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

export class Svg {

    /**
     * create the Svg in the HTML DOM
     * @param containerElement
     * @returns {Element}
     */
    static createSvg(containerElement = undefined) {
        let svg = document.createElementNS(SVG_NAMESPACE, "svg")
        if (containerElement) {
            svg.setAttribute("width", "100%")
            svg.setAttribute("height", "100%")
            containerElement.appendChild(svg)
        }
        return svg
    }

    /**
     * Add an Element to an SVG DOM
     * @param parent
     * @param name
     * @param attributes
     * @returns {Element}
     */
    static addElement(parent, name, attributes = {}) {
        let element = document.createElementNS(SVG_NAMESPACE, name)
        if (name === "use") {
            attributes["xlink:href"] = attributes["href"] // fix for safari
        }
        for (let attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                if (attribute.indexOf(":") !== -1) {
                    const value = attribute.split(":")
                    element.setAttributeNS("http://www.w3.org/1999/" + value[0], value[1], attributes[attribute])
                } else {
                    element.setAttribute(attribute, attributes[attribute])
                }
            }
        }
        parent.appendChild(element)
        return element
    }

    /**
     * Remove an element from an SVG DOM
     * @param element
     */
    static removeElement(element) {
        if(!element) {
            console.warn("removeElement, element is", element)
            return
        }
        if (element.parentNode) {
            element.parentNode.removeChild(element)
        } else {
            console.warn(element, "without parentNode")
        }
    }

}
