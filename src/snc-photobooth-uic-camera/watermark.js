const getAspectRatio = (width, height) => {
	return width / height;
};
const getWidthFromRatio = (height, aspectRatio) => {
	return height * aspectRatio;
};
const getHeightFromRatio = (width, aspectRatio) => {
	return width / aspectRatio;
};
const getImage = (e, callback) => {
	const files = e.target.files;
	if (files && files.length > 0) {
		const image = files[0];
		const reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = (e) => {
			const img = new Image();
			img.src = e.target.result;
			img.onload = () => {
				callback(img);
			};
		};
	}
};
const changeImageWidth = (image, width, aspectRatio, maintainAspectRatio) => {
	if (maintainAspectRatio) {
		const newHeight = getHeightFromRatio(width, aspectRatio);
		image.width = width;
		image.height = newHeight;
	} else {
		image.width = width;
	}
};
const changeImageHeight = (image, height, aspectRatio, maintainAspectRatio) => {
	if (maintainAspectRatio) {
		const newWidth = getWidthFromRatio(height, aspectRatio);
		image.width = newWidth;
		image.height = height;
	} else {
		image.height = height;
	}
};

const initializeWatermark = ({
	watermarkImageUrl,
	watermarkImageScale,
	onload = () => {}
}) => {
	console.log("Initialize Watermark", watermarkImageUrl);

	if (watermarkImageUrl) {
		const watermarkImage = new Image();
		watermarkImage.onload = ({ target : { width, height } }) => {
			watermarkImage.width = width * watermarkImageScale;
			watermarkImage.height = height * watermarkImageScale;

			onload({ watermarkImage});
		};
		watermarkImage.src = watermarkImageUrl;
	}
};

export { initializeWatermark };

const applyWatermark = ({ watermarkImage, watermarkImagePosition, gap, offset, context, canvas }) => {
	console.log("applyWatermark", watermarkImage);
	const [watermarkX, watermarkY] = getCoordinates({
		watermarkImagePosition,
		imageWidth : watermarkImage.width,
		imageHeight : watermarkImage.height,
		canvas,
		offset,
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

const isChecked = (checkbox) => {
	return checkbox.checked === true;
};
const getCoordinates = ({
	watermarkImagePosition,
	imageWidth,
	imageHeight,
	canvas : {width : canvasWidth, height : canvasHeight},
	offset = [0,0], /* Offset is the "margin" */
	gap = 0
}) => {
	const [offsetX, offsetY] = offset;

	const xCenter = canvasWidth / 2 - imageWidth / 2;
	const yCenter = canvasHeight / 2 - imageHeight / 2;
	const xLeft = 0 + offsetX;
	const yTop = 0 + offsetY;
	const xRight = canvasWidth - imageWidth - offsetX;
	const yBottom = canvasHeight - imageHeight - offsetY;
	console.log({watermarkImagePosition, imageWidth, imageHeight, canvasWidth, canvasHeight, offset, xRight});
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

const updateImageSizeValueDOM = (image, widthInput, heightInput) => {
	widthInput.value = image.width;
	heightInput.value = image.height;
};
const watermark = (canvas, baseImage, watermarkImage, position, alpha) => {
	const ctx = canvas.getContext("2d");
	canvas.width = baseImage.width;
	canvas.height = baseImage.height;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
	ctx.globalAlpha = alpha;
	const [x, y] = getCoordinates(
		position,
		watermarkImage.width,
		watermarkImage.height,
		baseImage.width,
		baseImage.height
	);
	ctx.drawImage(
		watermarkImage,
		x,
		y,
		watermarkImage.width,
		watermarkImage.height
	);
};
const saveImage = (canvas) => {
	const image = canvas.toDataURL("image/png");
	const link = document.createElement("a");
	link.download = "download.png";
	link.href = image;
	link.click();
};
/*const canvas = document.querySelector("canvas");
const baseImageInput = document.getElementById("baseImageInput");
const watermarkImageInput = document.getElementById("watermarkImageInput");
const baseImageWidthInput = document.getElementById("baseImageWidth");
const baseImageHeightInput = document.getElementById("baseImageHeight");
const baseImageAspectChecked = document.getElementById("baseImageRatioChecked");
const watermarkImageWidthInput = document.getElementById("watermarkImageWidth");
const watermarkImageHeightInput = document.getElementById(
	"watermarkImageHeight"
);
const watermarkImageAspectChecked = document.getElementById(
	"watermarkImageRatioChecked"
);
const positionInput = document.getElementById("watermarkImagePositionInput");
const alphaInput = document.getElementById("watermarkImageAlpha");
const watermarkButton = document.getElementById("watermarkButton");
const inputForm = document.getElementById("inputForm");
const saveButton = document.getElementById("saveButton");
let baseImage;
let watermarkImage;
let baseImageAspectRatio;
let watermarkImageAspectRatio;

inputForm.addEventListener("input", () => {
	if (!baseImage || !watermarkImage) {
		watermarkButton.disabled = true;
	} else {
		watermarkButton.disabled = false;
	}
});
baseImageInput.addEventListener("input", (e) => {
	getImage(e, (img) => {
		baseImage = img;
		baseImageAspectRatio = getAspectRatio(img.width, img.height);
		updateImageSizeValueDOM(img, baseImageWidthInput, baseImageHeightInput);
	});
});
watermarkImageInput.addEventListener("input", (e) => {
	getImage(e, (img) => {
		watermarkImage = img;
		watermarkImageAspectRatio = getAspectRatio(img.width, img.height);
		updateImageSizeValueDOM(
			img,
			watermarkImageWidthInput,
			watermarkImageHeightInput
		);
	});
});
baseImageWidthInput.addEventListener("input", (e) => {
	const value = parseInt(e.target.value);
	changeImageWidth(
		baseImage,
		value,
		baseImageAspectRatio,
		isChecked(baseImageAspectChecked)
	);
	updateImageSizeValueDOM(baseImage, baseImageWidthInput, baseImageHeightInput);
});
baseImageHeightInput.addEventListener("input", (e) => {
	const value = parseInt(e.target.value);
	changeImageHeight(
		baseImage,
		value,
		baseImageAspectRatio,
		isChecked(baseImageAspectChecked)
	);
	updateImageSizeValueDOM(baseImage, baseImageWidthInput, baseImageHeightInput);
});

watermarkImageWidthInput.addEventListener("input", (e) => {
	const value = parseInt(e.target.value);
	changeImageWidth(
		watermarkImage,
		value,
		watermarkImageAspectRatio,
		isChecked(watermarkImageAspectChecked)
	);
	updateImageSizeValueDOM(
		watermarkImage,
		watermarkImageWidthInput,
		watermarkImageHeightInput
	);
});
watermarkImageHeightInput.addEventListener("input", (e) => {
	const value = parseInt(e.target.value);
	changeImageHeight(
		watermarkImage,
		value,
		watermarkImageAspectRatio,
		isChecked(watermarkImageAspectChecked)
	);
	updateImageSizeValueDOM(
		watermarkImage,
		watermarkImageWidthInput,
		watermarkImageHeightInput
	);
});
watermarkButton.addEventListener("click", () => {
	const alpha = parseInt(alphaInput.value) / 100;
	watermark(canvas, baseImage, watermarkImage, positionInput.value, alpha);
	saveButton.disabled = false;
});
saveButton.addEventListener("click", () => {
	saveImage(canvas);
});*/
