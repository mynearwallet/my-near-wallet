import React, { useMemo } from 'react';

import FailedToLoad from '../../images/failed_to_load.svg';
import ImageWithLoading from '../common/image/ImageWithLoading';

export function NFTMedia({ mediaUrl, autoPlay = false, mimeType }) {
    const [isVideo, urlMimeType] = useMemo(() => {
        let urlMimeType;
        // check mediaUrl string for .webm or .mp4 endings (case-insensitive)
        if (mediaUrl && mediaUrl.match(/\.webm$/i)) {
            urlMimeType = 'webm';
        } else if (mediaUrl && mediaUrl.match(/\.mp4$/i)) {
            urlMimeType = 'mp4';
        }

        let isMimeTypeVideo = mimeType && mimeType.match('video');

        // if there is a mediaUrl and a truthy mimeType (webm or mp4), we have a video
        const isVideo = !!isMimeTypeVideo || (!!mediaUrl && urlMimeType);
        return [isVideo, urlMimeType];
    }, [mediaUrl, mimeType]);

    if (isVideo) {
        return (
            <video muted={true} loop controls autoPlay={autoPlay}>
                <source
                    src={mediaUrl}
                    type={mimeType || `video/${urlMimeType}`}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.setAttribute('poster', FailedToLoad);
                    }}
                />
            </video>
        );
    }

    return (
        <ImageWithLoading
            src={mediaUrl}
            skip={!mediaUrl && !isVideo}
            alt='NFT'
            loadImageTimeout={40_000}
        />
    );
}
