import { initColorDropper } from "./color-dropper.ts";
import "./style.css";

const colorDropperContainer = document.getElementById("image-canvas-container");

if (colorDropperContainer !== null) {
  initColorDropper(colorDropperContainer);
}
