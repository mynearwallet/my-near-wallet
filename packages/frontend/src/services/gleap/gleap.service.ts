import Gleap from 'gleap';

import CONFIG from '../../config';

Gleap.disableConsoleLogOverwrite();
Gleap.showFeedbackButton(false);
if (!window?.location?.href?.includes('localhost')) {
    Gleap.initialize(CONFIG.GLEAP_FRONTEND_API_KEY);
}

export { Gleap as GleapService };
