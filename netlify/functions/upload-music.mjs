import { audioStore, authorized, send } from './_shared.mjs';

// Mỗi request thấp hơn giới hạn binary payload ~4.5 MB của Netlify Functions.
const CHUNK_BYTES = 2 * 1024 * 1024;
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_PARTS = Math.ceil(MAX_BYTES / CHUNK_BYTES);
const VALID_ID = /^[a-f0-9]{32}$/;
const PART_PREFIX = 'music-upload-v2/';

const validMp3 = (bytes) => bytes.byteLength >= 4 &&
  ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
const fail = (message, status = 400) => send({ error: message }, status);
const queryNum = (search, name) => {
  const value = search.get(name);
  return value !== null && /^\d+$/.test(value) ? Number(value) : NaN;
};
const chunkKey = (id, n) => `${PART_PREFIX}${id}/${n}`;

export default async function handler(request) {
  if (request.method !== 'POST') return fail('Phương thức không được hỗ trợ.', 405);
  if (!authorized(request)) return fail('Sai mật khẩu hoặc chưa cấu hình Netlify.', 401);

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'legacy';
  const store = audioStore();
  try {
    if (action === 'chunk') {
      const uploadId = url.searchParams.get('uploadId') || '';
      const part = queryNum(url.searchParams, 'part');
      const parts = queryNum(url.searchParams, 'parts');
      const total = queryNum(url.searchParams, 'total');
      if (!VALID_ID.test(uploadId) || !Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS ||
          !Number.isInteger(part) || part < 0 || part >= parts ||
          !Number.isSafeInteger(total) || total < 128 || total > MAX_BYTES ||
          Math.ceil(total / CHUNK_BYTES) !== parts) return fail('Thông tin tải nhạc không hợp lệ.');
      const type = (request.headers.get('content-type') || '').split(';')[0].toLowerCase();
      if (!['application/octet-stream', 'audio/mpeg', 'audio/mp3'].includes(type)) return fail('Chỉ nhận MP3.', 415);
      const bytes = new Uint8Array(await request.arrayBuffer());
      const expectedSize = part === parts - 1 ? total - part * CHUNK_BYTES : CHUNK_BYTES;
      if (bytes.byteLength !== expectedSize || bytes.byteLength > CHUNK_BYTES) return fail('Dung lượng phần tải lên không hợp lệ.', 413);
      if (part === 0 && !validMp3(bytes)) return fail('Tệp không có định dạng MP3 hợp lệ.', 415);
      await store.set(chunkKey(uploadId, part), bytes, { metadata: { type: 'temp-music', uploadedAt: String(Date.now()) } });
      return send({ ok: true, part: part + 1, parts });
    }

    if (action === 'commit' || action === 'cancel') {
      const body = await request.json();
      const { uploadId } = body || {};
      if (typeof uploadId !== 'string' || !VALID_ID.test(uploadId)) return fail('Mã tải lên không hợp lệ.');
      const parts = body.parts;
      const total = body.total;
      if (!Number.isSafeInteger(parts) || parts < 1 || parts > MAX_PARTS) return fail('Số phần không hợp lệ.');
      if (!Number.isSafeInteger(total) || total < 128 || total > MAX_BYTES || Math.ceil(total / CHUNK_BYTES) !== parts)
        return fail('Dung lượng MP3 không hợp lệ.');

      if (action === 'cancel') {
        await Promise.allSettled(Array.from({ length: parts }, (_, i) => store.delete(chunkKey(uploadId, i))));
        return send({ ok: true });
      }

      const merged = new Uint8Array(total);
      let cursor = 0;
      for (let i = 0; i < parts; i++) {
        const segment = await store.get(chunkKey(uploadId, i), { type: 'arrayBuffer', consistency: 'strong' });
        if (!segment) return fail(`Thiếu phần tải lên ${i + 1}/${parts}. Hãy tải lại file.`, 409);
        const chunk = new Uint8Array(segment);
        const expectedSize = i === parts - 1 ? total - i * CHUNK_BYTES : CHUNK_BYTES;
        if (chunk.byteLength !== expectedSize) return fail('Một phần tải lên có dung lượng không chính xác.', 409);
        merged.set(chunk, cursor);
        cursor += chunk.byteLength;
      }
      if (cursor !== total || !validMp3(merged)) return fail('MP3 ghép không hợp lệ.', 415);
      await store.set('songs/'+uploadId+'.mp3', merged, { metadata: { mime: 'audio/mpeg', size: String(total) } });
      // Cleanup is best-effort; the completed file has already been saved.
      await Promise.allSettled(Array.from({ length: parts }, (_, i) => store.delete(chunkKey(uploadId, i))));
      return send({ ok: true, url: '/.netlify/functions/music?asset='+uploadId, musicAsset: uploadId, musicVersion: String(Date.now()) });
    }

    // Compatibility for older admin versions uploading one MP3 <= 3 MB.
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 3 * 1024 * 1024) return fail('Phiên bản Admin cũ chỉ hỗ trợ 3 MB. Hãy dùng Admin mới.', 413);
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength < 128 || bytes.byteLength > 3 * 1024 * 1024) return fail('MP3 phải từ 128 byte đến 3 MB.', 413);
    if (!validMp3(bytes)) return fail('Tệp không phải MP3 hợp lệ.', 415);
    await store.set('background.mp3', bytes, { metadata: { mime: 'audio/mpeg', size: String(bytes.byteLength) } });
    return send({ ok: true, url: '/.netlify/functions/music', musicVersion: String(Date.now()) });
  } catch (e) {
    console.error('HUIT upload-music:', e);
    return fail('Không thể lưu MP3. Kiểm tra Functions Logs và thử tải lại.', 500);
  }
}
