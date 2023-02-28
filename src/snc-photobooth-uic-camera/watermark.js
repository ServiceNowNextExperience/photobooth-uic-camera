const initializeWatermark = ({
	watermarkImageUrl,
	watermarkImageScale
}) => {
	console.log("Initialize Watermark", watermarkImageUrl);

	return new Promise((resolve) => {
		if (watermarkImageUrl) {
			const watermarkImage = new Image();
			watermarkImage.onload = ({ target : { width, height } }) => {
				watermarkImage.width = width * watermarkImageScale;
				watermarkImage.height = height * watermarkImageScale;

				resolve({ watermarkImage});
			};
			watermarkImage.src = watermarkImageUrl;
		} else {
			resolve(null);
		}
	});
};

export { initializeWatermark };

const applyWatermark = ({ watermarkImage, context, watermarkImagePosition, gap }) => {
	console.log("applyWatermark", watermarkImage);

	if(!watermarkImage){ return; }

	const [watermarkX, watermarkY] = getCoordinates({
		watermarkImagePosition,
		imageWidth : watermarkImage.width,
		imageHeight : watermarkImage.height,
		canvas : context.canvas,
		gap
	});

	context.drawImage(
		watermarkImage,
		watermarkX,
		watermarkY,
		watermarkImage.width,
		watermarkImage.height
	);

}

export { applyWatermark };

const getCoordinates = ({
	watermarkImagePosition,
	imageWidth,
	imageHeight,
	canvas : {width : canvasWidth, height : canvasHeight},
	gap = 10
}) => {
	// Offset is the margin--if the gap is 10px start 10 from the top/left
	const [offsetX, offsetY] = [gap, gap];

	const xCenter = canvasWidth / 2 - imageWidth / 2;
	const yCenter = canvasHeight / 2 - imageHeight / 2;
	const xLeft = 0 + offsetX;
	const yTop = 0 + offsetY;
	const xRight = canvasWidth - imageWidth - offsetX;
	const yBottom = canvasHeight - imageHeight - offsetY;
	console.log({watermarkImagePosition, imageWidth, imageHeight, canvasWidth, canvasHeight, offsetX, offsetY, xRight});
	switch (watermarkImagePosition) {
		case "top-left":
			return [xLeft, yTop];
		case "top-center":
			return [xCenter, yTop];
		case "top-right":
			return [xRight, yTop];
		case "bottom-left":
			return [xLeft, yBottom];
		case "bottom-center":
			return [xCenter, yBottom];
		case "bottom-right":
			return [xRight, yBottom];
		case "center":
			return [xCenter, yCenter];
		default:
			return [0 + gap, 0 + gap];
	}
};

export { getCoordinates };