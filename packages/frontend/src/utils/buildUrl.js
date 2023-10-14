export function addQueryParams(baseUrl, queryParams) {
    const url = new URL(baseUrl);
    for (let key in queryParams) {
        const param = queryParams[key];
        if (param) {
            url.searchParams.set(key, param);
        }
    }
    return url.toString();
}

export function addHashParams(baseUrl, hashParams) {
    const url = new URL(baseUrl);
    let hash = '';

    for (let key in hashParams) {
        const param = hashParams[key];

        if (param) {
            hash += `${key}=${encodeURIComponent(param)}&`;
        }
    }

    url.hash = hash;

    return url.toString();
}
