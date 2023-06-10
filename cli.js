import fs from "fs";
import path from "path";

import minimist from 'minimist';
import inline from './index.js';

const argv = minimist(process.argv.slice(2));

const targetFile = argv._[0];
const outputFile = argv.o || argv.output;

const result = await inline(path.resolve(process.cwd(), targetFile));
if (outputFile) {
    fs.writeFileSync(path.resolve(process.cwd(), outputFile), result, "utf-8");
} else {
    console.log(result);
}