# This app

This is a Livetools app made from the `livetools-app-vite` template: a small, public web app
that a member of staff builds by talking to you, published to GitHub Pages. It is built with
Vite 8, React 19, TypeScript and React Router 7, and every screen is made from the parts in
`@livetools/ui`, the Livetools Design System's React package, and from nothing else.

The person you are working with does not read code and knows nothing about development. Most
of this file follows from that. Read "Talking to the person" before your first message to them.

## What may not be built here

This app is public and hosted on GitHub Pages. It must carry no commercial transactions (no
taking payment, no orders, no quotes a customer accepts) and no software-as-a-service (no
accounts, no logins, no service people depend on). That is Livetools' ruling for this template,
and it is where GitHub Pages' own terms draw the line too. If the person asks for one of those,
tell them in plain words that this kind of app cannot do it and that a developer can build it on
the other Livetools template; do not build a partial version.

The repository is public, so nothing private goes in it: no customer data, no prices that are
not already public, no keys or passwords.

## What this app is for

This app works out what one machine really costs to run per spindle hour in an Australian
machine shop, and the charge-out rate that covers it, so a manager can see where each hour's
cost goes and what moving one figure does to it. Its screens are listed in `src/App.tsx`.

In any example copy, the only supplier or brand names allowed are Evolute, NS Tools, Palbit and
PH Horn. Livetools ruled that, so example data never names another company.

## The parts and where the list is

Read `node_modules/@livetools/ui/PARTS.md` before writing a screen. It is generated from the
installed version's source, so it can never be out of step with what is installed: every part,
its import line, its props, the one rule an app most needs about it, and its page in the
Storybook catalogue. Take part names and props from it and nowhere else, including your own
memory of other design systems or of the older `lt-` classes.

A need that is not in PARTS.md is a part that does not exist in this version. Tell the person in
plain words what the screen cannot do yet, report the gap (see "Reporting a part that is wrong"),
and do not build a stand-in from raw elements.

Never import `@base-ui/react` or `react-aria-components`, types included. The parts are built on
them, but an app never touches them directly; the lint fails the import, and this sentence is
here so you do not try.

## The root and the rules in React terms

The root is already set up and is not changed. `src/main.tsx` wraps the whole app in exactly one
`LivetoolsProvider` and imports `globals.css`, which holds three imports in a fixed order:

```css
@import "@livetools/ui/styles.css";  /* tokens and components together */
@import "./app-tokens.css";          /* this app's own custom properties */
@import "./app.css";                 /* this app's own classes, last */
```

The provider writes density, scheme and theme onto the page and holds the unit system, the icons,
the toasts and the confirm dialog. Change density or theme through its props, never by writing
`data-lt-density` or `data-lt-theme`, because the provider owns those attributes and a second
writer fights it. The theme is operational (grey first, colour kept for meaning), which suits an
internal tool; commercial is only for a surface that sits beside Livetools marketing.

The rules, in the form they take in this app:

- Never write a raw value. No colour, px or pt font size or hand-rolled shadow in a `style` prop,
  a style object, a class string or `app.css`; everything reads a `--lt-*` token. A value the
  system lacks is defined as a custom property in `src/app-tokens.css`, the only place a literal
  is allowed. A token from another job is not an answer either: a border token used as a bar's
  fill passes every check and is still wrong.
- Blue acts, red is identity and danger. A positive action is a blue `Button` at every size.
  `Button` has no brand-red variant, so a red "Save" cannot be typed; do not try to get one
  through CSS. Red is the logotype and destroying things.
- Colour never carries meaning alone. `Badge`, `Alert`, `State` and status items in `Select`
  carry an icon and words as well as a colour, and a badge with no icon is a type error. A
  delete always shows an icon and the word.
- Severity picks the colour, and how long the message stays true picks the part. `Alert` is a
  condition that is true now, `toast()` is a receipt for something just done with nothing else on
  screen to show it, a field's error is a problem with one input, `Badge` is a record's state,
  `Dialog` or `useConfirm()` is a decision that blocks. One event gets one of these, never two,
  and never more than about three on screen at once, because past that it is a list.
- Every field has a label: the `label` prop is required on every field part. A validation error
  sits under its field and never floats, so the person sees which input is wrong.
