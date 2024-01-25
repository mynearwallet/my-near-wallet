import { StringStorage } from '../../../utils/storage/src/StringStorage';
import { Storable } from '../../../utils/storage/src/type';

export default function makePublicKeyNameStorage(
    publicKey: string,
    storage: Storable = localStorage
): StringStorage {
    class PublicKeyNameStorage extends StringStorage {
        protected storageKey = `publicKeyName-${publicKey}`;
        public default = 'Unnamed Key';
    }

    return new PublicKeyNameStorage(storage);
}
