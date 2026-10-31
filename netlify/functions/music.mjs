import { audioStore } from './_shared.mjs';

const RANGE_BYTES = 2 * 1024 * 1024;
const MAX_SONG_BYTES = 15 * 1024 * 1024;

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  try {
    // Read strongly so audio is available immediately after an Admin upload.
    const asset = new URL(request.url).searchParams.get('asset') || '';
    if(asset && !/^[a-f0-9]{32}$/.test(asset)) return new Response('Invalid music id',{status:400});
    const data = await audioStore().get(asset ? 'songs/'+asset+'.mp3' : 'background.mp3', { type: 'arrayBuffer', consistency: 'strong' });
    if (!data) return new Response('No uploaded music', { status: 404 });
    const size = data.byteLength;
    const headers = {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff'
    };
    const range = request.headers.get('range');
    if (range) {
      const invalid = () => new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (!match || (!match[1] && !match[2])) return invalid();
      let start = match[1] ? Number(match[1]) : 0;
      let end = match[2] ? Number(match[2]) : size - 1;
      if (!match[1]) {
        const suffix = Number(match[2]);
        if (suffix <= 0) return invalid();
        start = Math.max(0, size - suffix);
        end = size - 1;
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return invalid();
      // Enforce a small ranged response rather than returning an oversized Function payload.
      end = Math.min(end, size - 1, start + RANGE_BYTES - 1);
      const body = data.slice(start, end + 1);
      return new Response(request.method === 'HEAD' ? null : body, {
        status: 206,
        headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) }
      });
    }
    if (request.method === 'HEAD') return new Response(null, { headers: { ...headers, 'Content-Length': String(size) } });
    // Stream when there is no Range header. Netlify supports streamed responses up to 20 MB.
    const stream = new Blob([data], { type: 'audio/mpeg' }).stream();
    return new Response(stream, { headers: { ...headers, 'Content-Length': String(size) } });
  } catch (error) {
    console.error('HUIT music:', error);
    return new Response('Music not available', { status: 503 });
  }
}
