import PIXI from 'pixi.js';
import Background from '../Background/Background.js';
import Sidebar from '../Sidebar/Sidebar.js';
import CraftyBlockManager from '../CraftyBlock/CraftyBlockManager.js';

import Parser from '../../pastel/parser.js';
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

        //  Create a tree of simple pastel code, and store it in CraftyStore as placeholder
        let parser = new Parser();
        let tree = parser.analyze("(print (+ 1 1)) (if (= 3 4) (print 'correct!') (print 'incorrect!'))");
        CraftyStore.set('tree', tree);

        //  Sets the Crafty canvas stage
        var stage = this;
        stage.interactive = false;

        //  Add background to stage
        let bg = new Background();
        stage.addChild(bg);

        //  Add sidebar
        let sidebar = new Sidebar();

        this.sidebar = sidebar;
        stage.addChild(sidebar);
        sidebar.visible = false;

        //  Initialize CraftyBlockManager
        let manager = new CraftyBlockManager(stage);


        //  Add open/close sidebar button
        var open_palette_btn = $('<input class="open-palette" type="button" value="+"/>');
        open_palette_btn.css('width', 50);
        open_palette_btn.css('height', 50);
        open_palette_btn.css('position', 'absolute');
        open_palette_btn.css('top', 50);
        open_palette_btn.css('left', 100);
        open_palette_btn.css('border', 'none');
        open_palette_btn.css('background-color', '#92A8D1');
        open_palette_btn.css('border-radius', 25);
        open_palette_btn.css('font-size', 24);
        open_palette_btn.css('font-weight', 'bold');
        open_palette_btn.css('color', '#333333');
        open_palette_btn.css('border-radius', 25);
        $("body").append(open_palette_btn);

        $('.open-palette').click(function() {
            if(sidebar.visible) {
                sidebar.visible = false;
                open_palette_btn.val('+');
            } else {
                sidebar.visible = true;
                open_palette_btn.val('-');
            }
        });
    }
}
