import React from "react";
import { createRoot, Root } from "react-dom/client";
import webComponentAppCore, { WebComponentOptions } from "./lib/core";

interface Context<Props extends object> {
  root: Root;
  ReactComponent: React.ComponentType<Props>;
}

function mount<Props extends object>(
  container: HTMLElement,
  ReactComponent: React.ComponentType<Props>,
  props: Props
): Context<Props> {
  const root = createRoot(container);

  const element = React.createElement(ReactComponent, props);
  root.render(element);

  return {
    root,
    ReactComponent,
  };
}

function update<Props extends object>(
  { root, ReactComponent }: Context<Props>,
  props: Props
): void {
  const element = React.createElement(ReactComponent, props);
  root.render(element);
}

function unmount<Props extends object>({ root }: Context<Props>): void {
  root.unmount();
}

export default function webComponentApp<Props extends object>(
  ReactComponent: React.ComponentType<Props>,
  options: WebComponentOptions<Props> = {}
): CustomElementConstructor {
  return webComponentAppCore(ReactComponent, options, {
    mount,
    update,
    unmount,
  });
}
