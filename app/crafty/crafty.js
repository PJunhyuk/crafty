import PastelEvaluator from "./../pastel/evaluator.js";
import PastelError from "./../pastel/error.js";
import Parser from './../pastel/parser.js';
import CraftyStore from './../stores/CraftyStore.js';

// import ace for syntax highlighting
import ace from 'brace';

import 'brace/theme/monokai';
import '../editor/mode-pastel.js';

// import jquery
import $ from 'jquery';
import jQuery from 'jquery';
//// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

//  import editor styles
import "./crafty.css";

// import jquery.snow
import "../theme/jquery.snow.js";

class Crafty {
  constructor() {
    this.checkDeleteBtn;
    /* pastel compiler toolkit */
    this.compileToolkit = {};
  }

  render() {
    // start snow!
    $(document).ready( function(){
        $.fn.snow();
    });

    /* pastel syntax highlighting parts */
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/pastel");
    editor.on('change', () => this.compileTest() );

    $(document).ready(() => {
      /* print console.log message when change codes in code-area */
      $('.define-function').click(function() {
        let FuncName = prompt("Type in your new functions name!");
        let FuncInputNumber = prompt("Number of input");
        let FuncOutputNumber = prompt("Number of output");
        // makeNewFunc(FuncName, FuncInputNumber, FuncOutputNumber);
      });

      $('.live-preview').click(() => {
        this.compile();
      });
    });

    this.compileToolkit.evaluator = new PastelEvaluator();
    this.compileToolkit.parser = new Parser();
    this.compileToolkit.CraftyStore = CraftyStore;
    this.compileToolkit.isError = function(result) {
    	return result instanceof PastelError;
    }
  }

  compileTest() {
    var editor = ace.edit("editor");
    var compilableText = editor.getValue();
    var result = this.compileToolkit.evaluator.evaluateText(compilableText);
    if (this.compileToolkit.isError(result)) {
      console.log("code-error");
      $('#compile-message').text(result.message);
      var message = document.getElementById("compile-message");
      message.className = "show";
    } else {
      var message = document.getElementById("compile-message");
      var tree = this.compileToolkit.parser.analyze(compilableText);
      this.compileToolkit.CraftyStore.set('tree', tree);
      this.compileToolkit.CraftyStore.emitChange();
      if(message.className == "show") {
        message.className = "hide";
        setTimeout(function() {
          message.className = "";
        }, 500);
      }
    }
  }

  compile() {
    console.log("compile!");
    var editor = ace.edit("editor");
    var compilableText = editor.getValue();
    var result = this.compileToolkit.evaluator.evaluateText(compilableText);
    if (this.compileToolkit.isError(result)) {
      $('#compile-message').text(result.message);
      var message = document.getElementById("compile-message");
      message.className = "show";
      alert("ERROR - check error message!");
    } else {
      alert(result);
    }
  }

  canvasChanged(BlockInfoList) {
    /* remove existing pre */
    $('.code-area').remove();

    /* make new pre, and attach it on code-area-container */
    var newPre = document.createElement("PRE");
    var i;
    for (i = 1; i <= BlockInfoList.length; i++) {
      var newText = document.createTextNode(BlockInfoList[i - 1]);
      newPre.appendChild(newText);
      newText = document.createTextNode("\n\n");
      newPre.appendChild(newText);
    }
    newPre.className += 'code-area';
    newPre.id = 'editor';
    $('.code-area-container').append(newPre);

    /* re-start pastel syntax highlighting parts */
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/pastel");

    /* re-start code-area keyup function : print console.log message when change codes in code-area */
    $('.code-area').keyup(() => {
      this.compileTest();
    });
  }

}

export default new Crafty();
