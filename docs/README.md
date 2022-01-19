# bgio-effects/docs

Documentation website built with [Astro](https://docs.astro.build/) using the
Astro Starter Kit: Docs Site template.

## Setting up locally

If building the site locally for the first time, first run the following in the
repository root:

```sh
npm install
npm run predocs:build
```

That will ensure a local build of `bgio-effects` is available for the demos on
the docs site to use.

Then change to the docs directory and install dependencies:

```sh
cd docs
npm install
```

Repeat this process if you make changes to the main library and want to test
it with the docs demos.

## Commands Cheatsheet

All commands are run from the `docs` directory, from a terminal:

| Command           | Action                                       |
|:----------------  |:-------------------------------------------- |
| `npm run dev`     | Starts local dev server at `localhost:3000`  |
| `npm run build`   | Build your production site to `./dist/`      |
| `npm run preview` | Preview your build locally, before deploying |

## Key files

### Content

The actual content of the site can be found in `src/pages`. If in doubt, follow
the “Edit this page” link from the page you want to edit on the site.

### Site metadata

`src/config.ts` contains several data objects that describe metadata about the
site like title, description, language, and Open Graph details.

### CSS styling

The site's colour scheme is controlled by the variables in `src/styles/theme.css`.
