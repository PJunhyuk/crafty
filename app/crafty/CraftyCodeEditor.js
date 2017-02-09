import Pastel from 'pastel-lang';
import CraftyStore from './../stores/CraftyStore.js';

// import ace for syntax highlighting
import ace from 'brace';

import 'brace/theme/monokai';
import '../editor/mode-pastel.js';

/**
 * Crafty Code Ace.js Editor
 *
 * Manages code text and checks for editing
 * @exports CraftyCodeEditor
 */
export default class CraftyCodeEditor {
    constructor() {
        this.editor = ace.edit("editor");
        this.editor.setTheme("ace/theme/monokai");
        this.editor.session.setMode("ace/mode/pastel");
        this.editor.on('change', () => {
            if (!this.loading) this.checkCode(); 
        });
        this.evaluator = new Pastel.Evaluator();
        this.parser = new Pastel.Parser();
        this.messageBox = document.getElementById("compile-message");

        CraftyStore.addChangeListener((caller) => {
            if (caller == "canvasmanager") {
                this.loadCode(); 
            }
            else {
                console.log(`DEBUG::: Editor is ignoring change from ${caller}`);
            }
        });

        this.loadCode();
    }

    isError(result) {
        return result instanceof Pastel.Error;
    }

    checkCode() {
        let compilableText = this.editor.getValue();
        let result = this.evaluator.evaluateText(compilableText);
        if (result instanceof Pastel.Error) {
            console.log("code-error");
            $('#compile-message').text(result.message);
            //this.messageBox.text(result.message);
            this.messageBox.className = "show";
            $('.live-preview-area').text('ERROR!');
        } else {
            let tree = this.parser.analyze(compilableText);
            CraftyStore.set('tree', tree);
            CraftyStore.emitChange("editor");
            if(this.messageBox.className == "show") {
                this.messageBox.className = "hide";
                setTimeout(_ => {
                    this.messageBox.className = "";
                }, 500);
            }
            this.compile();
        }
    }

    compile() {
        console.log("compile!");
        let compilableText = this.editor.getValue();
        let result = this.evaluator.evaluateText(compilableText);
        if (result instanceof Pastel.Error) {
            // this.messageBox.text(result.message);
            // this.messageBox.className = "show";
            // alert("ERROR - check error message!");
        } else {
            var total_result = '';
            total_result += result;
            $('.live-preview-area').text(total_result);
        }
    }

    loadCode() {
        this.loading = true;
        let savedTree = CraftyStore.get('tree');
        let newText = "";
        savedTree.children.forEach( node => {
            newText += this.parser.stringify(node);
            newText += "\n\n";
        });
        newText = newText.slice(0,-2);

        this.editor.setValue(newText, 1);
        this.loading = false;

        this.compile();
    }
}
