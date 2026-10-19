#!/usr/bin/env node
/**
 * fetch-transcript.mjs — 提取 YouTube 视频字幕（零依赖，Node 18+）
 *
 * 用法:
 *   node fetch-transcript.mjs <URL或videoID> [选项]
 *
 * 选项:
 *   --lang=<code>     首选语言 (默认按 zh-Hans → zh-CN → zh → en 顺序尝试)
 *   --format=<fmt>    text (默认) | timestamped | json
 *   --out=<path>      写入文件；省略则打印到 stdout
 *   --list            只列出该视频可用的字幕轨道，不下载
 *
 * 退出码: 0 成功 / 1 无字幕 / 2 视频不可用或网络错误
 */

const ENDPOINT =
  'https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false';

// 多客户端回退：YouTube 对不同客户端返回不同结果，逐个尝试直到拿到字幕轨道
const CLIENTS = [
  {
    name: 'ios',
    clientName: 'IOS',
    clientVersion: '20.10.4',
    header: '5',
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    ctx: {
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      platform: 'MOBILE',
      osName: 'iOS',
      osVersion: '18.3.2.22D82',
    },
  },
  {
    name: 'android',
    clientName: 'ANDROID',
    clientVersion: '20.10.38',
    header: '3',
    ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip',
    ctx: {
      platform: 'MOBILE',
      osName: 'Android',
      osVersion: '14',
      androidSdkVersion: 34,
    },
  },
  {
    name: 'mweb',
    clientName: 'MWEB',
    clientVersion: '2.20251209.01.00',
    header: '2',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    ctx: { platform: 'MOBILE', osName: 'iOS', osVersion: '17.5.1' },
  },
];

const DEFAULT_LANGS = ['zh-Hans', 'zh-CN', 'zh', 'en'];

function extractVideoId(input) {
  if (/^[\w-]{11}$/.test(input)) return input;
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/shorts\/([\w-]{11})/,
    /\/embed\/([\w-]{11})/,
    /\/live\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#34': '"',
};

function decodeText(raw) {
  return raw
    .replace(/<[^>]*>/g, '') // 去掉内联标签
    .replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, code) => {
      if (ENTITIES[code]) return ENTITIES[code];
      if (code[0] === '#') {
        const num =
          code[1] === 'x' || code[1] === 'X'
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10);
        return Number.isNaN(num) ? m : String.fromCodePoint(num);
      }
      return m;
    });
}

