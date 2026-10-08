// 記事リポジトリ(logs-content)を content/ に取ってくる。
// すでに content/posts があれば何もしない(ローカルではその中で記事を書いてコミットする)。
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const dir = 'content';
const repo =
  process.env.CONTENT_REPO ?? 'https://github.com/5unad0ke1/logs-content.git';

if (existsSync(`${dir}/posts`)) process.exit(0);

// 中身のある content/ に posts/ が無い = 記事リポジトリではない。
// 黙って進むと記事0件のサイトができてしまうので止める
if (existsSync(dir) && readdirSync(dir).length > 0) {
  console.error(
    `[content] ${dir}/ はありますが ${dir}/posts がありません。` +
      `${dir}/ を消すか、${repo} を clone し直してください。`,
  );
  process.exit(1);
}

console.log(`[content] ${repo} を ${dir}/ に clone します`);
const args = ['clone', ...(process.env.CI ? ['--depth', '1'] : []), repo, dir];
execFileSync('git', args, { stdio: 'inherit' });
