/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export class Extension {

    constructor(props) {
        this.props = props
    }

    // overwrite these methods to have access on extension points
    positionChanged() {
    }

    redrawBoard() {
    }

    destroy() {
    }

}