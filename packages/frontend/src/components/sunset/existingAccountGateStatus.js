/**
 * What `ExistingAccountGate` knows before asking the chain: creation still allowed, or the user's
 * own active account, means `existing`; funded creation (linkdrop, trial) means `new`; anything
 * else needs an on-chain check.
 */
export const initialGateStatus = ({
    creationRetired,
    isActiveAccount,
    isFundedCreation,
}) =>
    !creationRetired || (isActiveAccount && !isFundedCreation)
        ? 'existing'
        : isFundedCreation
        ? 'new'
        : 'checking';
