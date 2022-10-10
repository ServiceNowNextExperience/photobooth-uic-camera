import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";

import "../src/index.js";

const view = (state, { updateState, dispatch }) => {
	console.log("ELEMENT VIEW");
	console.log(state);
	const { enabled, snapRequested } = state;
	const toggleEnabledExternally = () => {
		console.log("TOGGLE ENABLED EXTERNALLY");
		console.log(state);
		updateState({ enabled: !enabled });
	};

	const requestSnap = () => {
		console.log("REQUEST SNAP");
		console.log(state);
		updateState({ snapRequested: Date.now() });
	};

	return (
		<div>
			<div>
				<snc-photobooth-uic-camera
					enabled={enabled}
					snapRequested={snapRequested}
				></snc-photobooth-uic-camera>
			</div>
			<div>
				<button on-click={() => toggleEnabledExternally()}>
					Toggle Externally
				</button>
				<button on-click={() => requestSnap()}>Snap!</button>
			</div>
		</div>
	);
};

createCustomElement("snc-photobooth-uic-camera-examples", {
	initialState: { enabled: true },
	renderer: { type: snabbdom },
	view,
});

const el = document.createElement("main");
document.body.appendChild(el);

el.innerHTML = "<snc-photobooth-uic-camera-examples/>";
