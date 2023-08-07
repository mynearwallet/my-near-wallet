import React from 'react';

import HeaderEditor from './HeaderEditor';

export default function AddConnectionForm() {
    const [headers, setHeaders] = React.useState<Record<string, string>>({ '': '' });

    return (
        <>
            <HeaderEditor headers={headers} setHeaders={setHeaders} />
            <div>{JSON.stringify(headers)}</div>
        </>
    );
}
