import { createCustomElement } from "@servicenow/ui-core";
import snabbdom from "@servicenow/ui-renderer-snabbdom";
import countdownAnimationCss from "../src/snc-photobooth-uic-camera/animation1.scss";
import "../src/index.js";

import { PHOTOBOOTH_CAMERA_SNAPPED, PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED, PHOTOBOOTH_CAMERA_SINGLE_SNAPPED } from "../src/snc-photobooth-uic-camera/events"

const CameraIds = {
	Logitech: "aaadfd301a109346b3393ce9b1abe3eab71f9e72607d70a0e1f98c288c5916d5",
	Facetime: "82d655a55ce60865695b37097d36cf8d21553d59d20e226bcd372c41d80b60f2",
	Empty: "",
};

let localUpdateState = null;

const initialState = {
	enabled: true,
	countdownDurationSeconds: 0,
	pauseDurationSeconds: 1,
	imageSize: { width: 800, height: 600 },
	canvasConfig: { gap: 10, chin: 50, fillStyle: "lightgreen" },
	watermarkImageUrl: "/@snc/photobooth-uic-camera/ServiceNow-Logo.png",
	watermarkImageScale: 0.3,
	watermarkImagePosition: "bottom-right",
	cameraDeviceId: CameraIds.Empty,
	localPhotoSnappedImg: "",
	localIndividualImages: [],
	localCameras: [],
	shutterSoundFile: "/@snc/photobooth-uic-camera/camera-click.wav",
};

const view = (state, { updateState }) => {
	localUpdateState = updateState;
	console.log("ELEMENT VIEW");
	console.log(state);
	const {
		enabled,
		snapRequested,
		countdownDurationSeconds,
		pauseDurationSeconds,
		imageSize,
		watermarkImageUrl,
		watermarkImageScale,
		watermarkImagePosition,
		cameraDeviceId,
		localPhotoSnappedImg,
		localIndividualImages,
		localCameras,
		canvasConfig: { gap, chin, fillStyle },
		shutterSoundFile,
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
		<div id="main">
			<div style={{ display: "flex" }}>
				<div id="camera" style={{ flex: 1 }}>
					<snc-photobooth-uic-camera
						enabled={enabled}
						snapRequested={snapRequested}
						countdownDurationSeconds={countdownDurationSeconds}
						countdownAnimationCss={countdownAnimationCss}
						pauseDurationSeconds={pauseDurationSeconds}
						imageSize={imageSize}
						watermarkImageUrl={watermarkImageUrl}
						watermarkImageScale={watermarkImageScale}
						watermarkImagePosition={watermarkImagePosition}
						cameraDeviceId={cameraDeviceId}
						gap={gap}
						chin={chin}
						fillStyle={fillStyle}
						shutterSoundFile={shutterSoundFile}
					></snc-photobooth-uic-camera>
				</div>
				<div id="outputs" style={{ flex: 1 }}>
					<div id="photoSnappedImg">
						<img src={localPhotoSnappedImg} />
					</div>
				</div>
				<div id="individualImages" style={{flex : 1, display : "none"}}>
					<ul>
						{localIndividualImages.map(imageData => {
							console.log("MAP INDIVIDUAL IMAGES");
							return (
								<li><img src={imageData}/></li>
							)
						})}
					</ul>
				</div>
			</div>
			<div id="controls">
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
							updateState({ snapRequested: "", localIndividualImages : [], localPhotoSnappedImg : "" });
						}}
					>
						Reset
					</button>
				) : null}
			</div>
			<div id="availableCameras">
				Available Cameras:
				<ol>
					{localCameras.map(({ label, deviceId }) => {
						console.log("LABEL");
						return (
							<li
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
	);
};

createCustomElement("snc-photobooth-uic-camera-examples", {
	initialState: initialState,
	renderer: { type: snabbdom },
	view,
	actionHandlers: {
		[PHOTOBOOTH_CAMERA_SNAPPED]: {
			effect: ({
				state,
				action: {
					payload: { imageData },
				},
			}) => {
				console.log("PHOTOBOOTH CAMERA SNAPPED YO!", state, imageData);
				localUpdateState({ localPhotoSnappedImg: imageData });
			},
		},
		[PHOTOBOOTH_AVAILABLE_CAMERAS_UPDATED]: {
			effect: ({ action: { payload } }) => {
				const { selectedCameraDeviceId, cameras } = payload;
				console.log(
					"SET AVAILABLE CAMERAS",
					payload,
					"Selected Camera:",
					payload.selectedCameraDeviceId
				);
				localUpdateState({ localCameras: cameras });
			},
		},
		[PHOTOBOOTH_CAMERA_SINGLE_SNAPPED] : {
			effect: ({
				state : { localIndividualImages },
				action: {
					payload: { imageData },
				},
			}) => {
				console.log("PHOTOBOOTH CAMERA SINGLE SNAPPED YO!", localIndividualImages, imageData);
				
				localIndividualImages.push(imageData);
				localUpdateState({ localIndividualImages });
			}
		}
	},
});

const el = document.createElement("main");
document.body.appendChild(el);

el.innerHTML = "<snc-photobooth-uic-camera-examples/>";
