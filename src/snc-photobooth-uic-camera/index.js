import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { properties } from "./properties";
import { actionTypes } from "@servicenow/ui-core";
import { applyWatermark, initializeWatermark } from "./watermark";
import {
	selectMediaDevice,
	toggleTracks,
	getConnectedDevices,
	snap,
} from "./media";

import {
	PHOTOBOOTH_CAMERA_SNAPPED,
	PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED,
	PHOTOBOOTH_CAMERA_SINGLES_SNAPPED,
	PHOTOBOOTH_CAMERA_DOUBLE_CLICK
} from "./events";

const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_READY } =
	actionTypes;

const initialState = { snapState: "idle", watermarkImage: null };

const initializeMedia = ({ host, updateState, dispatch, properties }) => {
	console.log("INITIALIZE MEDIA!");

	const { enabled, cameraDeviceId, shutterSoundFile } = properties;

	// Grab elements, create settings, etc.
	const video = host.shadowRoot.getElementById("video");

	// Canvas context where "main" 2x2 snapshot will be rendered
	const context = host.shadowRoot.ownerDocument
		.createElement("canvas")
		.getContext("2d");

	const shutterSound = new Audio(shutterSoundFile);

	initializeWatermark(properties).then(updateState);

	selectMediaDevice({ video, cameraDeviceId, enabled }).then(() => {
		getConnectedDevices({ cameraDeviceId }).then((cameras) => {
			console.log(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, cameras);
			dispatch(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, cameras);
		}).catch((err) => {
			console.log("ERROR getConnectedDevices", err);
			dispatch(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, err);
		});
	}).catch((err) => {
		console.log("ERROR selectMediaDevice", err);
	});

	updateState({
		video,
		context,
		shutterSound,
	});
};

const propertyHandlers = {
	snapRequested: ({
		state,
		dispatch,
		updateState,
		payload: { value, previousValue },
	}) => {
		const { watermarkImage, properties } = state;

		if (value != previousValue) {
			console.log("SNAP STARTED");
			snap({ state, updateState }).then(({ context, singleSnapContexts }) => {
				console.log("SNAP COMPLETED", context);
				applyWatermark({ context, watermarkImage, ...properties });

				const imageData = context.canvas.toDataURL("image/jpeg");
				dispatch(PHOTOBOOTH_CAMERA_SNAPPED, { imageData });

				const individualSnaps = singleSnapContexts.map((singleSnapContext) => {
					return singleSnapContext.canvas.toDataURL("image/jpeg");
				});
				dispatch(PHOTOBOOTH_CAMERA_SINGLES_SNAPPED, { individualSnaps });
			});
		}
	},
	enabled: ({ state: { video }, payload: { value } }) => {
		toggleTracks({ video, enabled: value });
	},
	cameraDeviceId: ({ state: { video }, payload: { value }, updateState }) => {
		const cameraDeviceId = value;
		selectMediaDevice({
			video,
			cameraDeviceId,
		});
		updateState({ cameraDeviceId });
	},
};

const actionHandlers = {
	[COMPONENT_DOM_READY]: ({
		host,
		state: { properties },
		updateState,
		dispatch,
	}) => {
		console.log(COMPONENT_DOM_READY, host, properties);
		initializeMedia({ host, properties, dispatch, updateState });
	},

	[COMPONENT_CONNECTED]: ({ properties }) => {
		console.log(COMPONENT_CONNECTED, properties);
	},

	[COMPONENT_PROPERTY_CHANGED]: ({
		state,
		action: {
			payload: { name, value, previousValue },
		},
		dispatch,
		updateState,
	}) => {
		console.log(COMPONENT_PROPERTY_CHANGED, { name, value });

		if (propertyHandlers[name]) {
			propertyHandlers[name]({
				state,
				dispatch,
				updateState,
				payload: { value, previousValue },
			});
		}
	},
};

const view = ({
	snapState,
	properties: {
		pauseDurationSeconds,
		animationDuration = pauseDurationSeconds + "s",
	}
}, {
	dispatch
}) => {
	return (
		<div id="container" className={snapState} on-dblclick={() => {
			console.log({ PHOTOBOOTH_CAMERA_DOUBLE_CLICK });
			dispatch(PHOTOBOOTH_CAMERA_DOUBLE_CLICK);
		}}>
			<div
				id="flash"
				style={{
					"animation-iteration-count": 4,
					"animation-duration": animationDuration,
				}}
			></div>
			<video id="video" autoplay="" style={{ width: "100%" }}></video>
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
	 * Dispatched with array of image data when all individual images are snapped
	 * @type {{response:object}}
	 */
	PHOTOBOOTH_CAMERA_SINGLES_SNAPPED: {},

	/**
	 * Dispatched when the available cameras change
	 * @type {{response:object}}
	 */
	PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED: {},

	/**
	 * Dispatched when the component is double clicked
	 * @type {{}}
	 */
	PHOTOBOOTH_CAMERA_DOUBLE_CLICK: {}
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
