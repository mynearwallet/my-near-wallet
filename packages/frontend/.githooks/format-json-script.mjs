import glob from "glob";
import sortJson from "sort-json";

const jsonFiles = await glob("src/translations/**/*.json");

const options = {ignoreCase: true};
sortJson.overwrite(jsonFiles, options);
