import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { actionTypes } from "@servicenow/ui-core";
const PHOTOBOOTH_CAMERA_SNAPPED = "PHOTOBOOTH_CAMERA#SNAPPED";
import { watermark, getCoordinates } from "./watermark";

const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_READY } =
	actionTypes;

const initialState = { snapState: "idle", watermarkImage: null };

const initializeWatermark = ({
	watermarkImageUrl,
	watermarkImageScale,
	updateState,
}) => {
	console.log("Initialize Watermark");
	console.log(watermarkImageUrl);
	let watermarkImg;

	if (watermarkImageUrl) {
		watermarkImg = new Image();
		watermarkImg.onload = ({ target: { width, height } }) => {
			watermarkImg.width = width * watermarkImageScale;
			watermarkImg.height = height * watermarkImageScale;
			updateState({ watermarkImage: watermarkImg });
		};
		watermarkImg.src = watermarkImageUrl;
	}
};

const initializeMedia = ({ host, enabled, updateState }) => {
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
	[COMPONENT_DOM_READY]: ({
		host,
		state: {
			properties: { enabled, watermarkImageUrl, watermarkImageScale },
		},
		updateState,
	}) => {
		console.log("COMPONENT_DOM_READY");

		initializeMedia({ host, enabled, updateState });

		initializeWatermark({
			watermarkImageUrl,
			watermarkImageScale,
			updateState,
		});
	},
	[COMPONENT_CONNECTED]: ({}) => {
		console.log(COMPONENT_CONNECTED);
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

const drawImage = (
	x,
	y,
	{
		context,
		video,
		watermarkImage,
		properties: {
			imageSize: { width, height },
			watermarkImagePosition,
		},
	}
) => {
	const hWidth = width / 2;
	const hHeight = height / 2;

	context.drawImage(video, x, y, hWidth, hHeight);

	if (watermarkImage) {
		const [watermarkX, watermarkY] = getCoordinates(
			watermarkImagePosition,
			watermarkImage.width,
			watermarkImage.height,
			hWidth,
			hHeight,
			[x, y]
		);

		context.drawImage(
			watermarkImage,
			watermarkX,
			watermarkY,
			watermarkImage.width / 2,
			watermarkImage.height / 2
		);
	}
};

const snap = (state, dispatch, updateState) => {
	const {
		context,
		canvas,
		video,
		watermarkImage,
		properties: {
			countdownDurationSeconds,
			imageSize: { width, height },
		},
	} = state;

	let pos = 0;
	debugger;
	if (countdownDurationSeconds > 0) {
		updateState({ snapState: "countdown" });
	}

	const hWidth = width / 2;
	const hHeight = height / 2;

	context.clearRect(0, 0, width, height);

	const _snap = () => {
		switch (pos) {
			case 0:
				updateState({ snapState: "snapping" });
				drawImage(0, 0, state);
				//				context.drawImage(video, 0, 0, hWidth, hHeight);
				pos = 1;
				break;
			case 1:
				drawImage(hWidth, 0, state);
				//				context.drawImage(video, hWidth, 0, hWidth, hHeight);
				pos = 2;
				break;
			case 2:
				drawImage(0, hHeight, state);
				//				context.drawImage(video, 0, hHeight, hWidth, hHeight);
				pos = 3;
				break;
			case 3:
				drawImage(hWidth, hHeight, state);
				//				context.drawImage(video, hWidth, hHeight, hWidth, hHeight);
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
		countdownAnimationCss,
		watermarkImageUrl,
		watermarkImageScale = 1,
		watermarkImageSize,
	},
	updateState,
}) => {
	console.log("VIEW");
	console.log(snapState);
	console.log(`size: ${width}x${height}`);
	console.log(countdownDurationSeconds);

	return (
		<div>
			<style>{countdownAnimationCss}</style>
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
	 * If using the Countdown Duration property make sure that the animation duration matches.
	 * Should target divs with ids of "content" (the div to overlay the counter on)
	 * and "counter" (the div to put the counter into).
	 * Can be any CSS or SCSS but be sure to minify it first (remove whitespace).
	 * Example https://github.com/ServiceNowNextExperience/photobooth-uic-camera/blob/main/src/snc-photobooth-uic-camera/animation1.scss
	 */
	countdownAnimationCss: {
		schema: { type: "string" },
		default: "",
	},

	watermarkImageUrl: {
		schema: { type: "string" },
		default: "",
	},

	watermarkImagePosition: {
		schema: { type: "string" },
		default: "center",
		enum: [
			"top-left",
			"top-center",
			"top-right",
			"bottom-left",
			"bottom-center",
			"bottom-right",
			"center",
		],
	},

	/**
	 * Number representing the scale of the watermark image from 0 to 1 (100%)
	 */
	watermarkImageScale: {
		schema: { type: "number" },
		default: 1,
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
