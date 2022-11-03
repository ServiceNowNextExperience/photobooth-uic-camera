import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import baseStyles from "./styles.scss";
import animationStyles from "./animation1.scss";
import { actionTypes } from "@servicenow/ui-core";
const PHOTOBOOTH_CAMERA_SNAPPED = "PHOTOBOOTH_CAMERA#SNAPPED";
const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_READY } =
	actionTypes;

const styles = baseStyles + "\n\n" + animationStyles;

const initialState = { snapState: "idle" };

const initializeMedia = ({ video, enabled, updateState }) => {
	console.log("Initialize Media");
	console.log(navigator.mediaDevices);
	// Get access to the camera!
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		console.log("Media Devices available");
		// Not adding `{ audio: true }` since we only want video now
		navigator.mediaDevices
			.getUserMedia({ video: true })
			.then(function (stream) {
				console.log("Got User Media!");
				//video.src = window.URL.createObjectURL(stream);
				updateState({ stream: stream });
				video.srcObject = stream;
				video.play();
				toggleTracks({ stream }, enabled);
			})
			.catch((x) => {
				console.log("Error Getting Media!");
				console.log(x);
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

const toggleTracks = ({ stream }, enabled) => {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = enabled));
	}
};

const actionHandlers = {
	[COMPONENT_DOM_READY]: ({ host, state, updateState }) => {
		console.log("COMPONENT_DOM_READY");
		const { enabled } = state.properties;

		// Grab elements, create settings, etc.
		const video = host.shadowRoot.getElementById("video");
		const canvas = host.shadowRoot.getElementById("canvas");
		const context = canvas.getContext("2d");
		const counter = host.shadowRoot.getElementById("counter");

		updateState({
			video: video,
			context: context,
			canvas: canvas,
			counter: counter,
		});

		initializeMedia({ video, enabled, updateState });
	},
	[COMPONENT_CONNECTED]: ({ host, state, updateState }) => {
		console.log(COMPONENT_CONNECTED);
		console.log(state);
	},
	[COMPONENT_PROPERTY_CHANGED]: ({
		state,
		action,
		dispatch,
		updateState,
		/*		updateState,
		properties,
		updateProperties,*/
	}) => {
		const { name, value, previousValue } = action.payload;
		const { snapState } = state;
		console.log(COMPONENT_PROPERTY_CHANGED);
		console.log(name);

		switch (name) {
			case "snapRequested":
				if (value && value != previousValue) {
					const imageData = snap(state, dispatch, updateState);
				} else if (!value && snapState != "idle") {
					// Reset if the value for snapRequested is empty
					updateState({ snapState: "idle" });
				}
				break;
			case "enabled":
				toggleTracks(state, value);
				updateState({ snapState: "idle" });
				break;
		}
	},
};

const snap = (
	{
		context,
		canvas,
		video,
		properties: {
			countdownDurationSeconds,
			imageSize: { width, height },
		},
	},
	dispatch,
	updateState
) => {
	let pos = 0;
	updateState({ snapState: "countdown" });

	const hWidth = width / 2;
	const hHeight = height / 2;

	context.clearRect(0, 0, width, height);

	const _snap = () => {
		switch (pos) {
			case 0:
				updateState({ snapState: "snapping" });
				context.drawImage(video, 0, 0, hWidth, hHeight);
				pos = 1;
				break;
			case 1:
				context.drawImage(video, hWidth, 0, hWidth, hHeight);
				pos = 2;
				break;
			case 2:
				context.drawImage(video, 0, hHeight, hWidth, hHeight);
				pos = 3;
				break;
			case 3:
				context.drawImage(video, hWidth, hHeight, hWidth, hHeight);
				pos = 0;
				break;
		}
		if (pos != 0) {
			setTimeout(_snap, 500);
		} else {
			updateState({ snapState: "preview" });

			const imageData = canvas.toDataURL("image/jpeg");

			dispatch(PHOTOBOOTH_CAMERA_SNAPPED, {
				imageData: imageData,
			});
		}
	};

	setTimeout(_snap, countdownDurationSeconds * 1000);
};

const view = ({
	snapState,
	properties: {
		imageSize: { width, height },
		countdownDurationSeconds,
	},
}) => {
	console.log("VIEW");
	console.log(snapState);
	console.log(`size: ${width}x${height}`);
	console.log(countdownDurationSeconds);
	return (
		<div>
			<div
				id="container"
				className={snapState}
				style={{ width: `${width}px`, height: `${height}px` }}
			>
				<div id="content">
					<video id="video" width={width} height={height} autoplay=""></video>
					<canvas id="canvas" width={width} height={height}></canvas>
				</div>
				<div id="counter"></div>
			</div>
			<div>{snapState}</div>
		</div>
	);
};

const dispatches = {
	/**
	 * Dispatched when a camera picture is snapped.
	 * @type {{response:string}}
	 */
	PHOTOBOOTH_CAMERA_SNAPPED: {},
};

// NOTES FROM JON
// This is based on the standard JSON Schema
// https://developer.servicenow.com/dev.do#!/reference/now-experience/quebec/ui-framework/main-concepts/type-schema
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
	 */
	snapRequested: {
		default: "",
		schema: { type: "string" } /*
		onChange(newValue, oldValue, { dispatch, updateState }) {
			console.log("snapRequested onChange " + newValue);
			debugger;
			if (newValue === oldValue) return;
			updateState({ doSnap: true });
		},*/,
	},

	/**
	 * How long to wait after requesting a snap and beginning the shots.
	 */
	countdownDurationSeconds: {
		default: 0,
		schema: { type: "number" },
	},

	/**
	 * Image width and height in pixels
	 */
	imageSize: {
		default: { width: 640, height: 480 },
		schema: {
			type: "object",
			properties: {
				width: { type: "integer" },
				height: { type: "integer" },
			},
			required: ["width", "height"],
		},
	},

	/**
	 * Countdown Animation CSS
	 * If using the Countdown Duration property make sure that the animation matches.
	 */
	countdownAnimationCss: {
		schema: { type: "string" },
		default: "",
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
