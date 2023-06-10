import fs from "fs";
import path from "path";

import walker from "glectron-asset-walker";
import { minify as jsMinify } from "terser";
import postcss from "postcss";
import cssnanoPlugin from "cssnano";
import mime from "mime-types";

import cssWalker from "./css.js";

async function dataUrlWalker(el, attr, asset) {
    const data = fs.readFileSync(asset).toString("base64");
    const type = mime.lookup(path.extname(asset));
    const uri = `data:${type};base64,${data}`;
    el.setAttribute(attr, uri);
}

export default function(options) {
    return async function(walk) {
        walk("script[src]", "src", async (el, attr, asset) => {
            let content = fs.readFileSync(asset, "utf-8").toString();
            if (options.minifyJs) {
                let result = jsMinify(content, { sourceMap: options.sourceMap || false });
                content = (await result).code;
            }
            el.set_content(content);
            el.removeAttribute(attr);
        });
        walk("link[href]", "href", async (el, attr, asset) => {
            let result = walker(asset, [["css", cssWalker]]);
            if (options.minifyCss) {
                result = result.then((val) => postcss([cssnanoPlugin]).process(val, { from: undefined })).then((val) => val.css);
            }
            el.set_content(await result);
            el.tagName = "style";
            el.removeAttribute("rel");
            el.removeAttribute(attr);
        });
        walk("img[src]", "src", dataUrlWalker);
        walk("audio[src]", "src", dataUrlWalker);
    }
}