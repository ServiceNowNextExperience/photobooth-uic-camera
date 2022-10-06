import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";

import "../src/index.js";

const view = (state, { updateState }) => {
	const { enabled } = state;
	const toggleEnabledExternally = () => {
		updateState({ enabled: !enabled });
	};

	return (
		<div>
			<div>
				<snc-photobooth-uic-camera
					enabled={enabled}
				></snc-photobooth-uic-camera>
			</div>
			<div>
				<button on-click={() => toggleEnabledExternally()}>
					Toggle Externally
				</button>
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
