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

class WindowStore {
    public list: Window[];

    constructor(windows?: Window[]) {
        this.list = windows || [];
    }

    public move(window: Window, newIdx: number) {
        const idx = this.list.indexOf(window);
        if (idx < 0)
            return;

        this.list.splice(idx, 1);
        this.list.splice(newIdx, 0, window);
    }

    //#region Storage Operation

    public get length(): number {
        return this.list.length;
    }

    public at(idx: number) {
        return this.list[idx];
    }

    public indexOf(window: Window) {
        return this.list.indexOf(window);
    }

    public push(window: Window) {
        this.list.push(window);
    }

    public remove(window: Window) {
        const idx = this.list.indexOf(window);
        if (idx >= 0)
            this.list.splice(idx, 1);
    }

    //#endregion

    //#region Querying Windows

    public visibles(ctx: IDriverContext): Window[] {
        return this.list.filter((win) => win.visible(ctx));
    }

    public visibleTiles(ctx: IDriverContext): Window[] {
        return this.list.filter((win) =>
            win.state === WindowState.Tile && win.visible(ctx));
    }

    public visibleTileables(ctx: IDriverContext): Window[] {
        return this.list.filter((win) =>
            (win.state === WindowState.Tile || win.state === WindowState.FreeTile)
            && win.visible(ctx));
    }

    //#endregion
}
