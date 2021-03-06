import PIXI from 'pixi.js';
import Background from '../Background/Background.js';
import Sidebar from '../Sidebar/Sidebar.js';
import CraftyBlockManager from '../CraftyBlock/CraftyBlockManager.js';

import Pastel from 'pastel-lang';
import CraftyStore from '../../stores/CraftyStore.js';

/**
 * Main App Display Object
 *
 * Adds background, sidebar, and CraftyBlockManager to it's self
 *
 * @exports App
 * @extends ScaledContainer
 */
export default class App extends PIXI.Container {
    constructor(...args) {
        super();
        console.log("Loading App....");

        //  Create a tree of simple pastel code, and store it in CraftyStore as placeholder
        let parser = new Pastel.Parser();
        let tree = parser.analyze("(print (+ 1 1)) (if (= 3 4) (print 'correct!') (print 'incorrect!'))");
        CraftyStore.set('tree', tree);

        //  Sets the Crafty canvas stage
        var stage = this;
        stage.interactive = false;

        //  Add background to stage
        let bg = new Background();
        stage.addChild(bg);

        //  Add inner canvas around stage
        let canvas = new PIXI.Container(this.width,this.height);
        stage.addChild(canvas);
        bg.canvas = canvas;

        //  Add sidebar
        let sidebar = new Sidebar();

        //this.sidebar = sidebar;
        canvas.sidebar = sidebar;

        //  Initialize CraftyBlockManager
        //let manager = new CraftyBlockManager(stage);
        let manager = new CraftyBlockManager(canvas);


        //  Add open/close sidebar button
        var open_palette_btn = $('<input class="open-palette" type="button" value="+"/>');
        open_palette_btn.css('width', 50);
        open_palette_btn.css('height', 50);
        open_palette_btn.css('position', 'absolute');
        open_palette_btn.css('top', 50);
        open_palette_btn.css('left', 80);
        open_palette_btn.css('border', 'none');
        open_palette_btn.css('background-color', '#92A8D1');
        open_palette_btn.css('border-radius', 25);
        open_palette_btn.css('font-size', 24);
        open_palette_btn.css('font-weight', 'bold');
        open_palette_btn.css('color', '#333333');
        open_palette_btn.css('border-radius', 25);
        $("body").append(open_palette_btn);

        sidebar.visible = false;

        $('.open-palette').click(function() {
            if(sidebar.visible) {
                sidebar.visible = false;
                open_palette_btn.val('+');
            } else {
                sidebar.visible = true;
                stage.addChild(sidebar);
                open_palette_btn.val('-');
            }
        });
    }
}
