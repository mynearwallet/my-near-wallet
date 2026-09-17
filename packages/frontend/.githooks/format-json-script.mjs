import path from "node:path";
import sortJson from "sort-json";

const translationsDirectory = path.resolve(
    "packages/frontend/src/translations"
);
const jsonFiles = process.argv.slice(2).filter((file) => {
    const relativePath = path.relative(translationsDirectory, path.resolve(file));

    return (
        relativePath.endsWith(".json") &&
        !relativePath.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativePath)
    );
});

if (jsonFiles.length > 0) {
    sortJson.overwrite(jsonFiles, {ignoreCase: true});
}
