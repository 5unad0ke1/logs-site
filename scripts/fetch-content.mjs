// 記事リポジトリ(logs-content)を content/ に取ってくる。
// すでに content/ があれば何もしない(ローカルではその中で記事を書いてコミットする)。
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const dir = 'content';
const repo =
  process.env.CONTENT_REPO ?? 'https://github.com/5unad0ke1/logs-content.git';

if (existsSync(dir)) process.exit(0);

console.log(`[content] ${repo} を ${dir}/ に clone します`);
const args = ['clone', ...(process.env.CI ? ['--depth', '1'] : []), repo, dir];
execFileSync('git', args, { stdio: 'inherit' });
