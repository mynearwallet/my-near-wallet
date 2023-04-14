export function addQueryParams(baseUrl, queryParams) {
  const url = new URL(baseUrl);
  for (const key in queryParams) {
    const param = queryParams[key];
    if (param) {
      url.searchParams.set(key, param);
    }
  }
  return url.toString();
}
