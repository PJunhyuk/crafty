import CraftyBlockEvents from './CraftyBlockEvents.js';

/**
 * CraftyBlock Animator Class
 *
 * Handles user interactions of crafty blocks
 * Emits required block edit on CraftyBlockEvents
 *
 * @exports new CraftyBlockAnimator instance
 */
class CraftyBlockAnimator {
    constructor() {
        this.dragging = false;
        this.targetBlock = null;
    }

    onMouseDown(event) {
        //  Prevent outer containers(ex. define blocks) from also emitting events
        event.stopPropagation();

        let block = event.target;

        //  trigger when the mouse is clicked inside the block
        let relativeMousePosition = event.data.getLocalPosition(block);
        if (block.isHit(relativeMousePosition)) {
            //  emit start of drag move
            CraftyBlockEvents.emit('dragready', block);

            //  store relative mouse position from block
            block.diff = event.data.getLocalPosition(block).clone();

            block.selected = true; // boolean used for narrowing event listening socpe
            block.isClick = true; // boolean for identifying whether user action is click or drag
        }
    }

    /**
     * mousemove event callback for general blocks
     */
    onMouseMove(event) {
        let block = event.target;

         if (block.selected)
         {
            //  set isClick to false since block started to move
            if (block.isClick) {
                block.isClick = false;
                this.dragging = true;
                CraftyBlockEvents.emit('dragstart', block);
            }

            //  move block to mouse position
            let newPosition = event.data.getLocalPosition(block.parent);
            block.position.x = newPosition.x - block.diff.x;
            block.position.y = newPosition.y - block.diff.y;

            CraftyBlockEvents.emit('dragging', block);
        }
    }

    /**
     * mouseup event callback for general blocks
     */
    onMouseUp(event) {
        let block = event.target;

        if (block.selected) {
            //  emit events according to type (click vs drag)
            if (block.isClick) {
                CraftyBlockEvents.emit('clickblock', block);
            } else {
                //  emit dragend event with data about targetBlock
                event.targetBlock = this.targetBlock;
                CraftyBlockEvents.emit('dragend', event);
                this.targetBlock = null;
            }

            block.selected = false;
            this.dragging = false;
        }
    }

    /**
     * placeholderBlock mousedown event callback
     */
    onPlaceholderStart(event) {
        let block = event.target;

        block.clicked = true;
    }

    /**
     * placeholderBlock mousemove event callback
     */
    onPlaceholderMove(event) {
        let block = event.target;

        //  trigger only while a block is being dragged
        if (this.dragging) {
            //  if mouse is over placeholder block, keep a reference for potential attaching
            let relativeMousePosition = event.data.getLocalPosition(block);
            if (block.isHit(relativeMousePosition)) {
                //  change tint on hover
                block.getChildAt(0).tint = 0xDDDDDD;
                this.targetBlock = block;
            } else {
                //  reset target block when no longer hovering over placeholder block
                if (block == this.targetBlock) {
                    this.targetBlock = null;
                }
                //  reset tint
                block.getChildAt(0).tint = 0xFFFFFF;
            }
        }
    }

    /**
     * placeholderBlock mouseup event callback
     */
    onPlaceholderEnd(event) {
        let block = event.target;

        if (block.clicked) {
            let relativeMousePosition = event.data.getLocalPosition(block);
            if (block.isHit(relativeMousePosition)) {
                CraftyBlockEvents.emit('clickplaceholder', block);
            }
            block.clicked = false;
        }
    }
}

export default new CraftyBlockAnimator();
