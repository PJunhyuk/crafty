// import jquery
import $ from 'jquery';
import jQuery from 'jquery';
//// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

import CraftyBlock from './../CraftyBlock/CraftyBlock.js';
import CraftyBlockEvents from './../CraftyBlock/CraftyBlockEvents.js';
import CraftyKit from './../../crafty/CraftyKit.js';

class InputMenu {
    constructor() {
    }

    create(block) {
        $('<div id="input-value-box" class="modal"><div class="modal-content"><div class="modal-header"><span class="modal-close">&times;</span><h3>Input value!</h3></div><div class="modal-body"><input id="input-value" type="text" /></div><div class="modal-footer"><input id="input-value-submit" class="buttons" type="button" value="submit-value" /></div></div></div>').appendTo("body");

        let modal = document.getElementById('input-value-box');
        let close_button = document.getElementsByClassName("modal-close")[1];

        modal.style.display = "block";

        close_button.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        document.getElementById("input-value").focus();

        $('#input-value-submit').click(() => {
            this.inputValueSubmitted(block);
        });

        $("#input-value").keyup(event => {
            if (event.keyCode == 13) {
                this.inputValueSubmitted(block);
            }
        });
    }

    inputValueSubmitted(block) {
        let value = $('#input-value').val();
        if (value) {
            block.renameConstant(value);
            let modal = document.getElementById('input-value-box');
            modal.style.display = "none";
            CraftyBlockEvents.emit('canvaschange');
        }
        this.remove();
    }

    remove() {
        $('.modal').remove();
    }
}

export default new InputMenu();
