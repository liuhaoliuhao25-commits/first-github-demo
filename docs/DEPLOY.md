# 部署与域名配置（Cloudflare Pages + lhxxy.top）

本博客是纯静态站点，构建产物在 `dist/` 目录。推荐部署到 **Cloudflare Pages**（免费、全球 CDN、绑定自定义域名 `lhxxy.top` 简单可靠）。

---

## 0. 前置准备

- 已安装 **Node.js 20+**（`node -v` 确认）
- 已有一个 **GitHub 账号** 和已上传的代码仓库
- 已拥有域名 **lhxxy.top**，且能登录域名注册商后台

### 把代码推到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "init: lhxxy blog"

# 在 GitHub 新建一个空仓库（例如 lhxxy/lhxxy-blog），然后：
git remote add origin https://github.com/<你的用户名>/lhxxy-blog.git
git push -u origin main
```

---

## 1. 在 Cloudflare Pages 创建项目

1. 打开 <https://dash.cloudflare.com/>，注册 / 登录（免费）。
2. 左侧进入 **Workers & Pages → Create → Pages → Connect to Git**。
3. 授权并选择你的 GitHub 仓库（`lhxxy-blog`）。
4. 配置构建：
   - **Framework preset**：`Astro`
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - 环境变量：无需设置（本模板无必需变量）
5. 点击 **Save and Deploy**。

首次部署成功后，你会得到一个预览地址，形如：

```
https://<项目名>.pages.dev
```

---

## 2. 绑定自定义域名 lhxxy.top

### 方式 A：把域名托管到 Cloudflare（推荐，最省心）

> 这样 Cloudflare 会自动处理好根域与 www 的解析，几乎无需手动加记录。

1. 在 Cloudflare 后台点击 **Add a site**，输入 `lhxxy.top`，选择 **Free** 套餐。
2. Cloudflare 会扫描现有 DNS 记录并给你**两个新的 NS（名称服务器）地址**，例如：
   ```
   xxx.ns.cloudflare.com
   yyy.ns.cloudflare.com
   ```
3. 登录你的**域名注册商**（阿里云 / 腾讯云 / Namesilo 等），把 `lhxxy.top` 的 NS 服务器改成上面这两个地址。
   - 阿里云：域名列表 → 管理 → DNS 修改 → 修改 DNS 服务器
   - 腾讯云：域名管理 → 更多操作 → 修改 DNS 服务器
4. 等待 NS 生效（通常几分钟到几小时，全球最长约 24–48 小时）。
5. 回到 Pages 项目 → **Custom domains → Set up a custom domain**：
   - 添加 `lhxxy.top`（根域）
   - 添加 `www.lhxxy.top`
6. Cloudflare 会**自动**为这两个域名创建 DNS 记录（`CNAME → <项目名>.pages.dev`），根域会通过 Cloudflare 的 CNAME flattening 自动处理，无需手动配置。

### 方式 B：域名仍留在原注册商（手动加记录）

如果你不想迁移 NS，可手动在注册商后台添加记录：

| 类型 | 名称（主机记录） | 值（记录内容） | 说明 |
| --- | --- | --- | --- |
| `CNAME` | `www` | `<项目名>.pages.dev` | www 子域 |
| `CNAME` 或 `ALIAS/ANAME` | `@`（根域） | `<项目名>.pages.dev` | 根域；**仅当注册商支持 CNAME flattening / ALIAS / ANAME** |

> ⚠️ 大多数注册商**不允许**根域（`@`）使用 CNAME。若你的注册商不支持 ALIAS / ANAME / CNAME 展平，最干净的方案是回到**方式 A**（迁移 NS 到 Cloudflare）。

加完记录后，仍需在 Pages → **Custom domains** 里添加 `lhxxy.top` 和 `www.lhxxy.top`，Cloudflare 会校验解析并签发 HTTPS 证书。

---

## 3. 验证

1. 访问 `https://lhxxy.top` 应能看到首页。
2. 访问 `https://www.lhxxy.top` 应能正常跳转（Cloudflare 通常自动 301 到根域）。
3. 检查 HTTPS：地址栏应有锁形图标（Cloudflare 自动签发证书）。
4. 检查静态产物：
   - `https://lhxxy.top/sitemap-index.xml`
   - `https://lhxxy.top/rss.xml`
   - `https://lhxxy.top/robots.txt`

---

## 4. 后续更新（自动部署）

仓库已连接 Cloudflare Pages，之后每次 `git push` 到 `main` 分支都会**自动构建并发布**，无需手动操作。

---

## 5. 常见问题

**Q：构建报错找不到依赖？**
删除 `node_modules` 与 `package-lock.json` 后重新 `npm install`，确认 Node 版本 ≥ 20。

**Q：改完域名后链接还是旧的？**
确认已同时修改 `astro.config.mjs` 的 `site` 和 `src/lib/site.ts` 的 `url`，然后重新构建。

**Q：中文字体加载慢（国内访问）？**
字体来自 Google Fonts，国内可能较慢。可改为自托管字体，或使用国内 CDN 镜像（如 fonts.loli.net）。站点已设置 `display=swap` 与系统衬线回退，字体未加载时不影响阅读。

**Q：想部署到 GitHub Pages 而非 Cloudflare？**
将 `astro.config.mjs` 中 `site` 保持为 `https://lhxxy.top`，在 GitHub 仓库 `Settings → Pages → Build and deployment` 选择 GitHub Actions（提交一个部署 `dist/` 的 workflow），然后在自定义域名处填入 `lhxxy.top` 并添加 `CNAME` 记录即可；原理与上文相同。
