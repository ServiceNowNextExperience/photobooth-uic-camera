import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { properties } from "./properties";
import { actionTypes } from "@servicenow/ui-core";
import { applyWatermark, initializeWatermark } from "./watermark";
import { setupAppMetadata } from "./metadata";
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

const initializeMedia = ({ host, updateState, dispatch, properties, properties: { shutterSoundFile } }) => {
	console.log("INITIALIZE MEDIA!");

	initializeWatermark(properties).then(({ watermarkImage, error }) => {
		updateState({ watermarkImage });
	});

	// Grab elements, create settings, etc.
	const video = host.shadowRoot.getElementById("video");

	// Canvas context where "main" 2x2 snapshot will be rendered
	const context = host.shadowRoot.ownerDocument
		.createElement("canvas")
		.getContext("2d");

	if (shutterSoundFile) {
		const shutterSound = new Audio(shutterSoundFile);
		updateState({ shutterSound });
	}

	updateState({
		video,
		context
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
				console.log("SNAP COMPLETED", { context, singleSnapContexts });
				applyWatermark({ context, watermarkImage, ...properties });

				const imageData = context.canvas.toDataURL("image/jpeg");
				dispatch(PHOTOBOOTH_CAMERA_SNAPPED, { imageData });

				const individualSnaps = singleSnapContexts.map((singleSnapContext) =>
					singleSnapContext.canvas.toDataURL("image/jpeg")
				);
				dispatch(PHOTOBOOTH_CAMERA_SINGLES_SNAPPED, { individualSnaps });
			});
		}
	},
	enabled: ({ state: { video }, payload: { value: enabled }, properties: { cameraDeviceId }, dispatch }) => {
		if (enabled & !video.srcObject) {
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
		} else {
			toggleTracks({ video, enabled });
		}
	},
	cameraDeviceId: ({ state: { video }, payload: { value: cameraDeviceId }, updateState, properties: { enabled } }) => {
		if (enabled) {
			selectMediaDevice({
				video,
				cameraDeviceId,
				enabled
			});
		}
	},
	watermarkImageUrl: ({ properties, updateState }) => {
		initializeWatermark(properties).then(({ watermarkImage, error }) => {
			updateState({ watermarkImage });
		});
	},
	watermarkImageHeight: ({ properties, updateState }) => {
		initializeWatermark(properties).then(({ watermarkImage, error }) => {
			updateState({ watermarkImage });
		});
	},
	refreshRequested: () => {
		console.log("REFRESH REQUESTED");
		window.location.reload();
	}
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

		setupAppMetadata(window);
	},

	[COMPONENT_CONNECTED]: ({ properties }) => {
		console.log(COMPONENT_CONNECTED, properties);
	},

	[COMPONENT_PROPERTY_CHANGED]: ({
		host,
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
				host,
				state,
				dispatch,
				updateState,
				payload: { value, previousValue },
				properties: state.properties
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
		<div id="container" className={snapState} on-dblclick={({ clientX, clientY }) => {
			console.log(PHOTOBOOTH_CAMERA_DOUBLE_CLICK, { clientX, clientY });
			dispatch(PHOTOBOOTH_CAMERA_DOUBLE_CLICK, { clientX, clientY });
		}}>
			<div
				id="flash"
				style={{
					"animation-iteration-count": 4,
					"animation-duration": animationDuration,
				}}
			></div>
			<video id="video" autoplay muted style={{ width: "100%" }}></video>
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
	 * @type {{response:object}}
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
