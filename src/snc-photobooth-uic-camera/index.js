import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { properties } from "./properties";
import { actionTypes } from "@servicenow/ui-core";
import { applyWatermark, initializeWatermark } from "./watermark";
import { switchMediaDevice, drawImage, toggleTracks, getConnectedDevices } from "./media";

const PHOTOBOOTH_CAMERA_SNAPPED = "PHOTOBOOTH_CAMERA#SNAPPED";
const PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED =
	"PHOTOBOOTH_CAMERA#AVAILABLE_CAMERAS_UPDATED";


const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_READY } =
	actionTypes;

const initialState = { snapState: "idle", watermarkImage: null };

const initializeMedia = ({
	host,
	updateState,
	dispatch,
	properties: {
		enabled,
		cameraDeviceId,
		imageSize,
		watermarkImageUrl,
		watermarkImageScale,
		watermarkImagePosition,
		gap,
		chin,
		fillStyle,
		shutterSoundFile,
	},
}) => {
	console.log("INITIALIZE MEDIA!");
	// Grab elements, create settings, etc.
	const video = host.shadowRoot.getElementById("video");
	const canvas = host.shadowRoot.ownerDocument.createElement("canvas");

	// Add room for gaps above, between and below images
	canvas.width = imageSize.width + gap * 3;
	canvas.height = imageSize.height + gap * 3 + chin;

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
			onload: updateState,
		});
	}

	// Initialize shutter sound
	var shutterSound = new Audio(shutterSoundFile);

	updateState({
		video,
		context,
		canvas,
		shutterSound,
	});

	switchMediaDevice({ video, cameraDeviceId, enabled, updateState, dispatch });
	getConnectedDevices({cameraDeviceId}).then((cameras) => {
		dispatch(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, cameras);
	});

};

const actionHandlers = {
	[COMPONENT_DOM_READY]: ({
		host,
		state: { properties },
		updateState,
		dispatch,
	}) => {
		initializeMedia({ host, properties, dispatch, updateState });
	},

	[COMPONENT_CONNECTED]: ({}) => {},

	[COMPONENT_PROPERTY_CHANGED]: ({
		state,
		action: {
			payload: { name, value, previousValue },
		},
		dispatch,
		updateState,
	}) => {
		console.log(COMPONENT_PROPERTY_CHANGED, { name, value });
		const {
			snapState,
			video,
			properties: { enabled },
		} = state;

		const propertyHandlers = {
			snapRequested: () => {
				if (value && value != previousValue) {
					snap({ state, dispatch, updateState });
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
				switchMediaDevice({
					video,
					cameraDeviceId,
					enabled,
					updateState,
					dispatch,
				});
				updateState({ cameraDeviceId });
			},
		};

		if (propertyHandlers[name]) {
			propertyHandlers[name]();
		}
	},
};

// Passing in "state" instead of destructuring it in place
// becuase drawImage needs a lot of values from state
// and I don't want to have to call them out twice
const snap = ({ state, dispatch, updateState }) => {
	const {
		canvas,
		properties: {
			countdownDurationSeconds,
			pauseDurationSeconds,
			pauseDurationMilliseconds = pauseDurationSeconds * 1000,
		},
		shutterSound,
	} = state;

	let pos = 1;

	if (countdownDurationSeconds > 0) {
		updateState({ snapState: "countdown" });
	}

	const _snap = () => {
		console.log("_snap", pos);
		updateState({ snapState: "snapping" });

		drawImage(pos, state);

		shutterSound.play();

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

	setTimeout(_snap, countdownDurationSeconds * 1000);
};

const view = ({
	snapState,
	properties: {
		countdownAnimationCss,
		pauseDurationSeconds,
		animationDuration = pauseDurationSeconds + "s",
	},
}) => {
	return (
		<div>
			<style>{countdownAnimationCss}</style>
			<div id="container" className={snapState}>
				<div
					id="flash"
					style={{
						"animation-iteration-count": 4,
						"animation-duration": animationDuration,
					}}
				></div>
				<video id="video" autoplay="" style={{ width: "100%" }}></video>
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
