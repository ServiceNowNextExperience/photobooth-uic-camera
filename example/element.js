import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import countdownAnimationCss from "../src/snc-photobooth-uic-camera/animation1.scss";
import "../src/index.js";

const initialState = {
	enabled: true,
	countdownDurationSeconds: 5,
	imageSize: { width: 800, height: 600 },
	watermarkImageUrl:
		"https://1000logos.net/wp-content/uploads/2021/09/ServiceNow-Logo.png",
	watermarkImageScale: 0.25,
	watermarkImagePosition: "bottom-center",
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
		});
		updateState({ snapRequested: Date.now() + "" });
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
						<button on-click={() => requestSnap()}>Snap!</button>
						<button
							on-click={() => {
								requestSnap(countdownDurationSeconds);
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
