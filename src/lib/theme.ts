import { themeSchedule } from '../config/site';

/** ボタンで選ぶモード。auto は時刻で light / dark を切り替える */
export type ThemeMode = 'light' | 'dark' | 'auto';
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/**
 * <meta name="theme-color">(スマホのアドレスバーなど)に使う背景色。
 * CSS が読み込まれる前に使うので、src/styles/tokens.css の --c-bg と同じ値をここにも持つ
 */
export const THEME_BG: Record<Theme, string> = {
  light: '#FAFAFB',
  dark: '#111113',
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}

/** 自動モードのとき、その時刻がライトの時間帯か */
export function isLightHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= themeSchedule.lightFrom && hour < themeSchedule.darkFrom;
}

export function resolveTheme(mode: ThemeMode, now = new Date()): Theme {
  if (mode !== 'auto') return mode;
  return isLightHour(now) ? 'light' : 'dark';
}

/** 自動モードで次に切り替わる時刻までのミリ秒 */
export function msUntilNextSwitch(now = new Date()): number {
  const candidates = [themeSchedule.lightFrom, themeSchedule.darkFrom].flatMap(
    (hour) =>
      [0, 1].map((dayOffset) => {
        const at = new Date(now);
        at.setDate(at.getDate() + dayOffset);
        at.setHours(hour, 0, 0, 0);
        return at.getTime() - now.getTime();
      }),
  );
  return Math.min(...candidates.filter((ms) => ms > 0));
}