async function fetchPlayer(videoID) {
  let firstPlayable = null;
  const failures = [];

  for (const c of CLIENTS) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          'User-Agent': c.ua,
          'X-YouTube-Client-Name': c.header,
          'X-YouTube-Client-Version': c.clientVersion,
          Origin: 'https://www.youtube.com',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: c.clientName,
              clientVersion: c.clientVersion,
              hl: 'en',
              gl: 'US',
              ...c.ctx,
            },
            user: { lockedSafetyMode: false },
            request: { useSsl: true },
          },
          videoId: videoID,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });

      if (!res.ok) {
        failures.push(`${c.name}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const status = data?.playabilityStatus?.status;
      if (status && status !== 'OK') {
        failures.push(
          `${c.name}: ${status}${
            data.playabilityStatus.reason
              ? ' - ' + data.playabilityStatus.reason
              : ''
          }`
        );
        continue;
      }

      if (!firstPlayable) firstPlayable = data;
      const tracks =
        data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (tracks && tracks.length) return data;
      failures.push(`${c.name}: OK 但无字幕轨道`);
    } catch (err) {
      failures.push(`${c.name}: ${err.message}`);
    }
  }

  if (firstPlayable) return firstPlayable;
  const e = new Error(`视频在所有客户端上都不可用:\n  ${failures.join('\n  ')}`);
  e.code = 2;
  throw e;
}

function pickTrack(tracks, preferred) {
  const order = preferred ? [preferred, ...DEFAULT_LANGS] : DEFAULT_LANGS;
  for (const lang of order) {
    const hit =
      tracks.find((t) => t.vssId === `.${lang}`) || // 人工字幕
      tracks.find((t) => t.vssId === `a.${lang}`) || // 自动生成
      tracks.find((t) => t.languageCode === lang) ||
      tracks.find((t) => t.vssId?.includes(`.${lang}`));
    if (hit) return hit;
  }
  return tracks[0];
}

async function fetchTrack(track) {
  const url = track.baseUrl.replace(/&fmt=[^&]+/, '') + '&fmt=json3';
  const res = await fetch(url, { headers: { 'User-Agent': CLIENTS[0].ua } });
  if (!res.ok) throw new Error(`字幕下载失败: HTTP ${res.status}`);

  const body = await res.text();
  if (!body.trim()) return [];

  const data = JSON.parse(body);
  const out = [];
  for (const ev of data.events ?? []) {
    if (!ev.segs || ev.aAppend === 1) continue;
    const text = decodeText(ev.segs.map((s) => s.utf8 ?? '').join('')).trim();
    if (!text) continue;
    out.push({
      start: (ev.tStartMs ?? 0) / 1000,
      dur: (ev.dDurationMs ?? 0) / 1000,
      text,
    });
  }
  return out;
}

function stamp(sec) {
  const s = Math.floor(sec);
  const p = (n) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  return h > 0
    ? `${h}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
    : `${p(Math.floor(s / 60))}:${p(s % 60)}`;
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.find((a) => !a.startsWith('--'));
  const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
  const has = (n) => args.includes(`--${n}`);

  if (!input) {
    console.error('用法: node fetch-transcript.mjs <URL或videoID> [--lang=zh-Hans] [--format=text|timestamped|json] [--out=文件]');
    process.exitCode = 2;
    return;
  }

  const videoID = extractVideoId(input);
  if (!videoID) {
    console.error(`无法从 "${input}" 中解析出 YouTube 视频 ID`);
    process.exitCode = 2;
    return;
  }

  const player = await fetchPlayer(videoID);
  const title = player?.videoDetails?.title ?? '(无标题)';
  const tracks =
    player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (has('list')) {
    console.log(`标题: ${title}`);
    if (!tracks.length) {
      console.log('可用字幕轨道: 无');
      process.exitCode = 1;
      return;
    }
    console.log('可用字幕轨道:');
    for (const t of tracks) {
      console.log(
        `  ${t.languageCode}  vssId=${t.vssId}  ${
          t.kind === 'asr' ? '(自动生成)' : '(人工)'
        }  ${t.name?.simpleText ?? t.name?.runs?.[0]?.text ?? ''}`
      );
    }
    return;
  }

  if (!tracks.length) {
    console.error(`【无字幕】${title}`);
    console.error('该视频没有任何字幕轨道（人工和自动生成的都没有）。');
    console.error('上传者很可能主动关闭了字幕功能。');
    console.error('→ 换用文字教程，或用 yt-dlp 下载音频后做语音转写。');
    process.exitCode = 1;
    return;
  }

  const track = pickTrack(tracks, flag('lang'));
  const subs = await fetchTrack(track);

  if (!subs.length) {
    console.error(`【字幕为空】${title} (轨道 ${track.languageCode})`);
    process.exitCode = 1;
    return;
  }

  const format = flag('format') ?? 'text';
  const last = subs[subs.length - 1];
  const header =
    `标题: ${title}\n` +
    `链接: https://www.youtube.com/watch?v=${videoID}\n` +
    `字幕语言: ${track.languageCode}${track.kind === 'asr' ? ' (自动生成)' : ' (人工)'}\n` +
    `片段数: ${subs.length}   时长: 约 ${Math.round((last.start + last.dur) / 60)} 分钟\n` +
    `${'-'.repeat(60)}\n\n`;

  let out;
  if (format === 'json') {
    out = JSON.stringify({ videoID, title, lang: track.languageCode, subtitles: subs }, null, 2);
  } else if (format === 'timestamped') {
    out = header + subs.map((s) => `[${stamp(s.start)}] ${s.text}`).join('\n');
  } else {
    out = header + subs.map((s) => s.text).join('\n');
  }

  const dest = flag('out');
  if (dest) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(dest, out, 'utf8');
    console.log(`✅ 已写入 ${dest}（${subs.length} 段，语言 ${track.languageCode}）`);
  } else {
    console.log(out);
  }
}

main().catch((err) => {
  console.error(`错误: ${err.message}`);
  process.exitCode = err.code ?? 2;
});
