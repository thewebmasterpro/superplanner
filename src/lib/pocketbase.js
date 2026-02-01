import PocketBase from 'pocketbase';

const url = import.meta.env.VITE_POCKETBASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8090' : 'https://pb.hagendigital.com/');
const pb = new PocketBase(url);
pb.autoCancellation(false);

export default pb;
