// import jquery
import $ from 'jquery';
import jQuery from 'jquery';
//// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

import CraftyBlock from './../CraftyBlock/CraftyBlock.js';
import CraftyBlockEvents from './../CraftyBlock/CraftyBlockEvents.js';

class InputMenu {
  constructor() {
  }


  create(block) {
    let removeVariable = 0;

    $('<div class="input-value-box"><p>Input value!</p><input id="input-value" type="text" /><input id="input-value-submit" class="buttons" type="button" value="submit-value" /></div>').appendTo("body");

    let input_value_box = $('.input-value-box');
    input_value_box.addClass('show');

    document.getElementById("input-value").autofocus = true;

    $('#input-value-submit').click( () => {
      this.inputValueSubmitted(block);
    });

    $("#input-value").keyup(event => {
        if(event.keyCode == 13){
          this.inputValueSubmitted(block);
        }
    });

    $('body').click(event => {
      console.log(removeVariable);
      if ($('.input-value-box').css('display') == 'block') {
        if (!$('.input-value-box').has(event.target).length) {
          if (removeVariable == 1) {
            removeVariable = 0;
            this.remove();
          } else {
            removeVariable = removeVariable + 1;
          }
        };
      };
    });
  }


  inputValueSubmitted(block) {
    let input_value_box = $('.input-value-box');
    let value = $('#input-value').val();

    if(value) {
      let constantBlock = CraftyBlock.constantWithValue(value);
      constantBlock.attachTo(block);
      if(input_value_box.className == "show") {
        this.remove();
      }
      CraftyBlockEvents.emit('canvaschange');
    }
  }

  remove() {
    let input_value_box = $('.input-value-box');

    input_value_box.addClass('hide');
    setTimeout( () => {
      $('.input-value-box').remove();
    }, 500);
  }
}

export default new InputMenu();
