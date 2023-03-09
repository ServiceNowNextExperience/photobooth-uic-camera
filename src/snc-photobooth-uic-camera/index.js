import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import styles from "./styles.scss";
import { properties } from "./properties";
import { actionTypes } from "@servicenow/ui-core";
import { applyWatermark, initializeWatermark } from "./watermark";
import { selectMediaDevice, toggleTracks, getConnectedDevices, snap } from "./media";

import { PHOTOBOOTH_CAMERA_SNAPPED, PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, PHOTOBOOTH_CAMERA_SINGLE_SNAPPED } from "./events";


const { COMPONENT_CONNECTED, COMPONENT_PROPERTY_CHANGED, COMPONENT_DOM_READY } =
	actionTypes;

const initialState = { snapState: "idle", watermarkImage: null };

const initializeMedia = ({
	host,
	updateState,
	dispatch,
	properties,
}) => {
	console.log("INITIALIZE MEDIA!");

	const {
		enabled,
		cameraDeviceId,
		shutterSoundFile
	} = properties;

	// Grab elements, create settings, etc.
	const video = host.shadowRoot.getElementById("video");

	// Canvas context where "main" 2x2 snapshot will be rendered
	const context = host.shadowRoot.ownerDocument.createElement("canvas").getContext("2d");
	// Canvas context where individual snapshots will be rendered
	const individualContext = host.shadowRoot.ownerDocument.createElement("canvas").getContext("2d");

	const shutterSound = new Audio(shutterSoundFile);

	initializeWatermark(properties).then(updateState);

	selectMediaDevice({ video, cameraDeviceId, enabled });

	getConnectedDevices({cameraDeviceId}).then((cameras) => {
		console.log(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, cameras);
		dispatch(PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, cameras);
	});

	updateState({
		video,
		context,
		individualContext,
		shutterSound,
	});
};

const propertyHandlers = {
	snapRequested: ({ state, dispatch, updateState, payload : {value, previousValue} }) => {
		const {
			snapState,
			watermarkImage,
			properties,
		} = state;

		if (value && value != previousValue) {
			console.log("SNAP STARTED");
			snap({ state, updateState }).then(({context, individualSnaps}) => {
				console.log("SNAP COMPLETED", context);
				applyWatermark({context, watermarkImage, ...properties});

				const imageData = context.canvas.toDataURL("image/jpeg");
				dispatch(PHOTOBOOTH_CAMERA_SNAPPED, {imageData});
				dispatch(PHOTOBOOTH_CAMERA_SINGLE_SNAPPED, {individualSnaps});
			});
		} else if (!value && snapState != "idle") {
			// Reset if the value for snapRequested is empty
			updateState({ snapState: "idle" });
		}
	},
	enabled: ({state : { video }, payload : {value}, updateState}) => {
		toggleTracks({ video, enabled: value });
		updateState({ snapState: "idle" });
	},
	cameraDeviceId: ({state : {video}, payload: {value}, updateState}) => {
		const cameraDeviceId = value;
		selectMediaDevice({
			video,
			cameraDeviceId
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

	[COMPONENT_CONNECTED]: ({properties}) => { console.log(COMPONENT_CONNECTED, properties)},

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
			propertyHandlers[name]({ state, dispatch, updateState, payload: { value, previousValue } });
		}
	},
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