- A page is a `Shell` header over a `Panel` main, and controls go only on the `Panel`, because
  the panel stays light in both schemes and that is what lets blue and red keep their exact
  values.
- Lists of things are data in props (`items`, `columns`, `rows`, a `detail` render prop), never
  markup, because the part owns the markup. Never reach into a part with a ref and change it; use
  only the methods PARTS.md lists.
- A number a person types is a `NumberField`, with a `measure` where the unit changes between
  metric and imperial. Dates and times are `DateField` and `TimeField`, never a browser date
  input, because the value must always be unambiguous. Files are `FileDrop`, which collects and
  checks the files; sending them is the app's job.
- A set of bars is a `MeasureSet` with a `scale` sentence and `Measure`s inside it, because a bar
  means nothing without saying what it is scaled against. A chart reads the `--lt-chart-*` tokens
  from the app's CSS, takes SVG colours from `chartColour()`, texture from `chartMarkClass()` and
  legend keys from `ChartKey`.

The lint that enforces these is switched on by two one-line files at the root, and they are not
changed:

```js
// eslint.config.js
import livetools from "@livetools/ui/eslint";
export default [...livetools.configs.recommended];
```

```js
// stylelint.config.js
export default { extends: ["@livetools/ui/stylelint"] };
```

The rules refuse: an `lt-` class or `data-lt-*` attribute in code (`no-lt-classes`); a raw
`<input>`, `<select>`, `<textarea>`, `<dialog>`, `<table>`, `<form>` or `<button>`, or any older
`lt-*` element (`no-raw-controls`, which names the part to use); a `style` prop setting anything
but `inlineSize` and `blockSize` (`no-style-prop`); a colour literal, px or pt font size or
hand-rolled shadow (`no-raw-style-values`); any import from Base UI or React Aria
(`no-behaviour-library-imports`); and in the app's CSS, a selector naming a part's insides
(`no-lt-selectors`), a raw value outside a custom property definition (`no-raw-values`),
`no-page-surface-in-field` and `no-brand-red-small-text`.

A rule that stops you means use a part, or ask upstream for one. Never make a local exception: no
disable comment, no rule switched off after the spread, no copied config, no selector aimed at a
part's insides. Each of those makes the app look right today and drift from the system from then
on, which is the failure the system exists to prevent.

## Adding a page

Pages are routes in React Router. A new page is three edits:

1. A screen file in `src/screens/`, for example `src/screens/Suppliers.tsx`, exporting one
   component built from parts.
2. A `<Route>` for it in `src/App.tsx`, beside the existing ones, with its address (`/suppliers`).
3. A link in the `SECTIONS` list in `src/App.tsx`, so it appears in the navigation bar.

The `Navigation` part is handed React Router's `Link` as `linkComponent`, so moving between pages
never reloads the site. Do not replace it with plain links, and do not add a second router.
Shared data goes in `src/data/*.ts` and shared calculations and formatting in `src/lib/*.ts`, so a
screen file stays about what is on the screen.

The files you edit are `src/screens/*.tsx`, `src/data/*.ts`, `src/lib/*.ts`, `src/App.tsx`,
`src/app.css` and `src/app-tokens.css`. A new screen, data or lib file in those folders is fine.

## What you do not edit

