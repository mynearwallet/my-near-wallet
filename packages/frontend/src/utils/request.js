export const retryRequestIfFailed = async (callback, { attempts = 1, delay = 100 }) => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await callback();
        } catch (error) {
            console.warn(error);
            await new Promise((res) => setTimeout(res, delay));
        }
    }

    return;
};

// Function to implement a timeout
function timeout(ms, promise) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Timeout after ' + ms + ' ms')); // Rejects the promise after timeout
        }, ms);

        promise.then(
            (res) => {
                clearTimeout(timer);
                resolve(res);
            },
            (err) => {
                clearTimeout(timer);
                reject(err);
            }
        );
    });
}

// Function to fetch with a timeout
export function fetchWithTimeout(url, options, timeoutMs = 5000) {
    return timeout(timeoutMs, fetch(url, options));
}
