import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import "../src/index.js";

import {
	PHOTOBOOTH_CAMERA_SNAPPED,
	PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED,
	PHOTOBOOTH_CAMERA_SINGLES_SNAPPED,
	PHOTOBOOTH_CAMERA_DOUBLE_CLICK,
} from "../src/snc-photobooth-uic-camera/events";

const initialState = {
	enabled: false,
	countdownDurationSeconds: 0,
	pauseDurationSeconds: 1,
	imageSize: { width: 800, height: 600 },
	canvasConfig: { gap: 10, chin: 50, fillStyle: "lightgreen" },
	watermarkImageUrl: "" /*"/@snc/photobooth-uic-camera/ServiceNow-Logo.png"*/,
	watermarkImageHeight: 50,
	watermarkImagePosition: "bottom-right",
	mainSnappedImg: "",
	individualSnaps: [],
	cameras: [],
	cameraDeviceId: "",
	shutterSoundFile: "/@snc/photobooth-uic-camera/camera-click.wav",
	numberOfSnaps: 1,
	watermarkEnabled: true,
};

const view = (state, { updateState }) => {
	console.log("ELEMENT VIEW");
	console.log(state);
	const {
		enabled,
		snapRequested,
		countdownDurationSeconds,
		pauseDurationSeconds,
		imageSize,
		watermarkImageUrl,
		watermarkImageHeight,
		watermarkImagePosition,
		mainSnappedImg,
		individualSnaps,
		cameras,
		cameraDeviceId,
		canvasConfig: { gap, chin, fillStyle },
		shutterSoundFile,
		refreshRequested,
		numberOfSnaps
	} = state;
	const toggleEnabledExternally = () => {
		console.log("TOGGLE ENABLED EXTERNALLY");
		updateState({ enabled: !state.enabled });
	};

	const requestSnap = () => {
		console.log("REQUEST SNAP");
		updateState({ snapRequested: Date.now() + "" });
	};

	const refresh = () => {
		console.log("REFRESH");
		updateState({ refreshRequested: Date.now() + "" });
	}

	return (
		<div id="main">
			<div style={{ display: "flex" }}>
				<div id="cameraAndControls">
					<div id="camera" style={{ flex: 1 }}>
						<snc-photobooth-uic-camera
							enabled={enabled}
							snapRequested={snapRequested}
							countdownDurationSeconds={countdownDurationSeconds}
							pauseDurationSeconds={pauseDurationSeconds}
							imageSize={imageSize}
							watermarkImageUrl={watermarkImageUrl}
							watermarkImageHeight={watermarkImageHeight}
							watermarkImagePosition={watermarkImagePosition}
							cameraDeviceId={cameraDeviceId}
							gap={gap}
							chin={chin}
							fillStyle={fillStyle}
							shutterSoundFile={shutterSoundFile}
							refreshRequested={refreshRequested}
							numberOfSnaps={numberOfSnaps}
						></snc-photobooth-uic-camera>
					</div>
					<div id="controls">
						<button on-click={() => toggleEnabledExternally()}>
							Toggle Enabled
						</button>
						{enabled ? (
							<span>
								<select id="numberOfSnaps" on-change={({ target: { value } }) => updateState({ numberOfSnaps: value })}>
									<option value="1" selected>One</option>
									<option value="4">Four</option>
								</select>
								<button on-click={() => requestSnap()}>Snap!</button>
								Delay Seconds: <input type="number" on-blur={({ target: { value } }) => updateState({ countdownDurationSeconds: Number(value) })} value={countdownDurationSeconds} style={{ width: "2rem" }} />
								<button on-click={() => refresh()}>Refresh</button>
							</span>
						) : null}
						{snapRequested ? (
							<button
								on-click={() => {
									updateState({
										individualSnaps: [],
										mainSnappedImg: "",
									});
								}}
							>
								Reset
							</button>
						) : null}
						<input type="text" value={watermarkImageUrl} on-blur={({ target: { value } }) => updateState({ watermarkImageUrl: value })}></input>
						Watermark Height PX: <input type="number" value={watermarkImageHeight} on-blur={({ target: { value } }) => updateState({ watermarkImageHeight: value })}></input>
					</div>
					<div id="availableCameras" style={{ display: enabled ? "block" : "none" }}>
						Available Cameras:
						<ol>
							{cameras.map(({ label, deviceId }) => {
								console.log("LABEL");
								return (
									<li style={{ cursor: "pointer" }}
										on-click={() => {
											updateState({ cameraDeviceId: deviceId });
										}}
									>
										{label} : {deviceId}
									</li>
								);
							})}
						</ol>
					</div>
				</div>
				<div id="outputs" style={{ flex: 1 }}>
					<div id="photoSnappedImg">
						<img src={mainSnappedImg} />
					</div>
					<div id="individualImages">
						{individualSnaps.map((imageData) => {
							return (
								<div>
									<img src={imageData} />
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

createCustomElement("example-element", {
	initialState: initialState,
	renderer: { type: snabbdom },
	view,
	actionHandlers: {
		[PHOTOBOOTH_CAMERA_SNAPPED]: {
			effect: ({
				state,
				updateState,
				action: {
					payload: { imageData },
				},
			}) => {
				console.log("PHOTOBOOTH CAMERA SNAPPED YO!", { state, imageData });
				updateState({ mainSnappedImg: imageData });
			},
		},
		[PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED]: {
			effect: ({ updateState, action: { payload: { cameras } } }) => {
				updateState({ cameras });
			},
		},
		[PHOTOBOOTH_CAMERA_SINGLES_SNAPPED]: {
			effect: ({
				updateState,
				action: {
					payload: { individualSnaps },
				},
			}) => {
				console.log("PHOTOBOOTH CAMERA SINGLES SNAPPED YO!", {
					individualSnaps,
				});

				updateState({ individualSnaps });
			},
		},
		[PHOTOBOOTH_CAMERA_DOUBLE_CLICK]: {
			effect: ({ action: { payload } }) => {
				console.log(PHOTOBOOTH_CAMERA_DOUBLE_CLICK, payload);
			}
		}
	},
});

const el = document.createElement("main");
document.body.appendChild(el);

el.innerHTML = "<example-element/>";
