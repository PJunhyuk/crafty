// import jquery
import $ from 'jquery';
import jQuery from 'jquery';
//// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

class InputMenu {
  constructor() {

  }

  create() {
    $('<div id="input-value-box"><p>Input value!</p><input id="input-value" type="text" autofocus /><input id="input-value-submit" class="buttons" type="button" value="submit-value" /></div>').appendTo("body");
  }

  show() {
    let input_value_box = document.getElementById("input-value-box");
    input_value_box.className = "show";

    $('#input-value-submit').click( () => {
      this.inputValueSubmitted();
    });

    $("#input-value").keyup(event => {
        if(event.keyCode == 13){
          this.inputValueSubmitted();
        }
    });


  }

  remove() {
    $('#input-value-box').remove();
  }

  inputValueSubmitted() {
    let input_value_box = document.getElementById("input-value-box");
    let value = $('#input-value').val();
    console.log(value);
    if(input_value_box.className == "show") {
      input_value_box.className = "hide";
      setTimeout( () => {
        input_value_box.className = "";
        this.remove();
      }, 500);
    }
  }
}

export default new InputMenu();
