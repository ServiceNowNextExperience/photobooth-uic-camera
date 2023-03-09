export function selectMediaDevice({ video, cameraDeviceId = "", enabled }) {
	console.log("SELECT MEDIA DEVICE", { cameraDeviceId, enabled });
	// Get access to the camera!
	return new Promise((resolve, reject) => {
		navigator.mediaDevices
			.getUserMedia({ video: { deviceId: cameraDeviceId } })
			.then(function (stream) {
				console.log("Got User Media!", { video, cameraDeviceId });
				if (video.srcObject) {
					video.srcObject.getTracks().forEach((track) => {
						track.stop();
					});
				}
				video.srcObject = stream;
				toggleTracks({ video, enabled });
				video.play();
				resolve();
			})
			.catch((exc) => {
				console.log("Error Getting Media!", exc);
				reject({ exc });
			});
	});
}

export function toggleTracks({ video: { srcObject: stream }, enabled }) {
	if (stream) {
		stream.getTracks().forEach((track) => (track.enabled = enabled));
	}
}

export function getConnectedDevices({
	deviceType = "videoinput",
	cameraDeviceId,
}) {
	// This is done purely to return a list of devices to the client so that they can
	// offer a selection to the user. It does not impact initializing the camera functionality.
	return new Promise((resolver) => {
		navigator.mediaDevices.enumerateDevices().then((devices) => {
			const cameras = devices.filter((device) => device.kind === deviceType);
			cameras.forEach((camera) => (camera.id = camera.deviceId));
			const updatedCameras = {
				selectedCameraDeviceId: cameraDeviceId,
				cameras,
				selectedDeviceIdFound: false,
				boundCameraDeviceId: null,
			};

			if (
				cameras.filter((camera) => camera.deviceId === cameraDeviceId).length ==
				1
			) {
				updatedCameras.selectedDeviceIdFound = true;
				updatedCameras.boundCameraDeviceId = cameraDeviceId;
			} else if (cameras.length === 1) {
				// If there is only one camera attached, just ignore the deviceId and use that one
				const selectedCameraDeviceId = cameras[0].deviceId;
				updatedCameras.selectedDeviceIdFound =
					selectedCameraDeviceId === cameraDeviceId;
				updatedCameras.boundCameraDeviceId = selectedCameraDeviceId;
			}
			resolver(updatedCameras);
		});
	});
}

export function initializeCanvas({
	context,
	imageSize = { width: 800, height: 600 },
	fillStyle,
}) {
	const { canvas } = context;
	console.log("Initialize Canvas", canvas, imageSize, fillStyle);
	// Add room for gaps above, between and below images
	canvas.width = imageSize.width;
	canvas.height = imageSize.height;

	context.fillStyle = fillStyle;
	context.fillRect(0, 0, canvas.width, canvas.height);
}

function createIndividualContext({context : {canvas: {ownerDocument, width, height}}}){
	const individualCanvas = ownerDocument.createElement("canvas");
	individualCanvas.width = width;
	individualCanvas.height = height;
	const individualContext = individualCanvas.getContext("2d");

	return {individualContext};
};

function drawToSnapImage({ pos, context, video, gap = 10, chin = 0 }) {
	console.log("drawToSnapImage", {context})

	const {width, height} = context.canvas;
	
	// Make the shots slightly smaller to accomodate the gap/chin
	const hWidth = (width / 2) - (gap * 3) / 2;
	const hHeight = ((height - chin) / 2) - (gap * 3) / 2;

	// Define where the first, second, third and fourth images appear
	// in the grid, taking into account offsets from the gap
	const posMap = {
		1: { x: gap, y: gap },
		2: { x: hWidth + gap * 2, y: gap },
		3: { x: gap, y: hHeight + gap * 2 },
		4: { x: hWidth + gap * 2, y: hHeight + gap * 2 },
	};

	const { x, y } = posMap[pos];

	drawImage(context, video, {x, y, width : hWidth, height : hHeight})

	return { context };
}

function drawImage(context, video, {x = 0, y = 0, width, height}){
	context.drawImage(video, x, y, width, height);
}

// Passing in "state" instead of destructuring it in place
// becuase drawImage needs a lot of values from state
// and I don't want to have to call them out twice
export function snap({ state, updateState }) {
	const {
		video,
		context,
		shutterSound,
		properties: {
			countdownDurationSeconds,
			pauseDurationSeconds = 1,
			pauseDurationMilliseconds = pauseDurationSeconds * 1000,
			gap,
			chin,
			imageSize
		},
	} = state;

	let pos = 1;

	if (countdownDurationSeconds > 0) {
		updateState({ snapState: "countdown" });
	}

	return new Promise((resolve) => {
		const { individualContext } = createIndividualContext({context});
		const individualSnaps = [];
		const _snap = () => {
			console.log("_snap", pos, context);
			updateState({ snapState: "snapping" });

			// Draw the primary 2x2 result to the main context
			drawToSnapImage({ pos, context, video, gap, chin });
		
			// Draw the individual image full sized
			drawImage(individualContext, video, individualContext.canvas);
			individualSnaps.push(individualContext.canvas.toDataURL("image/jpeg"));

			console.log("individualContext", individualContext.canvas.ownerDocument);

			if(shutterSound){
				shutterSound.play();
			}

			if (pos < 4) {
				pos++;
				setTimeout(_snap, pauseDurationMilliseconds);
			} else {
				updateState({ snapState: "preview" });

				individualContext.canvas.remove();
				resolve({context, individualSnaps});
			}
		};

		setTimeout(_snap, countdownDurationSeconds * 1000);
	});
}
