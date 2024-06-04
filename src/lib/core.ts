import type { WebComponentType } from "./transforms";

import transforms from "./transforms";
import { toDashedCase } from "./utils";

type PropName<Props> = Exclude<Extract<keyof Props, string>, "container">;
type PropNames<Props> = Array<PropName<Props>>;

export interface WebComponentOptions<Props> {
  shadow?: "open" | "closed";
  styles?: string | string[];
  props?: PropNames<Props> | Partial<Record<PropName<Props>, WebComponentType>>;
}

export interface WebComponentRenderer<Props, Context> {
  mount: (
    container: HTMLElement,
    ReactComponent: React.ComponentType<Props>,
    props: Props
  ) => Context;
  update: (context: Context, props: Props) => void;
  unmount: (context: Context) => void;
}

export interface WebComponentBaseProps {
  container?: HTMLElement;
}

const renderSymbol = Symbol.for("webComponentApp.render");
const connectedSymbol = Symbol.for("webComponentApp.connected");
const contextSymbol = Symbol.for("webComponentApp.context");
const propsSymbol = Symbol.for("webComponentApp.props");

/**
 * Converts a React component into a Web Component.
 * @param {ReactComponent}
 * @param {Object} options - Optional parameters
 * @param {String?} options.shadow - Shadow DOM mode as either open or closed.
 * @param {Object|Array?} options.props - Array of camelCasedProps to watch as Strings or { [camelCasedProp]: "string" | "number" | "boolean" | "function" | "json" }
 */
export default function webComponentAppCore<
  Props extends WebComponentBaseProps,
  Context
>(
  ReactComponent: React.ComponentType<Props>,
  options: WebComponentOptions<Props>,
  renderer: WebComponentRenderer<Props, Context>
): CustomElementConstructor {
  if (!options.props) {
    options.props = ReactComponent.propTypes
      ? (Object.keys(ReactComponent.propTypes) as PropNames<Props>)
      : [];
  }

  const propNames = Array.isArray(options.props)
    ? options.props.slice()
    : (Object.keys(options.props) as PropNames<Props>);

  const propTypes = {} as Partial<Record<PropName<Props>, WebComponentType>>;
  const mapPropAttribute = {} as Record<PropName<Props>, string>;
  const mapAttributeProp = {} as Record<string, PropName<Props>>;
  for (const prop of propNames) {
    propTypes[prop] = Array.isArray(options.props)
      ? "string"
      : options.props[prop];

    const attribute = toDashedCase(prop);

    mapPropAttribute[prop] = attribute;
    mapAttributeProp[attribute] = prop;
  }

  class ReactWebComponent extends HTMLElement {
    static get observedAttributes() {
      return Object.keys(mapAttributeProp);
    }

    [connectedSymbol] = true;
    [contextSymbol]?: Context;
    [propsSymbol]: Props = {} as Props;
    container: HTMLElement;

    constructor() {
      super();

      this.container = this.attachShadow({
        mode: options.shadow || "open",
      }) as unknown as HTMLElement;

      this[propsSymbol].container = this.container;

      if (options.styles) {
        const styles = Array.isArray(options.styles)
          ? options.styles
          : [options.styles];

        for (const style of styles) {
          const element = document.createElement("link");
          element.rel = "stylesheet";
          element.href = style;
          this.container.appendChild(element);
        }
      }

      for (const prop of propNames) {
        const attribute = mapPropAttribute[prop];
        const value = this.getAttribute(attribute);
        const type = propTypes[prop];
        const transform = type ? transforms[type] : null;

        if (transform?.parse && value) {
          //@ts-ignore
          this[propsSymbol][prop] = transform.parse(value, attribute, this);
        }
      }
    }

    connectedCallback() {
      this[connectedSymbol] = true;
      this[renderSymbol]();
    }

    disconnectedCallback() {
      this[connectedSymbol] = false;

      if (this[contextSymbol]) {
        renderer.unmount(this[contextSymbol]);
      }
      delete this[contextSymbol];
    }

    attributeChangedCallback(
      attribute: string,
      oldValue: string,
      value: string
    ) {
      const prop = mapAttributeProp[attribute];
      const type = propTypes[prop];
      const transform = type ? transforms[type] : null;

      if (prop in propTypes && transform?.parse && value) {
        //@ts-ignore
        this[propsSymbol][prop] = transform.parse(value, attribute, this);

        this[renderSymbol]();
      }
    }

    [renderSymbol]() {
      if (!this[connectedSymbol]) return;

      if (!this[contextSymbol]) {
        this[contextSymbol] = renderer.mount(
          this.container,
          ReactComponent,
          this[propsSymbol]
        );
      } else {
        renderer.update(this[contextSymbol], this[propsSymbol]);
      }
    }
  }

  for (const prop of propNames) {
    const attribute = mapPropAttribute[prop];
    const type = propTypes[prop];

    Object.defineProperty(ReactWebComponent.prototype, prop, {
      enumerable: true,
      configurable: true,
      get() {
        return this[propsSymbol][prop];
      },
      set(value) {
        this[propsSymbol][prop] = value;

        const transform = type ? transforms[type] : null;
        if (transform?.stringify) {
          //@ts-ignore
          const attributeValue = transform.stringify(value, attribute, this);
          const oldAttributeValue = this.getAttribute(attribute);

          if (oldAttributeValue !== attributeValue) {
            this.setAttribute(attribute, attributeValue);
          }
        } else {
          this[renderSymbol]();
        }
      },
    });
  }

  return ReactWebComponent;
}
