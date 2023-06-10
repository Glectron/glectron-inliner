import fs from "fs";
import path from "path";

import parser from "node-html-parser";
import minifyHtml from "@minify-html/node";
import { minify as jsMinify } from "terser";
import postcss from "postcss";
import cssnanoPlugin from "cssnano";
import mime from "mime-types";

import { isURL } from "../util.js";
import { doInline } from "../index.js";

function replaceWithDataUrls(dir, el, selector, attribute) {
    el.querySelectorAll(selector).forEach((v) => {
        const attr = v.getAttribute(attribute);
        if (attr && !isURL(attr)) {
            const assetPath = path.join(dir, attr);
            if (fs.existsSync(assetPath)) {
                const data = fs.readFileSync(assetPath).toString("base64");
                const type = mime.lookup(path.extname(assetPath));
                const uri = `data:${type};base64,${data}`;
                v.setAttribute(attribute, uri);
            }
        }
    })
}

export default async function(content, dir, options) {
    const el = parser.parse(content);
    const processors = [];
    el.querySelectorAll("script[src]").forEach(async (v) => {
        const src = v.getAttribute("src");
        if (!isURL(src)) {
            const assetPath = path.join(dir, src);
            if (fs.existsSync(assetPath)) {
                let content = fs.readFileSync(assetPath, "utf-8").toString();
                if (options.minifyJs) {
                    let result = jsMinify(content, { sourceMap: options.sourceMap || false });
                    processors.push(result);
                    content = (await result).code;
                }
                v.set_content(content);
                v.removeAttribute("src");
            }
        }
    });
    el.querySelectorAll("link[href]").forEach(async (v) => {
        const href = v.getAttribute("href");
        if (!isURL(href)) {
            const assetPath = path.join(dir, href);
            if (fs.existsSync(assetPath)) {
                const content = fs.readFileSync(assetPath, "utf-8");
                let result = doInline(content, "css", path.dirname(assetPath));
                if (options.minifyCss) {
                    result = result.then((val) => postcss([cssnanoPlugin]).process(val, { from: undefined }));
                }
                processors.push(result);
                v.set_content((await result).css);
                v.tagName = "style";
                v.removeAttribute("rel");
                v.removeAttribute("href");
            }
        }
    });
    replaceWithDataUrls(dir, el, "img[src]", "src");
    replaceWithDataUrls(dir, el, "audio[src]", "src");
    await Promise.allSettled(processors);
    if (options.minifyHtml) {
        return minifyHtml.minify(Buffer.from(el.toString()), {});
    } else {
        return el.toString();
    }
}