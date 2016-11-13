import PIXI from 'pixi.js';
import RendererStore from '../../stores/RendererStore.js';

const SIDEBAR_STYLE = {width:200, backgroundColor:0xEEEEEE, };

export default class SidebarBackground extends PIXI.Graphics {
    constructor() {
        super();
        this.beginFill(SIDEBAR_STYLE.backgroundColor,1);
        this.drawRect(0,0,SIDEBAR_STYLE.width, RendererStore.get('height'))
        this.endFill();

        RendererStore.addChangeListener(this.resizeHandler.bind(this));
    }

    resizeHandler() {
        this.height = RendererStore.get('height');
    }
}
