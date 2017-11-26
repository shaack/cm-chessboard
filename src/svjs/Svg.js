/**
 * Author: shaack
 * Date: 23.11.2017
 */

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

if (typeof NodeList.prototype.forEach !== "function") { // IE
    NodeList.prototype.forEach = Array.prototype.forEach;
}

export class Svg {

    /**
     * create the Svg in the HTML DOM
     * @param containerElement
     * @returns {Element}
     */
    static createSvg(containerElement) {
        let svg = document.createElementNS(SVG_NAMESPACE, "svg");
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
        let element = document.createElementNS(SVG_NAMESPACE, name);
        if (name === "use") {
            attributes["xlink:href"] = attributes["href"]; // fix for safari
        }
        for (let attribute in attributes) {
            if (attribute.indexOf(":") !== -1) {
                const value = attribute.split(":");
                element.setAttributeNS("http://www.w3.org/1999/" + value[0], value[1], attributes[attribute]);
            } else {
                element.setAttribute(attribute, attributes[attribute]);
            }
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
     * @param grid the grid size of the sprite
     */
    static loadSprite(url, elementIds, callback, grid = 1) {
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
            elementIds.forEach((elementId) => {
                let elementNode = svgDom.getElementById(elementId);
                if (!elementNode) {
                    console.error("error, node id=" + elementId + " not found in sprite");
                } else {
                    const transformList = elementNode.transform.baseVal;
                    for (let i = 0; i < transformList.numberOfItems; i++) {
                        const transform = transformList.getItem(i);
                        // re-transform items on grid
                        if (transform.type === 2) {
                            transform.setTranslate(transform.matrix.e % grid, transform.matrix.f % grid);
                        }
                    }
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