import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import countdownAnimationCss from "../src/snc-photobooth-uic-camera/animation1.scss";
import "../src/index.js";

const initialState = {
	enabled: true,
	countdownDurationSeconds: 0,
	imageSize: { width: 800, height: 600 },
	watermarkImageUrl: "/@snc/photobooth-uic-camera/ServiceNow-Logo.png",
	watermarkImageScale: 0.4,
	watermarkImagePosition: "top-left",
};

const view = (state, { updateState, dispatch }) => {
	console.log("ELEMENT VIEW");
	console.log(state);
	const {
		enabled,
		snapRequested,
		countdownDurationSeconds,
		imageSize,
		watermarkImageUrl,
		watermarkImageScale,
		watermarkImagePosition,
	} = state;
	const toggleEnabledExternally = () => {
		console.log("TOGGLE ENABLED EXTERNALLY");
		updateState({ enabled: !enabled });
	};

	const requestSnap = (countdownDurationSeconds) => {
		console.log("REQUEST SNAP");
		updateState({
			countdownDurationSeconds: countdownDurationSeconds || 0,
			snapRequested: Date.now() + "",
		});
	};

	return (
		<div style={{ position: "relative" }}>
			<div id="camera" style={{ position: "relative" }}>
				<snc-photobooth-uic-camera
					enabled={enabled}
					snapRequested={snapRequested}
					countdownDurationSeconds={countdownDurationSeconds}
					imageSize={imageSize}
					countdownAnimationCss={countdownAnimationCss}
					watermarkImageUrl={watermarkImageUrl}
					watermarkImageScale={watermarkImageScale}
					watermarkImagePosition={watermarkImagePosition}
				></snc-photobooth-uic-camera>
			</div>
			<div id="controls" style={{ position: "relative" }}>
				<button on-click={() => toggleEnabledExternally()}>
					Toggle Enabled
				</button>
				{enabled ? (
					<span>
						<button on-click={() => requestSnap(0)}>Snap!</button>
						<button
							on-click={() => {
								requestSnap(5);
							}}
						>
							Countdown
						</button>
					</span>
				) : null}
				{snapRequested ? (
					<button
						on-click={() => {
							updateState({ snapRequested: "" });
						}}
					>
						Reset
					</button>
				) : null}
			</div>
		</div>
	);
};

createCustomElement("snc-photobooth-uic-camera-examples", {
	initialState: initialState,
	renderer: { type: snabbdom },
	view,
});

const el = document.createElement("main");
document.body.appendChild(el);

el.innerHTML = "<snc-photobooth-uic-camera-examples/>";
