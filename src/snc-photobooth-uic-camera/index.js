import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { properties } from "./properties";
import { actionTypes } from "@servicenow/ui-core";
import { applyWatermark, initializeWatermark } from "./watermark";
import { getConnectedDevices } from "./media";

const PHOTOBOOTH_CAMERA_SNAPPED = "PHOTOBOOTH_CAMERA#SNAPPED";
const PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED = "PHOTOBOOTH_CAMERA#AVAILABLE_CAMERAS_UPDATED";

const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_READY } =
	actionTypes;

const initialState = { snapState: "idle", watermarkImage: null };

const initializeMedia = ({ host, updateState, dispatch, 
	properties: { enabled, cameraDeviceId, imageSize, watermarkImageUrl, watermarkImageScale, watermarkImagePosition, gap, chin, fillStyle } }) => {

	console.log('INITIALIZE MEDIA!');
	// Grab elements, create settings, etc.
	const video = host.shadowRoot.getElementById("video");
	const canvas = host.shadowRoot.ownerDocument.createElement("canvas");

	// Add room for gaps above, between and below images
	canvas.width = imageSize.width + (gap * 3);
	canvas.height = imageSize.height + (gap * 3) + chin;

	const context = canvas.getContext("2d");
	context.fillStyle = fillStyle;
	context.fillRect(0, 0, canvas.width, canvas.height);

	if (watermarkImageUrl) {
		initializeWatermark({
			watermarkImageUrl,
			watermarkImageScale,
			watermarkImagePosition,
			gap,
			canvas,
			context,
			onload: updateState
		});
	}


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

		console.log(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, updatedCameras);
		dispatch(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, updatedCameras);
	});

};

const switchMediaDevice = ({ video, cameraDeviceId, enabled, updateState, dispatch }) => {
	console.log("SWITCH MEDIA DEVICE", {cameraDeviceId, enabled});
	// Get access to the camera!
	navigator.mediaDevices
		.getUserMedia({ video: { deviceId: cameraDeviceId } })
		.then(function (stream) {
			console.log("Got User Media!", {video, cameraDeviceId});
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
		state: { properties },
		updateState,
		dispatch
	}) => {
		initializeMedia({ host, properties, dispatch, updateState });
	},

	[COMPONENT_CONNECTED]: ({ }) => {
	},

	[COMPONENT_PROPERTY_CHANGED]: ({
		state,
		action: { payload: { name, value, previousValue } },
		dispatch,
		updateState
	}) => {
		console.log(COMPONENT_PROPERTY_CHANGED, {name, value});
		const { snapState, video, properties: { enabled } } = state;

		const propertyHandlers = ({
			snapRequested: () => {
				if (value && value != previousValue) {
					const imageData = snap({state, dispatch, updateState});
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

		if (propertyHandlers[name]) { 
			propertyHandlers[name]() 
		}
	},
};

const drawImage = (
	pos,
	{
		context,
		video,
		properties: {
			imageSize: { width, height },
			gap,
		},
	}
) => {
	const hWidth = width / 2;
	const hHeight = height / 2;

	// Define where the first, second, third and fourth images appear
	// in the grid
	const posMap = {
		1: { x: gap, y: gap },
		2: { x: hWidth + (gap * 2), y: gap },
		3: { x: gap, y: hHeight + (gap * 2) },
		4: { x: hWidth + (gap * 2), y: hHeight + (gap * 2) }
	};

	const { x, y } = posMap[pos];

	context.drawImage(video, x, y, hWidth, hHeight);
};

// Passing in "state" instead of destructuring it in place
// becuase drawImage needs a lot of values from state
// and I don't want to have to call them out twice
const snap = ({state, dispatch, updateState}) => {
	const {
		canvas,
		properties: {
			countdownDurationSeconds,
			pauseDurationSeconds,
			pauseDurationMilliseconds = pauseDurationSeconds * 1000
		},
	} = state;

	let pos = 1;

	if (countdownDurationSeconds > 0) {
		updateState({ snapState: "countdown" });
	}

	const _snap = () => {
		console.log("_snap", pos);
		updateState({ snapState: "snapping" });

		drawImage(pos, state);

		if (pos < 4) {
			pos++;
			setTimeout(_snap, pauseDurationMilliseconds);
		} else {
			updateState({ snapState: "preview" });

			applyWatermark(state);
			
			const imageData = canvas.toDataURL("image/jpeg");

			dispatch(PHOTOBOOTH_CAMERA_SNAPPED, {
				imageData: imageData,
			});
		}
	};

	//setTimeout(()=>{}, )
	setTimeout(_snap, countdownDurationSeconds * 1000);
};

const view = ({
	snapState,
	properties: {
		countdownAnimationCss,
		pauseDurationSeconds,
		animationDuration = pauseDurationSeconds + "s"
	},
}) => {
	return (
		<div>
			<style>{countdownAnimationCss}</style>
			<div
				id="container"
				className={snapState}
			>
				<div id="flash" style={{"animation-iteration-count":4, "animation-duration":animationDuration}}></div>
				<video id="video" autoplay="" style={{width:"100%"}}></video>
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

createCustomElement("snc-photobooth-uic-camera", {
	renderer: { type: snabbdom },
	view,
	styles,
	initialState,
	actionHandlers,
	dispatches,
	properties,
});
