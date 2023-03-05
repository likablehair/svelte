# Likablehair Svelte component library

A simple library that contains svelte components, used by likablehair frontend applications

## Developer guide

Install dependencies and start a local server to develop components:

```bash
# Install deps
npm install

# Start local server
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Publisher guide

To publish the package make the following steps:

- edit the package.json version, then commit all the changes
- run `npm run package`, svelte will generate a package folder with all the necessary stuff inside
- make sure you're logged in with your npm account, then run `npm publish ./package --access=public`
