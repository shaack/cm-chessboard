/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR} from "../../Chessboard.js"

/**
 * Rotates the piece glyphs in place, by any angle, optionally animated —
 * either all pieces or only those of one color. The squares and the position
 * stay untouched, only the glyphs turn around their own center. Useful for
 * over-the-board play on a tablet lying flat between two players: rotate the
 * pieces by 180 degrees towards the player to move.
 *
 * The rotation is implemented as an additional SVGTransform appended to each
 * piece's `use` element, after the translate and scale the view sets there.
 * Appended last, it rotates in sprite coordinates around the tile center, so
 * it composes with any piece position and survives the move animations, which
 * only touch the translate of the surrounding group. A MutationObserver
 * re-applies the angles to freshly drawn pieces, so the rotation survives
 * redraws and position changes from any code path.
 *
 * Registers two methods on the chessboard:
 *
 *   // rotate all pieces, animated
 *   chessboard.setPiecesRotation(180)
 *   // rotate only the black pieces, not animated
 *   chessboard.setPiecesRotation(180, {color: COLOR.black, animated: false})
 *   // returns a Promise, resolved when the rotation is shown
 *   await chessboard.setPiecesRotation(0)
 *
 *   chessboard.getPiecesRotation(COLOR.white) // current target angle
 */
export class PieceRotation extends Extension {

    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = {
            angle: 0, // the initial rotation angle in degrees, for all pieces
            animationDuration: 300 // duration of an animated rotation in milliseconds
        }
        Object.assign(this.props, props)
        this.angles = {w: this.props.angle, b: this.props.angle}
        this.targetAngles = {w: this.props.angle, b: this.props.angle}
        this.animations = {w: null, b: null}

        // Redraws and animations replace the piece elements with fresh ones
        // without the rotation, and they do so from several code paths — some
        // of them after all extension points have fired (redrawPieces runs in
        // the animation queue's callback). A MutationObserver on the pieces
        // group catches every new element, no matter which path created it.
        this.observer = new MutationObserver(() => {
            this.applyAngles()
        })
        this.observer.observe(chessboard.view.piecesGroup, {childList: true, subtree: true})
        this.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.observer.disconnect()
            this.cancelAnimation(COLOR.white)
            this.cancelAnimation(COLOR.black)
        })

        chessboard.setPiecesRotation = this.setPiecesRotation.bind(this)
        chessboard.getPiecesRotation = this.getPiecesRotation.bind(this)
        if (this.props.angle !== 0) {
            this.applyAngles()
        }
    }

    /**
     * Rotate pieces to `angle` degrees. Returns a Promise which resolves when
     * the rotation is shown, after the animation if animated.
     *
     * @param angle target angle in degrees
     * @param props {color: COLOR.white|COLOR.black|undefined, animated: true}
     *              without `color` all pieces are rotated
     */
    setPiecesRotation(angle, props = {}) {
        const {color = undefined, animated = true} = props
        const colors = color ? [color] : [COLOR.white, COLOR.black]
        const promises = colors.map((rotatedColor) => this.rotateColor(rotatedColor, angle, animated))
        return Promise.all(promises)
    }

    /**
     * The current target angle of a color's pieces.
     */
    getPiecesRotation(color = COLOR.white) {
        return this.targetAngles[color]
    }

    // -- internal ------------------------------------------------------------

    rotateColor(color, angle, animated) {
        this.targetAngles[color] = angle
        this.cancelAnimation(color)
        if (!animated || this.props.animationDuration <= 0 || angle === this.angles[color]) {
            this.angles[color] = angle
            this.applyAngles()
            return Promise.resolve()
        }
        return new Promise((resolve) => {
            const startAngle = this.angles[color]
            let startTime = null
            const animation = {resolve}
            const step = (time) => {
                if (!this.chessboard.state) { // board was destroyed
                    return
                }
                if (startTime === null) {
                    startTime = time
                }
                const t = Math.min(1, (time - startTime) / this.props.animationDuration)
                const progress = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOut
                this.angles[color] = startAngle + (angle - startAngle) * progress
                this.applyAngles()
                if (t < 1) {
                    animation.frameHandle = requestAnimationFrame(step)
                } else {
                    this.animations[color] = null
                    resolve()
                }
            }
            animation.frameHandle = requestAnimationFrame(step)
            this.animations[color] = animation
        })
    }

    /**
     * A superseded animation stops where it is, its promise resolves. The new
     * rotation starts from the currently shown angle.
     */
    cancelAnimation(color) {
        const animation = this.animations[color]
        if (animation) {
            cancelAnimationFrame(animation.frameHandle)
            animation.resolve()
            this.animations[color] = null
        }
    }

    applyAngles() {
        const center = this.chessboard.props.style.pieces.tileSize / 2
        const groups = this.chessboard.view.piecesGroup.querySelectorAll("g[data-piece]")
        for (const group of groups) {
            const color = group.getAttribute("data-piece").charAt(0)
            const piece = group.querySelector("use.piece")
            if (piece) {
                this.rotateElement(piece, this.angles[color], center)
            }
        }
    }

    /**
     * The rotation is the transform appended after the ones the view sets, its
     * index in the list is stored on the element. The item is addressed by
     * position, not by a retained object reference: WebKit returns fresh
     * wrapper objects from `getItem`, an identity check would report the
     * transform as lost on every call and stale rotations would pile up.
     */
    rotateElement(element, angle, center) {
        const list = element.transform.baseVal
        let index = parseInt(element.getAttribute("data-rotation-index"), 10)
        if (isNaN(index) || index >= list.numberOfItems) {
            index = list.numberOfItems
            list.appendItem(element.ownerSVGElement.createSVGTransform())
            element.setAttribute("data-rotation-index", index)
        }
        list.getItem(index).setRotate(angle, center, center)
    }
}
