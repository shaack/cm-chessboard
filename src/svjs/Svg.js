/**
 * Author: shaack
 * Date: 23.11.2017
 */

const NAMESPACE = "http://www.w3.org/2000/svg";

export class Svg {

    /**
     * create the Svg in the HTML DOM
     * @param containerElement
     * @returns {Element}
     */
    static createSvg(containerElement) {
        let svg = document.createElementNS(NAMESPACE, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        containerElement.appendChild(svg);
        return svg;
    }

    /**
     * @param parent
     * @param name
     * @param attributes
     * @returns {Element}
     */
    static addElement(parent, name, attributes) {
        let element = document.createElementNS(NAMESPACE, name);
        for (let attribute in attributes) {
            element.setAttribute(attribute, attributes[attribute]);
        }
        parent.appendChild(element);
        return element;
    }

    /**
     * @param element
     */
    static removeElement(element) {
        element.parentNode.removeChild(element);
    }

    /**
     * Load sprite into html document (as `svg/defs), elements can be referenced by `use` from all Svgs in page
     * @param url
     * @param elementIds array of element-ids, relevant for `use` in the svgs
     * @param callback called after successful load, parameter is the svg element
     */
    static loadSprite(url, elementIds, callback) {
        const request = new XMLHttpRequest();
        request.open("GET", url);
        request.send();
        request.onload = () => {
            const response = request.response;
            const parser = new DOMParser();
            const svgDom = parser.parseFromString(response, "image/svg+xml");
            if (svgDom.childNodes[0].nodeName !== "svg") {
                console.error("error loading svg, not valid, root node must be <svg>");
            }
            // add relevant nodes to sprite-svg
            const spriteSvg = this.createSvg(document.body);
            spriteSvg.setAttribute("style", "display: none");
            spriteSvg.removeAttribute("width");
            spriteSvg.removeAttribute("height");
            const defs = this.addElement(spriteSvg, "defs");
            // filter relevant nodes
            new Set(elementIds).forEach((elementId) => {
                let elementNode = svgDom.getElementById(elementId);
                if (!elementNode) {
                    console.error("error, node id=" + elementId + " not found in sprite");
                } else {
                    // remove transform
                    elementNode.removeAttribute("transform");
                    if (!elementNode.hasAttribute("fill")) {
                        elementNode.setAttribute("fill", "none"); // bugfix for Sketch SVGs
                    }
                    // filter all ids in childs of the node
                    let filterChilds = (childNodes) => {
                        childNodes.forEach((childNode) => {
                            if (childNode.nodeType === Node.ELEMENT_NODE) {
                                childNode.removeAttribute("id");
                                if (childNode.hasChildNodes()) {
                                    filterChilds(childNode.childNodes);
                                }
                            }
                        });
                    };
                    filterChilds(elementNode.childNodes);
                    defs.appendChild(elementNode);
                }
            });
            callback(spriteSvg);
        };
    }
}