import Plotly from "plotly.js";
import { createPlotlyDomController, DEFAULT_MIN_HEIGHT, mergeQuelmapLayout } from "./plotly-customization";

const resolveContainer = (target) => {
  if (typeof target === "string") {
    return document.querySelector(target);
  }
  return target;
};

const ensureContainerStyle = (container) => {
  if (!container.style.minHeight) {
    container.style.minHeight = `${DEFAULT_MIN_HEIGHT}px`;
  }
  if (!container.style.position) {
    container.style.position = "relative";
  }
};

/**
 * Create a Plotly chart without React.
 * @param {string | HTMLElement} target Selector or plot container element.
 * @param {{ data?: unknown[], layout?: Record<string, unknown>, config?: Record<string, unknown>, onInitialized?: Function, onUpdate?: Function }} initialOptions Initial chart options.
 * @returns {Promise<{ element: HTMLElement, update: (nextOptions?: object) => Promise<void>, destroy: () => void }>}
 */
export async function createQuelmapPlot(target, initialOptions = {}) {
  const container = resolveContainer(target);
  if (!(container instanceof HTMLElement)) {
    throw new Error("createQuelmapPlot: target must be a selector or HTMLElement");
  }

  ensureContainerStyle(container);

  let currentOptions = {
    data: initialOptions.data || [],
    layout: initialOptions.layout || {},
    config: initialOptions.config || {},
    onInitialized: initialOptions.onInitialized,
    onUpdate: initialOptions.onUpdate,
  };

  let isDestroyed = false;
  let resizeObserver = null;
  let resizeAnimationFrame = null;
  let containerHeight = container.clientHeight || DEFAULT_MIN_HEIGHT;
  let hasInitialized = false;

  const controller = createPlotlyDomController({
    onResetView: () => {
      if (isDestroyed || !hasInitialized) return;
      void Plotly.react(
        container,
        currentOptions.data,
        mergeQuelmapLayout(currentOptions.layout, containerHeight),
        controller.getInternalConfig(currentOptions.config),
      ).then((figure) => {
        controller.handleUpdate(figure, container, currentOptions.onUpdate);
      });
    },
  });

  const render = async ({ forceNew = false } = {}) => {
    if (isDestroyed) return;
    const mergedLayout = mergeQuelmapLayout(currentOptions.layout, containerHeight);
    const internalConfig = controller.getInternalConfig(currentOptions.config);

    if (!hasInitialized || forceNew) {
      const figure = await Plotly.newPlot(
        container,
        currentOptions.data,
        mergedLayout,
        internalConfig,
      );
      hasInitialized = true;
      controller.handleInitialized(figure, container, currentOptions.onInitialized);
      return;
    }

    const figure = await Plotly.react(
      container,
      currentOptions.data,
      mergedLayout,
      internalConfig,
    );
    controller.handleUpdate(figure, container, currentOptions.onUpdate);
  };

  const scheduleResize = () => {
    if (isDestroyed) return;
    if (resizeAnimationFrame !== null) cancelAnimationFrame(resizeAnimationFrame);
    resizeAnimationFrame = requestAnimationFrame(() => {
      resizeAnimationFrame = null;
      const nextHeight = container.clientHeight || DEFAULT_MIN_HEIGHT;
      if (nextHeight === containerHeight) {
        if (hasInitialized) Plotly.Plots.resize(container);
        return;
      }
      containerHeight = nextHeight;
      void render();
    });
  };

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      scheduleResize();
    });
    resizeObserver.observe(container);
  }

  await render({ forceNew: true });

  return {
    element: container,
    async update(nextOptions = {}) {
      if (isDestroyed) return;
      currentOptions = {
        ...currentOptions,
        ...nextOptions,
        data: nextOptions.data ?? currentOptions.data,
        layout: nextOptions.layout ?? currentOptions.layout,
        config: nextOptions.config ?? currentOptions.config,
        onInitialized: nextOptions.onInitialized ?? currentOptions.onInitialized,
        onUpdate: nextOptions.onUpdate ?? currentOptions.onUpdate,
      };
      await render();
    },
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      if (resizeAnimationFrame !== null) cancelAnimationFrame(resizeAnimationFrame);
      if (resizeObserver) resizeObserver.disconnect();
      controller.cleanup();
      Plotly.purge(container);
    },
  };
}
