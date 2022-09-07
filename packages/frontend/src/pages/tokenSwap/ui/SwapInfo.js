import React from 'react';

export default function SwapInfo({ data }) {
    const {
        info: { minAmountOut },
        loading,
    } = data;

    return (
        <div>
            <p>
                <br />
                {loading ? (
                    'Loading...'
                ) : (
                    <span>Min received: {minAmountOut || '-'}</span>
                )}
            </p>
        </div>
    );
}
