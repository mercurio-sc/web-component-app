# @mercurio-sc/web-component-app

## What it does

This package converts React components to Web Component with Shadow DOM.
To allow you share React applications or components as native elements that
don't require being mounted through React. The custom element acts as a
wrapper for the underlying React component.

## How to install

Just run a simple

```sh
npm i @mercurio-sc/web-component-app
# or
yarn add @mercurio-sc/web-component-app
```

## How to use it

Install `@mercurio-sc/web-component-app` to create a entry point as a Web Component
and implement it like this:

```tsx
const WebComponentApp = webComponentApp<Props>("web-component-name", App);

customElements.define("web-component-name", WebComponentApp);
```

Build your web component and export the entry point bundle in `dist/assets/index-[chunk].js`
and do React implementation.

Added to `index.html` file in `<head>` tag.

```html
<head>
  <script type="module" src="http://localhost:4153/assets/index-Jh48h.js" />
</head>
```

Now you can use `<web-component-name>` like any other HTML element.

```html
<body>
  <h1>Hey this is a H1 Title</h1>

  <web-component-name></web-component-name>
</body>
```

And create a custom element in React with `React.createElement`.

```jsx
import { createElement } from "react";

createElement("web-component-name");
```

## API

`webComponentApp(ReactComponent, React, ReactDOM, options)` takes the following:

- `ReactComponent` - A React component that you want to
  convert to a Web Component.
- `options` - An set of parameters.

  - `options.shadow` - Use shadow DOM rather than light DOM.
  - `options.styles` - Inject CSS files from URLs to apply styles to shadow DOM.
  - `options.props` - Array of camelCasedProps to watch as String values or { [camelCasedProps]: "string" | "number" | "boolean" | "function" | "json" }

    - When specifying Array or Object as the type, the string passed into the attribute must pass `JSON.parse()` requirements.
    - When specifying Boolean as the type, "true", "1", "yes", "TRUE", and "t" are mapped to `true`. All strings NOT begining with t, T, 1, y, or Y will be `false`.
    - When specifying Function as the type, the string passed into the attribute must be the name of a function on `window` (or `global`). The `this` context of the function will be the instance of the WebComponent / HTMLElement when called.
    - If PropTypes are defined on the React component, the `options.props` will be ignored and the PropTypes will be used instead.
      However, we strongly recommend using `options.props` instead of PropTypes as it is usually not a good idea to use PropTypes in production.
    - If `options.props` is an array of string (prop names), the type of those props will be `String`.

  A new class inheriting from `HTMLElement` is
  returned. This class is of type CustomElementConstructor can be directly passed to `customElements.define` as follows:

```js
customElements.define("web-greeting", webComponentApp(Greeting));
```

Or the class can be defined and used later:

```js
const WebGreeting = webComponentApp(Greeting);

customElements.define("web-greeting", WebGreeting);

var myGreeting = new WebGreeting();
document.body.appendChild(myGreeting);
```

If propTypes are defined on the underlying React component, dashed-attributes on the webcomponent are converted into the corresponding camelCase React props and the string attribute value is passed in.

```js
function Greeting({ camelCaseName }) {
  return <h1>Hello, {camelCaseName}</h1>;
}
Greeting.propTypes = {
  camelCaseName: PropTypes.string.isRequired,
};

customElements.define(
  "my-dashed-style-greeting",
  webComponentApp(Greeting, {})
);

document.body.innerHTML =
  '<my-dashed-style-greeting camel-case-name="Christopher"></my-dashed-style-greeting>';

console.log(document.body.firstElementChild.innerHTML); // "<h1>Hello, Christopher</h1>"
```

If `options.props` is specified, this package will use those props instead of the keys from propTypes. If it's an array, all corresponding kebob-cased attr values will be passed as strings to the underlying React component.

```js
function Greeting({ camelCaseName }) {
  return <h1>Hello, {camelCaseName}</h1>;
}

customElements.define(
  "my-dashed-style-greeting",
  webComponentApp(Greeting, {
    props: { camelCaseName: "string" },
  })
);

document.body.innerHTML =
  '<my-dashed-style-greeting camel-case-name="Jane"></my-dashed-style-greeting>';

console.log(document.body.firstElementChild.innerHTML); // "<h1>Hello, Jane</h1>"
```

## Typed Props

If `options.props` is an object, the keys are the camelCased React props and the values are any one of the following built in javascript types.
This is the recommended way of passing props to r2wc.

`"string" | "number" | "boolean" | "function" | "json"`

"json" can be an array or object. The string passed into the attribute must pass `JSON.parse()` requirements.

### "string" | "number" | "boolean" | "function" | "json" props

```js
function AttrPropTypeCasting(props) {
  console.log(props); // Note
  return <h1>Hello, {props.stringProp}</h1>;
}

customElements.define(
  "attr-prop-type-casting",
  webComponentApp(AttrPropTypeCasting, {
    props: {
      stringProp: "string",
      numProp: "number",
      floatProp: "number",
      trueProp: "boolean",
      falseProp: "boolean",
      arrayProp: "json",
      objProp: "json",
    },
  })
);

document.body.innerHTML = `
  <attr-prop-type-casting
    string-prop="iloveyou"
    num-prop="360"
    float-prop="0.5"
    true-prop="true"
    false-prop="false"
    array-prop='[true, 100.25, "👽", { "aliens": "welcome" }]'
    obj-prop='{ "very": "object", "such": "wow!" }'
  ></attr-prop-type-casting>
`;

/*
  console.log(props) in the functions produces this:
  {
    stringProp: "iloveyou",
    numProp: 360,
    floatProp: 0.5,
    trueProp: true,
    falseProp: false,
    arrayProp: [true, 100.25, "👽", { aliens: "welcome" }],
    objProp: { very: "object", such: "wow!" },
  }
*/
```

### Function props

When `Function` is specified as the type, attribute values on the web component will be converted into function references when passed into the underlying React component. The string value of the attribute must be a valid reference to a function on `window` (or on `global`).

```js
function ThemeSelect({ handleClick }) {
  return (
    <div>
      <button onClick={() => handleClick("V")}>V</button>
      <button onClick={() => handleClick("Johnny")}>Johnny</button>
      <button onClick={() => handleClick("Jane")}>Jane</button>
    </div>
  );
}

const WebThemeSelect = webComponentApp(ThemeSelect, {
  props: {
    handleClick: "function",
  },
});

customElements.define("theme-select", WebThemeSelect);

window.globalFn = function (selected) {
  // "this" is the instance of the WebComponent / HTMLElement
  const thisIsEl = this === document.querySelector("theme-select");
  console.log(thisIsEl, selected);
};

document.body.innerHTML =
  "<theme-select handle-click='globalFn'></theme-select>";

setTimeout(
  () => document.querySelector("theme-select button:last-child").click(),
  0
);
// ^ calls globalFn, logs: true, "Jane"
```
