const refreshIcon = {
  width: 24,
  height: 24,
  path: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
};

const DEFAULT_MIN_HEIGHT = 400;

const getTranslate = (el) => {
  const style = getComputedStyle(el);
  const matrix = new DOMMatrix(style.transform);

  return {
    x: matrix.m41,
    y: matrix.m42,
    z: matrix.m43,
  };
};

export const mergeQuelmapLayout = (layout = {}, containerHeight = 0) => ({
  modebar: {
    bgcolor: "transparent",
    color: "#999",
    activecolor: "#555",
  },
  paper_bgcolor: "rgba(255,255,255, 0)",
  ...layout,
  autosize: true,
  height: layout.height || containerHeight || DEFAULT_MIN_HEIGHT,
  dragmode: "orbit",
});

export function createPlotlyDomController({ onResetView } = {}) {
  const state = {
    isExpanded: false,
    observer: null,
    tooltip: null,
    mouseMoveHandler: null,
    mouseMoveTarget: null,
  };

  const cleanupTooltip = () => {
    if (state.mouseMoveTarget && state.mouseMoveHandler) {
      state.mouseMoveTarget.removeEventListener("mousemove", state.mouseMoveHandler);
    }
    state.mouseMoveTarget = null;
    state.mouseMoveHandler = null;
    if (state.tooltip) {
      state.tooltip.remove();
      state.tooltip = null;
    }
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
  };

  const getInternalConfig = (config = {}) => ({
    displaylogo: false,
    responsive: true,
    ...config,
    modeBarButtonsToAdd: [
      ...(config.modeBarButtonsToAdd || []),
      {
        name: "component_reload",
        title: "Reset View",
        icon: refreshIcon,
        click: () => {
          if (onResetView) onResetView();
        },
      },
    ],
  });

  const customizeModebar = (plotDiv) => {
    const modebar = plotDiv.querySelector(".modebar");
    if (!modebar) return;

    const groups = modebar.querySelectorAll(".modebar-group");
    if (groups.length === 0) return;

    const downloadGroup = groups[0];
    const downloadBtn = downloadGroup.querySelector(".modebar-btn");
    if (downloadBtn) {
      const svg = downloadBtn.querySelector("svg");
      if (svg) {
        svg.setAttribute("viewBox", "0 0 24 24");
        const path = svg.querySelector("path");
        if (path) {
          path.setAttribute("d", "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z");
          path.removeAttribute("transform");
        }
      }
    }

    const otherGroups = Array.from(groups)
      .slice(1)
      .filter((group) => !group.querySelector(".modebar-btn--details"));

    otherGroups.forEach((group) => {
      if (state.isExpanded) {
        group.classList.remove("modebar-group--hidden");
        group.classList.add("modebar-group--expanded");
      } else {
        group.classList.add("modebar-group--hidden");
        group.classList.remove("modebar-group--expanded");
      }
    });

    const existingDetailsGroup = modebar.querySelector(".modebar-btn--details")?.closest(".modebar-group");
    if (existingDetailsGroup) {
      existingDetailsGroup.remove();
    }

    const detailsGroup = document.createElement("div");
    detailsGroup.className = "modebar-group";
    detailsGroup.style.padding = "0";
    detailsGroup.style.backgroundColor = "transparent";

    const detailsBtn = document.createElement("button");
    detailsBtn.type = "button";
    detailsBtn.className = "modebar-btn modebar-btn--details";
    detailsBtn.setAttribute("aria-label", "詳細メニューを表示");

    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.setAttribute("height", "1em");
    iconSvg.setAttribute("width", "1em");
    iconSvg.style.fill = "currentColor";

    const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const morePath =
      "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z";
    const closePath = "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";

    iconPath.setAttribute("d", state.isExpanded ? closePath : morePath);
    detailsBtn.classList.toggle("active", state.isExpanded);
    iconSvg.appendChild(iconPath);
    detailsBtn.appendChild(iconSvg);

    detailsBtn.addEventListener("click", () => {
      state.isExpanded = !state.isExpanded;
      detailsBtn.classList.toggle("active", state.isExpanded);
      iconPath.setAttribute("d", state.isExpanded ? closePath : morePath);

      let delay = 0;
      otherGroups.forEach((group) => {
        group.classList.toggle("modebar-group--hidden", !state.isExpanded);
        group.classList.toggle("modebar-group--expanded", state.isExpanded);

        group.querySelectorAll("button").forEach((btn) => {
          if (state.isExpanded) {
            btn.style.animationDelay = `${delay}ms`;
            delay += 60;
          } else {
            btn.style.animationDelay = "";
          }
        });
      });
    });

    detailsGroup.appendChild(detailsBtn);
    downloadGroup.after(detailsGroup);
  };

  const setupCustomTooltip = (plotDiv) => {
    cleanupTooltip();

    const plotlyContainer = plotDiv.querySelector(".plot-container.plotly .modebar-container");

    const tooltip = document.createElement("div");
    tooltip.className = "custom-tooltip";
    state.tooltip = tooltip;

    let baseCoords = { x: 0, y: 0 };
    let isVisible = false;
    let vanishTimeout = null;

    state.mouseMoveHandler = (event) => {
      if (!isVisible) return;
      const rect = plotDiv.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const offsetX = (mouseX - baseCoords.x) * 0.2;
      const offsetY = (mouseY - baseCoords.y) * 0.2;

      tooltip.style.transform = `translate(${baseCoords.x + offsetX}px, ${baseCoords.y + offsetY}px)`;
    };

    state.mouseMoveTarget = plotDiv;
    plotDiv.addEventListener("mousemove", state.mouseMoveHandler);

    const hoverlayer2d = plotDiv.querySelector("g.hoverlayer");
    if (hoverlayer2d && plotlyContainer) {
      plotlyContainer.appendChild(tooltip);
    }

    const hoverlayer3d = plotDiv.querySelector(".gl-container #scene svg");
    if (hoverlayer3d) {
      const scene = plotDiv.querySelector(".gl-container #scene");
      if (scene) scene.appendChild(tooltip);
    }

    const hoverlayer = hoverlayer3d || hoverlayer2d;
    const is3D = Boolean(hoverlayer3d);

    if (!hoverlayer) return;

    state.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        Array.from(mutation.addedNodes).forEach((node) => {
          if (
            node.nodeType !== Node.ELEMENT_NODE ||
            !node.classList.contains("hovertext")
          ) {
            return;
          }

          if (vanishTimeout) clearTimeout(vanishTimeout);

          const transform = node.getAttribute("transform");
          const match = transform?.match(/translate\(([\d.-]+),([\d.-]+)\)/);
          const coords = match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
          const pathEl = node.querySelector("path");
          const fill = pathEl ? window.getComputedStyle(pathEl).fill : null;
          const textEls = node.querySelectorAll("text");
          let text = "";
          let fontSize = null;

          textEls.forEach((textEl) => {
            const tspans = textEl.childNodes;
            if (tspans.length === 0) {
              text += `${textEl.textContent}<br>`;
            } else {
              tspans.forEach((tspan) => {
                text += `${tspan.textContent}<br>`;
              });
            }
            fontSize = textEl ? parseFloat(window.getComputedStyle(textEl).fontSize) : null;
          });

          if (!coords) return;

          baseCoords = coords;
          if (getTranslate(tooltip).x === 0 && getTranslate(tooltip).y === 0) {
            tooltip.style.transition = "none";
            tooltip.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
            requestAnimationFrame(() => {
              tooltip.style.transition = "";
            });
          }

          if (is3D) {
            tooltip.style.transform = `translate(calc(${coords.x}px + 50px), calc(${coords.y}px + 15px - 50%)`;
          } else {
            tooltip.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
          }

          tooltip.style.fontSize = fontSize ? `${fontSize}px` : "inherit";
          tooltip.innerHTML = text || "";
          const gradient = `
              linear-gradient(
              to bottom,
              rgba(0,0,0,0) 0%,
              rgba(0,0,0,0.15) 100%
              ),
              ${fill}
            `;
          tooltip.style.setProperty("--tooltip-accent", gradient);
          tooltip.style.opacity = "1";

          if (!is3D) {
            isVisible = true;
          }
        });

        Array.from(mutation.removedNodes).forEach((node) => {
          if (
            node.nodeType !== Node.ELEMENT_NODE ||
            !node.classList.contains("hovertext")
          ) {
            return;
          }

          if (hoverlayer.querySelectorAll(".hovertext").length === 0) {
            vanishTimeout = setTimeout(() => {
              tooltip.style.opacity = "0";
              isVisible = false;
            }, 300);
          }
        });
      });
    });

    state.observer.observe(hoverlayer, { childList: true });
  };

  const handleInitialized = (figure, plotDiv, externalHandler) => {
    state.isExpanded = false;
    customizeModebar(plotDiv);
    setupCustomTooltip(plotDiv);
    if (externalHandler) externalHandler(figure, plotDiv);
  };

  const handleUpdate = (figure, plotDiv, externalHandler) => {
    customizeModebar(plotDiv);
    if (externalHandler) externalHandler(figure, plotDiv);
  };

  return {
    cleanup: cleanupTooltip,
    customizeModebar,
    getInternalConfig,
    handleInitialized,
    handleUpdate,
  };
}

