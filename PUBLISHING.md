# Publishing to npm

## Prerequisites

1. You need an npm account at https://www.npmjs.com/
2. Your package name is `@thinhdang1402/thinhdangmcp` (scoped to your username)

## Steps to Publish

### 1. Login to npm

```bash
npm login
```

This will prompt you for:
- Username: `thinhdang1402`
- Password: (your npm password)
- Email: (your email associated with npm account)
- OTP: (if you have 2FA enabled)

### 2. Verify you're logged in

```bash
npm whoami
```

Should output: `thinhdang1402`

### 3. Build the project

```bash
npm run build
```

This compiles TypeScript and prepares the `dist/` folder for publishing.

### 4. Publish to npm

```bash
npm publish --access public
```

**Note:** The `--access public` flag is required for scoped packages (@thinhdang1402/...) to be publicly accessible.

### 5. Verify publication

Visit: https://www.npmjs.com/package/@thinhdang1402/thinhdangmcp

Or check locally:

```bash
npm view @thinhdang1402/thinhdangmcp
```

## Package Details

- **Name:** `@thinhdang1402/thinhdangmcp`
- **Version:** `1.0.0`
- **Description:** MCP server with stdio, SSE, and StreamableHttp transports
- **Binary:** `thinhdangmcp` (command available after install)

## Installing Your Package

After publishing, users can install it with:

```bash
npm install -g @thinhdang1402/thinhdangmcp
```

Then run it:

```bash
thinhdangmcp stdio
thinhdangmcp sse
thinhdangmcp streamableHttp
```

## Updating the Package

To publish a new version:

1. Update version in `package.json`:
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. Build and publish:
   ```bash
   npm run build
   npm publish --access public
   ```

## Troubleshooting

### "Access token expired or revoked"
Run `npm login` again to refresh your credentials.

### "404 Not Found"
- Ensure you're logged in: `npm whoami`
- Verify the package name matches your npm username scope
- Check that you have permission to publish under `@thinhdang1402`

### "You do not have permission to publish"
Make sure you're logged in as `thinhdang1402` and the package name starts with `@thinhdang1402/`

