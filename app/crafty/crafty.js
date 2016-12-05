import PastelEvaluator from "./../pastel/evaluator.js";
import PastelError from "./../pastel/error.js";
import Parser from './../pastel/parser.js';
import CraftyStore from './../stores/CraftyStore.js';
import ace from 'brace';

import 'brace/theme/monokai';
import '../editor/mode-pastel.js';

class Crafty {
  constructor() {
    this.checkDeleteBtn;
    /* pastel compiler toolkit */
    this.compileToolkit = {};
  }

  render() {
    console.log("hi");

    /* pastel syntax highlighting parts */
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/pastel");

    $(document).ready(() => {
      /* print console.log message when change codes in code-area */
      $('.code-area').keyup(() => {
        this.compileTest();
      });
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


  showSetting(clickedBlock) {
    if(this.checkDeleteBtn == true) {

      $('.delete_btn').remove();
      this.checkDeleteBtn = false;

    } else {
      var delete_btn = $('<input class="delete_btn" type="button" value="-"/>');
      delete_btn.css('width', 30);
      delete_btn.css('height', 30);
      delete_btn.css('position', 'absolute');
      delete_btn.css('top', clickedBlock.y - 30);
      delete_btn.css('left', clickedBlock.x - 30);
      delete_btn.css('border', 'none');
      delete_btn.css('background-color', '#F7CAC9');
      delete_btn.css('border-radius', 25);
      delete_btn.css('font-size', 24);
      delete_btn.css('font-weight', 'bold');
      delete_btn.css('color', '#333333');
      delete_btn.css('border-radius', 25);
      $("body").append(delete_btn);

      this.checkDeleteBtn = true;

      $('.delete_btn').click(() => {
        this.checkDeleteBtn = false;
        var stage = clickedBlock.parent;
        clickedBlock.parent.removeChild(clickedBlock);
        $('.delete_btn').remove();

        var numberOfBlocks = stage.children.length - 2;

        var i;
        var BlockInfoList = new Array("");

        for (i = 1; i <= numberOfBlocks; i++) {
          BlockInfoList[i-1] = stage.getChildAt(i+1).stringify();
        }

        //  call canvasChanged function
        this.canvasChanged(BlockInfoList);
      });
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
