import React from 'react';

import guideHtml from 'bundle-text:./near-dot-com-guide.html';

// Isolate the supplied document's styles and open its links in the main window.
const guideDocument = guideHtml.replace('<head>', '<head><base target="_top">');

export default function NearDotComGuide() {
    return (
        <iframe
            title='MyNearWallet Migration Guide'
            srcDoc={guideDocument}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0,
                background: '#fafaf7',
            }}
        />
    );
}
