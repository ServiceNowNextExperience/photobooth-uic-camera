import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { actionTypes } from "@servicenow/ui-core";
//import { PHOTOBOOTH_CAMERA_SNAPPED, PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED } from "./events.js";
import { watermark, getCoordinates } from "./watermark";
import { getConnectedDevices } from "./media";

const PHOTOBOOTH_CAMERA_SNAPPED = "PHOTOBOOTH_CAMERA#SNAPPED";
const PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED = "PHOTOBOOTH_CAMERA#AVAILABLE_CAMERAS_UPDATED";
//const PHOTOBOOTH_MEDIA_DEVICE_SELECTED = "PHOTOBOOTH_CAMERA#MEDIA_DEVICE_SELECTED";

const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_READY } =
	actionTypes;

const initialState = { snapState: "idle", watermarkImage: null };

const initializeWatermark = ({
	watermarkImageUrl,
	watermarkImageScale,
	updateState,
}) => {
	console.log("Initialize Watermark", watermarkImageUrl);

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

const initializeMedia = ({ host, enabled, updateState, cameraDeviceId, dispatch }) => {
	console.log('INITIALIZE MEDIA!');
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

	switchMediaDevice({ video, cameraDeviceId, enabled, updateState, dispatch });
};

const dispatchConnectedDevices = ({ cameraDeviceId, dispatch }) => {
	console.log("DISPATCH CONNECTED DEVICES");

	// This is done purely to return a list of devices to the client so that they can
	// offer a selection to the user. It does not impact initializing the camera functionality.
	getConnectedDevices('videoinput', (cameras) => {
		cameras.forEach(camera => camera.id = camera.deviceId);
		const updatedCameras = { selectedCameraDeviceId: cameraDeviceId, cameras, selectedDeviceIdFound: false, boundCameraDeviceId: null };

		if (cameras.filter((camera) => camera.deviceId === cameraDeviceId).length == 1) {
			updatedCameras.selectedDeviceIdFound = true;
			updatedCameras.boundCameraDeviceId = cameraDeviceId;
		} else if (cameras.length === 1) {
			// If there is only one camera attached, just ignore the deviceId and use that one
			const selectedCameraDeviceId = cameras[0].deviceId;
			updatedCameras.selectedDeviceIdFound = (selectedCameraDeviceId === cameraDeviceId);
			updatedCameras.boundCameraDeviceId = selectedCameraDeviceId;
		}

		dispatch(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, updatedCameras);
	});

};

const switchMediaDevice = ({ video, cameraDeviceId, enabled, updateState, dispatch }) => {
	console.log("SWITCH MEDIA DEVICE", "Device ID:", cameraDeviceId, "Enabled?", enabled);
	// Get access to the camera!
	navigator.mediaDevices
		.getUserMedia({ video: { deviceId: cameraDeviceId } })
		.then(function (stream) {
			console.log("Got User Media!", video, cameraDeviceId);
			if (video.srcObject) {
				video.srcObject.getTracks().forEach(track => {
					track.stop();
				});
			}
			video.srcObject = stream;
			toggleTracks({ video, enabled });
			video.play();
			updateState({ stream: stream });

			dispatchConnectedDevices({ cameraDeviceId, dispatch });
		})
		.catch((x) => {
			console.log("Error Getting Media!", x);
			throw x;
		});

};

const resumeTracks = ({ video: { srcObject: stream } }) => {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = true));
	}
};

const pauseTracks = ({ stream }) => {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = false));
	}
};

const toggleTracks = ({ video: { srcObject: stream }, enabled }) => {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = enabled));
	}
};

const actionHandlers = {
	[COMPONENT_DOM_READY]: ({
		host,
		state: {
			properties: { enabled, watermarkImageUrl, watermarkImageScale, cameraDeviceId },
		},
		updateState,
		dispatch,
		video
	}) => {
		console.log("COMPONENT_DOM_READY");

		initializeMedia({ host, enabled, updateState, cameraDeviceId, dispatch });

		initializeWatermark({
			watermarkImageUrl,
			watermarkImageScale,
			updateState,
		});
	},
	[COMPONENT_CONNECTED]: ({ }) => {
	},
	[COMPONENT_PROPERTY_CHANGED]: ({
		state,
		action: { payload: { name, value, previousValue } },
		dispatch,
		updateState
	}) => {
		console.log(COMPONENT_PROPERTY_CHANGED, name, value);
		const { snapState, video, properties: { enabled } } = state;

		const propertyHandlers = ({
			snapRequested: () => {
				if (value && value != previousValue) {
					const imageData = snap(state, dispatch, updateState);
				} else if (!value && snapState != "idle") {
					// Reset if the value for snapRequested is empty
					updateState({ snapState: "idle" });
				}
			},
			enabled: () => {
				toggleTracks({ video, enabled: value });
				updateState({ snapState: "idle" });
			},
			cameraDeviceId: () => {
				const cameraDeviceId = value;
				switchMediaDevice({ video, cameraDeviceId, enabled, updateState, dispatch });
				updateState({ cameraDeviceId });
			}
		});

		if (propertyHandlers[name]) { propertyHandlers[name]() }
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
		properties: {
			countdownDurationSeconds,
			imageSize: { width, height },
		},
	} = state;

	let pos = 0;

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
		countdownAnimationCss
	},
	updateState,
}) => {
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

	/**
	 * Dispatched when the available cameras change
	 * @type {{response:object}}
	 */
	PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED: {},

	/**
	 * Dispatched when the camera is selected
	 * @type {{response:object}}
	 */
	//	PHOTOBOOTH_MEDIA_DEVICE_SELECTED: {},

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

	/*
	* Specify which camera to default to. If only one camera is available this will be ignored and the available camera used.
	*/
	cameraDeviceId: {
		default: "",
		schema: { type: "string" }
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
		schema: {
			type: "string",
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
		default: "center",
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
