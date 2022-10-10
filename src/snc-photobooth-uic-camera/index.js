import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { actionTypes } from "@servicenow/ui-core";
const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED } = actionTypes;

const initialState = {
	enabled: false,
	snapRequested: "",
};

const initializeMedia = ({ video, enabled, updateState }) => {
	// Get access to the camera!
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		// Not adding `{ audio: true }` since we only want video now
		navigator.mediaDevices
			.getUserMedia({ video: true })
			.then(function (stream) {
				//video.src = window.URL.createObjectURL(stream);
				updateState({ stream: stream });
				video.srcObject = stream;
				video.play();
				toggleTracks({ stream, enabled });
			});
	}
};

const resumeTracks = ({ stream }) => {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = true));
	}
};

const pauseTracks = ({ stream }) => {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = false));
	}
};

const toggleTracks = ({ stream, enabled }) => {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = enabled));
	}
};

const actionHandlers = {
	[COMPONENT_CONNECTED]: ({ host, state, updateState }) => {
		debugger;
		const { enabled, snapRequested } = state.properties;

		console.log(COMPONENT_CONNECTED);
		console.log(state);

		// Grab elements, create settings, etc.
		const video = host.shadowRoot.getElementById("video");
		const canvas = host.shadowRoot.getElementById("canvas");
		const context = canvas.getContext("2d");

		updateState({
			video: video,
			context: context,
			enabled: enabled,
			snapRequested: snapRequested,
		});

		initializeMedia({ video, enabled, updateState });
	},
	[COMPONENT_PROPERTY_CHANGED]: ({
		state,
		updateState,
		properties,
		updateProperties,
		action,
	}) => {
		const { name, value, previousValue } = action.payload;
		debugger;
		console.log(COMPONENT_PROPERTY_CHANGED);
		console.log(state);
		console.log(name);
		console.log("ACTION!");
		console.log(action);

		const { enabled, snapRequested } = state.properties;
		updateState({ enabled: enabled });

		if (enabled === true) {
			resumeTracks(state);
		} else {
			pauseTracks(state);
		}
	},
};

const snap = ({ context, video }) => {
	let pos = 0;
	//	const { context, video } = state;

	const _snap = () => {
		switch (pos) {
			case 0:
				context.drawImage(video, 0, 0, 320, 240);
				pos = 1;
				break;
			case 1:
				context.drawImage(video, 320, 0, 320, 240);
				pos = 2;
				break;
			case 2:
				context.drawImage(video, 0, 240, 320, 240);
				pos = 3;
				break;
			case 3:
				context.drawImage(video, 320, 240, 320, 240);
				pos = 0;
				break;
		}
		if (pos != 0) {
			setTimeout(_snap, 500);
		}
	};

	_snap();
};

const view = (state) => {
	// Elements for taking the snapshot
	// Trigger photo take
	console.log("VIEW");
	console.log(state);

	return (
		<div>
			<video id="video" width="640" height="480" autoplay=""></video>
			<button id="snap" on-click={() => snap(state)}>
				Snap Photo
			</button>
			<canvas id="canvas" width="640" height="480"></canvas>
		</div>
	);
};

const dispatches = {
	/**
	 * Dispatched when CORS request is started. Used to manage
	 * @type {{response:string}}
	 */
	"PHOTOBOOTH_CAMERA#SNAPPED": {},
};

const properties = {
	/**
	 * Camera is enabled
	 * @type {boolean}
	 */
	enabled: {
		schema: { type: "boolean" },
		default: false,
	},

	/**
	 * Triggers a snapshot
	 * Required: No
	 *
	 * @private
	 * @type {{}}
	 */
	snapRequested: {
		default: "",
		schema: { type: "string" },
		/*		onChange(newValue, oldValue, { dispatch }) {
			debugger;
			if (newValue.timestamp === oldValue.timestamp) return;

			dispatch(PROPERTIES_SET, {
				...LIST_PROP_RESET,
			});
		},*/
	},
};

createCustomElement("snc-photobooth-uic-camera", {
	renderer: { type: snabbdom },
	view,
	styles,
	initialState,
	actionHandlers,
	dispatches,
	properties,
});
