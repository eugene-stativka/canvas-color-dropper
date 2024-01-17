type ColorDropperState = {
  mode: "idle" | "picker";
  hoveredColor: string | undefined;
};

export function initColorDropper(imageCanvasContainer: HTMLElement) {
  /**
   * Init canvas
   */
  const imageCanvas = document.createElement("canvas");
  imageCanvas.style.cursor = "crosshair";

  const maybeImageCanvasCtx = imageCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (maybeImageCanvasCtx === null) {
    throw new Error("Could not get canvas context");
  }

  const imageCanvasCtx = maybeImageCanvasCtx;

  /**
   * State
   */
  const state: ColorDropperState = {
    mode: "idle",
    hoveredColor: undefined,
  };

  /**
   * Set up UI
   */
  const img = new Image();
  img.src = "/background.jpg";
  img.onload = drawImage;

  function drawImage() {
    imageCanvasCtx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
  }

  let imageCanvasBoundingClientRect = imageCanvas.getBoundingClientRect();

  function resizeImageCanvas() {
    imageCanvas.width = window.innerWidth * 0.8; // Set the drawing buffer size to 90% of the window width
    imageCanvas.height = imageCanvas.width / (16 / 9); // Example: Set height based on a 16:9 aspect ratio, modify as needed
    imageCanvasBoundingClientRect = imageCanvas.getBoundingClientRect();
  }

  imageCanvasContainer.appendChild(imageCanvas);
  resizeImageCanvas();

  const magnifyingGlassContainer = document.createElement("div");
  magnifyingGlassContainer.style.display = "grid";
  magnifyingGlassContainer.style.alignItems = "end";
  magnifyingGlassContainer.style.justifyItems = "center";
  magnifyingGlassContainer.style.position = "fixed";
  magnifyingGlassContainer.style.top = "0";
  magnifyingGlassContainer.style.left = "0";
  magnifyingGlassContainer.style.transition = "transform 0.1s ease-out";

  const magnifyingGlassCanvas = document.createElement("canvas");
  magnifyingGlassCanvas.width = 100;
  magnifyingGlassCanvas.height = 100;
  magnifyingGlassCanvas.style.borderRadius = "50%";
  updateMagnifyingGlassBorder();
  magnifyingGlassContainer.appendChild(magnifyingGlassCanvas);

  const maybeMagnifyingGlassCanvasCtx = magnifyingGlassCanvas.getContext("2d");

  if (maybeMagnifyingGlassCanvasCtx === null) {
    throw new Error("Could not get magnifying glass canvas context");
  }

  const magnifyingGlassCanvasCtx = maybeMagnifyingGlassCanvasCtx;

  const hexCodeContainer = document.createElement("span");
  hexCodeContainer.style.position = "absolute";
  hexCodeContainer.style.bottom = "12px";
  hexCodeContainer.style.minWidth = "56px";
  hexCodeContainer.style.textAlign = "center";
  hexCodeContainer.style.padding = "2px 4px";
  hexCodeContainer.style.backgroundColor = "white";
  hexCodeContainer.style.color = "black";
  hexCodeContainer.style.borderRadius = "8px";
  hexCodeContainer.style.fontSize = "12px";
  magnifyingGlassContainer.appendChild(hexCodeContainer);

  imageCanvasContainer.style.position = "relative";
  imageCanvasContainer.appendChild(magnifyingGlassContainer);

  /**
   * Attach event listeners
   */
  window.addEventListener("resize", () => {
    resizeImageCanvas();
    drawImage();
  });

  const togglePickerModeButton = document.getElementById("toggle-picker-mode");

  if (togglePickerModeButton === null) {
    throw new Error("Could not find the toggle picker mode button in DOM");
  }

  togglePickerModeButton.addEventListener("click", () => {
    const modesRecord: Record<
      ColorDropperState["mode"],
      ColorDropperState["mode"]
    > = { idle: "picker", picker: "idle" };

    state.mode = modesRecord[state.mode];

    updateMagnifyingGlassBorder();
  });

  const magnifyingGlassOffsetPx = 24;

  function onMouseMove(event: MouseEvent) {
    // use requestAnimationFrame for smooth animations
    window.requestAnimationFrame(() => {
      const x = event.clientX - imageCanvasBoundingClientRect.left;
      const y = event.clientY - imageCanvasBoundingClientRect.top;
      const pixel = imageCanvasCtx.getImageData(x, y, 1, 1).data;
      const hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);

      state.hoveredColor = hexColor;
      hexCodeContainer.textContent = hexColor;
      updateMagnifyingGlassBorder();

      // update the magnifying glass position and content
      const magnifiedWidth = magnifyingGlassCanvas.width / magnificationFactor;
      const magnifiedHeight =
        magnifyingGlassCanvas.height / magnificationFactor;

      // Make sure the hovered pixel is in the center of the magnifying glass
      // by calculating the top-left corner of the source rectangle
      const sourceX = x - magnifiedWidth / 2;
      const sourceY = y - magnifiedHeight / 2;

      // Clear the previous image
      magnifyingGlassCanvasCtx.clearRect(
        0,
        0,
        magnifyingGlassCanvas.width,
        magnifyingGlassCanvas.height,
      );

      // Draw the magnified content
      magnifyingGlassCanvasCtx.drawImage(
        imageCanvas,
        Math.max(0, sourceX), // Ensure the source rectangle doesn't go outside the canvas bounds
        Math.max(0, sourceY), // Ensure the source rectangle doesn't go outside the canvas bounds
        magnifiedWidth,
        magnifiedHeight,
        0,
        0,
        magnifyingGlassCanvas.width,
        magnifyingGlassCanvas.height,
      );

      // draw the grid on top of the magnified content
      const cellSize = magnificationFactor;
      const halfCellSize = cellSize / 2;
      const centerX = magnifyingGlassCanvas.width / 2;
      const centerY = magnifyingGlassCanvas.height / 2;

      magnifyingGlassCanvasCtx.beginPath();
      magnifyingGlassCanvasCtx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      magnifyingGlassCanvasCtx.lineWidth = 0.25;

      // Start drawing from the center offset by half a cell size
      for (
        let x = centerX - halfCellSize;
        x <= magnifyingGlassCanvas.width;
        x += cellSize
      ) {
        magnifyingGlassCanvasCtx.moveTo(x, 0);
        magnifyingGlassCanvasCtx.lineTo(x, magnifyingGlassCanvas.height);
      }
      for (let x = centerX + halfCellSize; x >= 0; x -= cellSize) {
        magnifyingGlassCanvasCtx.moveTo(x, 0);
        magnifyingGlassCanvasCtx.lineTo(x, magnifyingGlassCanvas.height);
      }

      for (
        let y = centerY - halfCellSize;
        y <= magnifyingGlassCanvas.height;
        y += cellSize
      ) {
        magnifyingGlassCanvasCtx.moveTo(0, y);
        magnifyingGlassCanvasCtx.lineTo(magnifyingGlassCanvas.width, y);
      }
      for (let y = centerY + halfCellSize; y >= 0; y -= cellSize) {
        magnifyingGlassCanvasCtx.moveTo(0, y);
        magnifyingGlassCanvasCtx.lineTo(magnifyingGlassCanvas.width, y);
      }

      magnifyingGlassCanvasCtx.stroke();

      // highlight the central pixel

      // the central pixel coordinates are in the middle of the magnifying glass
      // const centerX = (magnifyingGlassCanvas.width - magnificationFactor) / 2;
      // const centerY = (magnifyingGlassCanvas.height - magnificationFactor) / 2;

      // draw the highlight
      magnifyingGlassCanvasCtx.strokeStyle = "white"; // Color that stands out
      magnifyingGlassCanvasCtx.lineWidth = 1; // Thickness of the highlight box
      magnifyingGlassCanvasCtx.strokeRect(
        (magnifyingGlassCanvas.width - magnificationFactor) / 2 - 1,
        (magnifyingGlassCanvas.height - magnificationFactor) / 2 - 1,
        magnificationFactor + 2,
        magnificationFactor + 2,
      );

      magnifyingGlassContainer.style.transform = `translate(${event.pageX + magnifyingGlassOffsetPx}px, ${event.pageY + magnifyingGlassOffsetPx}px)`;
    });
  }

  imageCanvas.addEventListener("mousemove", onMouseMove);

  const magnificationFactor = 5; // The zoom level of the magnifying glass

  const selectedHexCodeContainer = document.getElementById(
    "selected-hex-code-container",
  );

  if (selectedHexCodeContainer === null) {
    throw new Error("Could nog find the hex code container in DOM");
  }

  // add a click event listener to the canvas for color picking
  imageCanvas.addEventListener("click", () => {
    if (state.mode === "picker" && state.hoveredColor !== undefined) {
      selectedHexCodeContainer.textContent = state.hoveredColor;
      updateMagnifyingGlassBorder();
    }
  });

  function updateMagnifyingGlassBorder() {
    const innerRingColorsRecord: Record<ColorDropperState["mode"], string> = {
      idle: "gray",
      picker: state.hoveredColor ?? "gray",
    };

    magnifyingGlassCanvas.style.boxShadow = `0 0 0 8px ${innerRingColorsRecord[state.mode]}, 0 0 0 10px white`;
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  // Convert each component and concatenate them
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

// helper function to convert a single color component to a hex string
function componentToHex(colorComponent: number): string {
  const hex = colorComponent.toString(16);
  return hex.padStart(2, "0");
}
