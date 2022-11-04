import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import countdownAnimationCss from "../src/snc-photobooth-uic-camera/animation1.scss";
import "../src/index.js";

const view = (state, { updateState, dispatch }) => {
	console.log("ELEMENT VIEW");
	console.log(state);
	const { enabled, snapRequested, countdownDurationSeconds, imageSize } = state;
	const toggleEnabledExternally = () => {
		console.log("TOGGLE ENABLED EXTERNALLY");
		console.log(state);
		updateState({ enabled: !enabled });
	};

	const requestSnap = (countdownDurationSeconds) => {
		console.log("REQUEST SNAP");
		console.log(state);
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
	initialState: {
		enabled: true,
		countdownDurationSeconds: 5,
		imageSize: { width: 800, height: 600 },
	},
	renderer: { type: snabbdom },
	view,
});

const el = document.createElement("main");
document.body.appendChild(el);

el.innerHTML = "<snc-photobooth-uic-camera-examples/>";
