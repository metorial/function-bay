import { ObjectStorageClient } from 'object-storage-client';
import { env } from './env';

export let storage = new ObjectStorageClient(env.storage.OBJECT_STORAGE_URL);
