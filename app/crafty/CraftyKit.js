import CraftyCodeEditor from './CraftyCodeEditor.js';

//  import jquery
import $ from 'jquery';
import jQuery from 'jquery';
//// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

// import editor styles
import "../styles/crafty.css";

// import for dropdown button
import "../styles/dropdown.css";

// import jquery.snow
import "../theme/snowfall.jquery.js";
import Flake from "./../theme/flake.png";

import InputMenu from "./../displayobjects/DOM/InputMenu.js";

import CraftyBlockEvents from "./../displayobjects/CraftyBlock/CraftyBlockEvents.js";

export default class CraftyKit {
    constructor() {
        this.craftyEditor = new CraftyCodeEditor();
        this.render();
    }

    render() {
        $(document).ready(() => {
            // snowing checkbox
            $('#checkbox-snowing').change(() => {
                if($('#checkbox-snowing').is(':checked')) {
                    console.log("checked!");
                    //Start the snow default options you can also make it snow in certain elements, etc.
                    $(document).snowfall({image :Flake, minSize: 10, maxSize:32, flakeCount : 30, maxSpeed : 3});
                } else {
                    console.log("no-checked!");
                    $(document).snowfall('clear'); // How you clear
                }
            });

            // spaceTile checkbox
            $('#checkbox-spacetile').change(() => {
                if($('#checkbox-spacetile').is(':checked')) {
                    CraftyBlockEvents.emit('setSpaceTile');
                } else {
                    CraftyBlockEvents.emit('setDefaultTile');
                }
            });

            // clean canvas
            $('#menu-clean-canvas').click(() => {
                CraftyBlockEvents.emit('cleancanvas');
            });

            /* print console.log message when change codes in code-area */
            $('.define-function').click(function() {
                let FuncName = prompt("Type in your new functions name!");
                let FuncInputNumber = prompt("Number of input");
                let FuncOutputNumber = prompt("Number of output");
                // makeNewFunc(FuncName, FuncInputNumber, FuncOutputNumber);
            });

            $('.live-preview').click(() => {
                this.craftyEditor.compile();
            });

            /* for dropdown menu */
            var dropdown = document.querySelectorAll('.dropdown');
            var dropdownArray = Array.prototype.slice.call(dropdown, 0);
            dropdownArray.forEach(function(el) {
                var button = el.querySelector('a[data-toggle="dropdown"]'),
                    menu = el.querySelector('.dropdown-menu'),
                    arrow = button.querySelector('i.icon-arrow');

                button.onclick = function(event) {
                    if (!menu.hasClass('show')) {
                        menu.classList.add('show');
                        menu.classList.remove('hide');
                        arrow.classList.add('open');
                        arrow.classList.remove('close');
                        event.preventDefault();
                    } else {
                        menu.classList.remove('show');
                        menu.classList.add('hide');
                        arrow.classList.remove('open');
                        arrow.classList.add('close');
                        event.preventDefault();
                    }
                };
            })
            Element.prototype.hasClass = function(className) {
                return this.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(this.className);
            };

        });
    }
}
