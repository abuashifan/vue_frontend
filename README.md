# frontend-vue

This template should help get you started developing with Vue 3 in Vite.

## Backend API

The dev default uses `VITE_API_URL=/api` and proxies requests to the Laravel backend through
`VITE_API_PROXY_TARGET`.

```sh
cp .env.example .env
npm install
npm run dev
```

Default `.env` values:

```text
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
```

If Laravel is running on another port, update `VITE_API_PROXY_TARGET` or set `VITE_API_URL` to the
direct backend API URL, for example `http://127.0.0.1:8000/api`.

Demo login after the backend seed steps:

```text
Email: admin@example.com
Password: password
```

Tenant requests include `Authorization: Bearer <token>` and `X-Company-ID` through the shared API
client after a company is selected.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
