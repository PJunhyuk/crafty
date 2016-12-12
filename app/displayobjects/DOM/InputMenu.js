// import jquery
import $ from 'jquery';
import jQuery from 'jquery';
//// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

import CraftyBlock from './../CraftyBlock/CraftyBlock.js';

import CraftyKit from './../../crafty/CraftyKit.js';

class InputMenu {
    constructor() {
        this.removeVariable = 0;
    }


    create(block) {
        $('<div class="input-value-box"><p>Input value!</p><input id="input-value" type="text" /><input id="input-value-submit" class="buttons" type="button" value="submit-value" /></div>').appendTo("body");

        let input_value_box = $('.input-value-box');
        input_value_box.addClass('show');

        document.getElementById("input-value").autofocus = true;

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
        let input_value_box = $('.input-value-box');
        let value = $('#input-value').val();

        if (value) {
            let constantBlock = CraftyBlock.constantWithValue(value);
            constantBlock.attachTo(block);
            if (input_value_box.hasClass('show')) {
                this.remove();
            }
        }
    }

    remove() {
        let input_value_box = $('.input-value-box');
        input_value_box.addClass('hide');
        this.removeVariable = 0;
        setTimeout(() => {
            $('.input-value-box').remove();
        }, 500);
    }
}

export default new InputMenu();
