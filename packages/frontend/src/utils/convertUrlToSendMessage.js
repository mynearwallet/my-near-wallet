export default function convertUrlToSendMessage(urlOrigin) {
    const url = new URL(urlOrigin);
    let parsedUrl = url.toString();

    if (parsedUrl.endsWith('/')) {
        parsedUrl = parsedUrl.slice(0, -1);
    }
    return parsedUrl;
}
