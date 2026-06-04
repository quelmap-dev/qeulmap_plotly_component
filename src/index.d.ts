import { ComponentProps } from "react";
import Plot from "react-plotly.js";

export type QuelmapPlotProps = ComponentProps<typeof Plot>;

export declare function QuelmapPlot(props: QuelmapPlotProps): JSX.Element;

export interface VanillaQuelmapPlotOptions {
  data?: unknown[];
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  onInitialized?: (figure: unknown, plotDiv: HTMLElement) => void;
  onUpdate?: (figure: unknown, plotDiv: HTMLElement) => void;
}

export interface VanillaQuelmapPlotInstance {
  element: HTMLElement;
  update: (nextOptions?: VanillaQuelmapPlotOptions) => Promise<void>;
  destroy: () => void;
}

export declare function createQuelmapPlot(
  target: string | HTMLElement,
  initialOptions?: VanillaQuelmapPlotOptions,
): Promise<VanillaQuelmapPlotInstance>;