Do not edit anything under `.github/`, `.claude/` or `scripts/`, the config files
(`vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `stylelint.config.js`), `package.json` or
the lockfile. They hold the publishing, the checks and the hooks, and a change to any of them can
stop the site publishing in a way the person cannot see or describe. The one exception is the
update step below, which changes the version in `package.json` and the lockfile and nothing else.
Leave `index.html`, `src/main.tsx` and `src/globals.css` alone too, because the root is already
right and the order of its imports matters.

Do not add dependencies. Everything a screen needs is in `@livetools/ui`, and a second copy of
React or of a library the parts use breaks the check that only one copy is installed.

## The checks and hooks

`npm run check` runs the lint, the type check, the build, and a check that only one copy of React
and of each behaviour library is installed. Run it before every push, because the publish
workflow runs the same check and a failure there means the site does not update.

The hooks in `.claude/settings.json` run the lint on every file you edit and again before you
stop, and report findings to you. Fix every finding before you tell the person anything is done;
they never see a lint or type error. If you cannot fix one, tell them what is wrong on the screen,
in words ("the new stock column is not showing yet"), never the error.

If `node_modules` is missing, run `npm install` yourself. The person never runs a command.

## Publishing

A push to `main` publishes the site. The workflow in `.github/workflows/pages.yml` installs,
runs `npm run check`, builds and deploys to GitHub Pages. A developer turned on the one Pages
setting for this repository before the person arrived, so there is nothing to switch on.

A failed check fails the deploy and the site stays exactly as it was. The workflow then opens an
issue in this repository titled "The site did not update" (or updates the open one), saying in
plain words which check failed. When the person says the site did not change, read that open
issue, fix what it names, run `npm run check`, and push again. Tell them what was stopping the
update in screen terms and that the site will show the change in a minute or two.

The site's address comes from the Pages configuration; never write the base path into the app,
because it differs between the repository address and a custom domain. The app routes in the
browser, and the workflow copies the page to `404.html` so opening or refreshing an address such
as `/speeds` shows the right screen.

A custom domain is a file named `CNAME` in `public/` holding the domain, plus the domain entered
in the repository's Pages setting. The workflow reads the base path from Pages, so nothing else
changes. The Pages setting is a developer's job; tell the person that one step needs one.

## Talking to the person

The person using this app does not read code. Everything you say to them describes what changed
on the screen, in their words. That is the reason this template exists in this form.

- Never name a file, a folder, a library, a command, a component or a setting. Say "the Tools
  page now has a Location column", never "added a column to Tools.tsx".
- Never show them a terminal, or ask them to type or run anything. You install, check and push.
- Never ask them to open or look at a config file. Nothing they are asked to look at lives
  outside `src/`, and in practice they are asked to look at the site, not the code.
- Never pass on a lint error, a type error or a failed build. Fix it first. If you cannot, say
  what is wrong on the screen in a sentence.
- Never leave a failed publish without a sentence. Say the site did not update, why in plain
  words, and what you did about it.
- Never mention Base UI, React Aria, React, Vite or any other library by name. They appear in no
  file the person opens and in nothing you say.
- Never prompt them to update anything. The design system moves only when they ask for it.

Machining and workshop vocabulary is fine; they are experts in that. Software vocabulary is not.
When you need a decision from them, ask it as a choice about the screen ("should the low-stock
tools show first, or stay in tool-number order?"), not about how it is built.

## Updating the design system

`@livetools/ui` is pinned to an exact version with the lockfile committed, so nothing in the
design system can change this app until someone asks. Move it only when the person asks you to,
and then in exactly these steps:

1. Change the exact version of `@livetools/ui` in `package.json` to the one asked for, with no
   `^` or `~`, because a range would let it move on its own.
2. Run `npm install`, which updates the lockfile.
3. Run `npm run check` and fix every finding in the files you are allowed to edit. A part renamed
   or removed in a new major version shows up here.
4. Read the package's changelog (`node_modules/@livetools/ui/CHANGELOG.md`) for every version
   between the old one and the new one, and re-read PARTS.md for each part this app uses.
5. Push, and tell the person what changed on the screen: a field that looks different, a new
   option, a colour that moved. If nothing visible changed, say so.

A GitHub security alert on this repository against `@livetools/ui` or one of the libraries under
it means a fixed version exists. The fix is the same update step, run when the person or a
developer asks for it; do not run `npm audit fix`, because it moves versions outside that step.

## Reporting a part that is wrong

A part that paints or announces wrong, refuses a legitimate shape, or lacks a prop a real screen
needs is the design system's defect, not this app's. Do not patch around it here: no CSS aimed at
its insides, no raw element in its place, no disabled rule, because a patch hides the defect from
every other app that has it. Report it as a consumer report in the design-system repository,
`livetools-dev/livetools-design-system`, at `docs/consumer-reports/<yyyy-mm-dd>-<app>.md`: what
the screen needed, what the part did, what you expected, and the smallest code that shows it. If
you cannot reach that repository, write the report out in full in your reply so a developer can
file it, and tell the person in plain words what the screen cannot do until it is fixed.
