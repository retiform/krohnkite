// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

/**
 * Maintains tiling context and performs various tiling actions.
 */
class TilingEngine implements IEngine {
    private driver: IDriver;
    private layouts: LayoutStore;
    private windows: WindowStore;

    constructor(driver: IDriver) {
        this.driver = driver;
        this.layouts = new LayoutStore();
        this.windows = new WindowStore();
    }

    public adjustLayout(basis: Window) {
        const ctx = basis.context as KWinContext;
        const layout = this.layouts.getCurrentLayout(ctx);
        if (layout.adjust) {
            const fullArea = this.driver.getWorkingArea(ctx);
            const area = new Rect(
                fullArea.x + CONFIG.screenGapLeft,
                fullArea.y + CONFIG.screenGapTop,
                fullArea.width - (CONFIG.screenGapLeft + CONFIG.screenGapRight),
                fullArea.height - (CONFIG.screenGapTop + CONFIG.screenGapBottom),
            );
            const tiles = this.windows.visibleTiles(ctx);
            layout.adjust(area, tiles, basis);
        }
    }

    public arrange() {
        debug(() => "arrange");
        this.driver.forEachScreen((ctx: IDriverContext) => {
            this.arrangeScreen(ctx);
        });
    }

    public arrangeScreen(ctx: IDriverContext) {
        const layout = this.layouts.getCurrentLayout(ctx);

        const fullArea = this.driver.getWorkingArea(ctx);
        const workingArea = new Rect(
            fullArea.x + CONFIG.screenGapLeft,
            fullArea.y + CONFIG.screenGapTop,
            fullArea.width - (CONFIG.screenGapLeft + CONFIG.screenGapRight),
            fullArea.height - (CONFIG.screenGapTop + CONFIG.screenGapBottom),
        );

        const visibles = this.windows.visibles(ctx);
        const tiles = this.windows.visibleTiles(ctx);
        debugObj(() => ["arrangeScreen", {
            ctx, layout,
            tiles: tiles.length,
            visibles: visibles.length,
        }]);

        /* reset all properties of windows */
        visibles.forEach((window) => {
            if (window.state === WindowState.FreeTile)
                window.state = WindowState.Tile;

            if (window.state === WindowState.Tile)
                window.noBorder = CONFIG.noTileBorder;
        });

        if (CONFIG.maximizeSoleTile && tiles.length === 1) {
            tiles[0].noBorder = true;
            tiles[0].geometry = fullArea;
        } else if (tiles.length > 0)
            layout.apply(tiles, workingArea, fullArea);

        visibles.forEach((window) => window.commit());
    }

    public enforceSize(window: Window) {
        if (window.state === WindowState.Tile && !window.actualGeometry.equals(window.geometry))
            this.driver.setTimeout(() => {
                if (window.state === WindowState.Tile)
                    window.commit();
            }, 10);
    }

    public manage(window: Window) {
        if (!window.shouldIgnore) {
            window.state = (window.shouldFloat) ? WindowState.Float : WindowState.Tile;
            this.windows.push(window);
        }
    }

    public unmanage(window: Window) {
        this.windows.remove(window);
    }

    public moveFocus(window: Window, step: number) {
        if (step === 0)
            return;

        const ctx = (window) ? window.context : this.driver.getCurrentContext();

        const visibles = this.windows.visibles(ctx);
        if (visibles.length === 0) /* nothing to focus */
            return;

        const idx = (window) ? visibles.indexOf(window) : -1;
        if (!window || idx < 0) { /* unmanaged window -> focus master */
            this.driver.setCurrentWindow(visibles[0]);
            return;
        }

        const num = visibles.length;
        const newIndex = (idx + (step % num) + num) % num;

        debugObj(() => ["moveFocus", {from: window, to: visibles[newIndex]}]);
        this.driver.setCurrentWindow(visibles[newIndex]);
    }

    public moveTile(window: Window, step: number) {
        if (step === 0)
            return;

        const ctx = window.context;
        const visibles = this.windows.visibles(ctx);
        if (visibles.length < 2)
            return;

        const vsrc = visibles.indexOf(window);
        const vdst = wrapIndex(vsrc + step, visibles.length);
        const dstWin = visibles[vdst];

        const dst = this.windows.indexOf(dstWin);
        debugObj(() => ["moveTile", {step, vsrc, vdst, dst}]);
        this.windows.move(window, dst);
    }

    public toggleFloat(window: Window) {
        window.state = (window.state === WindowState.Float)
            ? WindowState.Tile
            : WindowState.Float;
    }

    public setMaster(window: Window) {
        this.windows.move(window, 0);
    }

    public cycleLayout() {
        this.layouts.cycleLayout(this.driver.getCurrentContext());
    }

    public setLayout(layout: any) {
        if (layout)
            this.layouts.setLayout(this.driver.getCurrentContext(), layout);
    }

    public handleLayoutShortcut(input: Shortcut, data?: any): boolean {
        const layout = this.layouts.getCurrentLayout(this.driver.getCurrentContext());
        if (layout.handleShortcut)
            return layout.handleShortcut(input, data);
        return false;
    }
}

try {
    exports.TilingEngine = TilingEngine;
} catch (e) { /* ignore */ }
