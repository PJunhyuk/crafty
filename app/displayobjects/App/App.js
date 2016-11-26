import PIXI from 'pixi.js';
import Background from '../Background/Background.js';
import Sidebar from '../Sidebar/Sidebar.js';
/**
 * Main App Display Object
 *
 * Adds a background and some bunnies to it's self
 *
 * @exports App
 * @extends ScaledContainer
 */
export default class App extends PIXI.Container {
    constructor(...args) {
        super();

        var stage = this;
        stage.id = "stage";
        stage.interactive = false;

        let bg = new Background();
        let sidebar = new Sidebar();

        stage.addChild(bg);

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
            if(stage.children.length == 1) {
                stage.addChild(sidebar);
                open_palette_btn.val('-');
            } else {
                if(stage.getChildAt(1).id == "sidebar") {
                    stage.removeChild(sidebar);
                    open_palette_btn.val('+');
                } else {
                    stage.addChildAt(sidebar, 1);
                    open_palette_btn.val('-');
                }
            }
        });
    }
}
