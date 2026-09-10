// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkCjkFriendly from 'remark-cjk-friendly';

/**
 * 公開URL。Cloudflare のカスタムドメインが決まったら
 * 環境変数 SITE_URL か、この既定値を書き換える。
 */
const site = process.env.SITE_URL ?? 'https://body-atlas.workers.dev';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  markdown: {
    // 日本語では「**固有の身体（le corps propre）**である」のように
    // 全角括弧の直後で閉じる太字が CommonMark の規則では効かない。
    // remark-cjk-friendly がこれを解決する。
    processor: unified({ remarkPlugins: [remarkCjkFriendly] }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
