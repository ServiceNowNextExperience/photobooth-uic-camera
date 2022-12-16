import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import countdownAnimationCss from "../src/snc-photobooth-uic-camera/animation1.scss";
//import { PHOTOBOOTH_CAMERA_SNAPPED } from "../src/snc-photobooth-uic-camera/events.js";
import "../src/index.js";

const PHOTOBOOTH_CAMERA_SNAPPED = "PHOTOBOOTH_CAMERA#SNAPPED";
const PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED = "PHOTOBOOTH_CAMERA#AVAILABLE_CAMERAS_UPDATED";

const CameraIds = {
	"Logitech": "aaadfd301a109346b3393ce9b1abe3eab71f9e72607d70a0e1f98c288c5916d5",
	"Facetime": "82d655a55ce60865695b37097d36cf8d21553d59d20e226bcd372c41d80b60f2",
	"Empty": ""
}

let localUpdateState = null;

const initialState = {
	enabled: true,
	countdownDurationSeconds: 0,
	imageSize: { width: 800, height: 600 },
	watermarkImageUrl: "/@snc/photobooth-uic-camera/ServiceNow-Logo.png",
	watermarkImageScale: 0.4,
	watermarkImagePosition: "top-left",
	cameraDeviceId: CameraIds.Empty,
	localPhotoSnappedImg: "",
	localCameras: []
};

const view = (state, { updateState }) => {
	localUpdateState = updateState;
	console.log("ELEMENT VIEW");
	console.log(state);
	const {
		enabled,
		snapRequested,
		countdownDurationSeconds,
		imageSize,
		watermarkImageUrl,
		watermarkImageScale,
		watermarkImagePosition,
		cameraDeviceId,
		localPhotoSnappedImg,
		localCameras
	} = state;
	const toggleEnabledExternally = () => {
		console.log("TOGGLE ENABLED EXTERNALLY");
		updateState({ enabled: !enabled });
	};

	const requestSnap = (countdownDurationSeconds) => {
		console.log("REQUEST SNAP");
		updateState({
			countdownDurationSeconds: countdownDurationSeconds || 0,
			snapRequested: Date.now() + "",
		});
	};

	return (
		<div style={{ position: "relative" }}>
			<div id="camera" style={{ position: "relative" }}>
				<snc-photobooth-uic-camera
					enabled={enabled}
					snapRequested={snapRequested}
					countdownDurationSeconds={countdownDurationSeconds}
					imageSize={imageSize}
					countdownAnimationCss={countdownAnimationCss}
					watermarkImageUrl={watermarkImageUrl}
					watermarkImageScale={watermarkImageScale}
					watermarkImagePosition={watermarkImagePosition}
					cameraDeviceId={cameraDeviceId}
				></snc-photobooth-uic-camera>
			</div>
			<div id="controls" style={{ position: "relative" }}>
				<button on-click={() => toggleEnabledExternally()}>
					Toggle Enabled
				</button>
				{enabled ? (
					<span>
						<button on-click={() => requestSnap(0)}>Snap!</button>
						<button
							on-click={() => {
								requestSnap(5);
							}}
						>
							Countdown
						</button>
					</span>
				) : null}
				{snapRequested ? (
					<button
						on-click={() => {
							updateState({ snapRequested: "" });
						}}
					>
						Reset
					</button>
				) : null}
			</div>
			<div id="outputs">
				<div id="photoSnappedImg">
					Photo Snapped: {localPhotoSnappedImg}
				</div>
				<div id="availableCameras">
					Available Cameras:
					<ol>
						{localCameras.map(({ label, deviceId }) => {
							console.log("LABEL");
							return (<li on-click={() => { updateState({ cameraDeviceId: deviceId }) }}>{label} : {deviceId}</li>);
						})}
					</ol>
				</div>
			</div>
		</div>
	);
};

createCustomElement("snc-photobooth-uic-camera-examples", {
	initialState: initialState,
	renderer: { type: snabbdom },
	view,
	actionHandlers: {
		[PHOTOBOOTH_CAMERA_SNAPPED]: {
			effect: ({ state, action: { payload: { imageData } } }) => {
				console.log(
					'PHOTOBOOTH CAMERA SNAPPED YO!',
					state,
					imageData
				);
				localUpdateState({ localPhotoSnappedImg: imageData });
			}
		},
		[PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED]: {
			effect: ({ action: { payload } }) => {
				const { selectedCameraDeviceId, cameras } = payload;
				console.log("XX", "B", "SET AVAILABLE CAMERAS", payload, "Selected Camera:", payload.selectedCameraDeviceId);
				localUpdateState({ localCameras: cameras });
			}
		},
	},
});

const el = document.createElement("main");
document.body.appendChild(el);

el.innerHTML = "<snc-photobooth-uic-camera-examples/>";
