import walk from "@glectron/asset-walker";

import htmlWalker from "./inliners/html.js";

async function inline(file, options) {
    return walk(file, [
        htmlWalker(options)
    ], options)
}

export default inline;