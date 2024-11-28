export const metapoolService = {
    async getMetrics() {
        return await fetch('https://validators.narwallets.com/metrics_json', {
            headers: {},
        }).then((r) => r.json());
    },
};
