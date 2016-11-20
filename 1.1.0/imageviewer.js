/*
	Image Viewer
	Descrição: Visualizador de imagens.
	Criado por Janderson Costa.

	Uso: ver demo.html

	Histórico:
		1.1.0 [12/11/2016]: Refatoração de código e melhorias no zoom e transição de imagens.
		1.0.0 [01/05/2016]: Primeiro lançamento.
*/

function imageViewer(args) {
	var body = document.body,
		image,
		overlay,
		header,
		buttonPrev,
		buttonNext,
		margin = 25,
		imageLinkIndex = 0,
		zoomFactor = 0.2,
		sizeLimit = 12;


	// CONFIGURAÇÃO

	config();


	// FUNÇÕES

	function config() {
		setHeader();
		setImage();
		setOverlay();
		setNavigationButtons();
		loadStyle(args.css);

		// links
		for (var i = 0; i < args.links.length; i++) {
			var imageLink = args.links[i];

			imageLink.setAttributeNode(document.createAttribute("url"));
			imageLink.setAttributeNode(document.createAttribute("index"));
			imageLink.url = imageLink.href;
			imageLink.index = i;
			imageLink.href = "javascript:";
			imageLink.onclick = function() {
				image.style.cursor = "wait";
				overlay.style.cursor = "wait";
				buttonPrev.style.cursor = "wait";
				buttonNext.style.cursor = "wait";
				imageLinkIndex = this.index;

				var fileExt = this.url.substr(this.url.lastIndexOf("."));
				show(this.url, this.innerText + (fileExt ? fileExt.toLowerCase() : ""));
			};
		}
	}

	function setImage() {
		image = document.createElement("img");
		image.border = 0;
		image.className = "iv-image";
		image.setAttributeNode(document.createAttribute("realHeight"));
		image.setAttributeNode(document.createAttribute("realWidth"));
		image.onload = afterShowImage;
		image.onmousewheel = zoom;
		image.onmousedown = dragImage;
		image.ondblclick = toggleImageSize;
		image.onmouseup = function() {
			// dependência para drag
			document.onmousemove = null;
			document.onselectstart = null;
			image.ondragstart = null;
		};

		body.appendChild(image);
	}

	function setHeader() {
		header = document.createElement("div");
		header.className = "iv-image-header";
		header.style.display = "none";
		header.innerHTML = '<span id="iv-image-name"></span><span id="iv-button-close">✖</span>';
		body.appendChild(header);

		// botão fechar
		document.getElementById("iv-button-close").onclick = exit;
	}

	function setNavigationButtons() {
		buttonPrev = document.createElement("div");
		buttonPrev.className = "iv-nav iv-nav-prev";
		buttonPrev.style.display = "none";
		buttonPrev.onclick = showPreviousImage;
		buttonPrev.onmouseover = function() { buttonPrev.style.filter = "alpha(opacity=80)"; }; // IE5
		buttonPrev.onmouseout = function() { buttonPrev.style.filter = "alpha(opacity=60)"; };
		body.appendChild(buttonPrev);

		buttonNext = document.createElement("div");
		buttonNext.className = "iv-nav iv-nav-next";
		buttonNext.style.display = "none";
		buttonNext.onclick = showNextImage;
		buttonNext.onmouseover = function() { buttonNext.style.filter = "alpha(opacity=80)"; }; // IE5
		buttonNext.onmouseout = function() { buttonNext.style.filter = "alpha(opacity=60)"; };
		body.appendChild(buttonNext);
	}

	function setOverlay() {
		overlay = document.createElement("div");
		overlay.id = "iv-overlay";
		overlay.style.display = "none";
		overlay.className = "iv-overlay";
		overlay.onmousewheel = zoom;
		overlay.onclick = exit;

		body.appendChild(overlay);
	}

	function loadStyle(href) {
		var styleLink = document.createElement("link");
		styleLink.type = "text/css";
		styleLink.rel = "stylesheet";
		styleLink.href = href;

		document.getElementsByTagName("head")[0].appendChild(styleLink);
	}

	function runActionByKey() {
		try {
			if (event.keyCode === 39)
				showNextImage();

			if (event.keyCode === 37)
				showPreviousImage();

			if (event.keyCode === 27)
				exit();
		} catch(ex) {}
	}

	function show(imageSrc, imageName) {
		showScrollBars(false);

		if (args.links.length > 1) {
			buttonPrev.style.display = "block";
			buttonNext.style.display = "block";
			positionNavigationButtons();
		}

		overlay.style.display = "block";
		resizeOverlay();

		header.style.display = "block";
		document.getElementById("iv-image-name").innerHTML = imageName;

		image.removeAttribute("src");
		image.removeAttribute("height");
		image.removeAttribute("width");
		image.style.top = -image.height;
		image.style.left = -image.width;
		image.style.visibility = "hidden";
		image.src = imageSrc;

		// remove/adiciona eventos
		removeEvent(window, "resize", resizeImage);
		removeEvent(document, "keydown", runActionByKey);
		addEvent(window, "resize", resizeImage);
		addEvent(document, "keydown", runActionByKey);
	}

	function afterShowImage() {
		image.realHeight = image.height;
		image.realWidth = image.width;
		resizeImage();

		image.style.visibility = "visible";
		image.style.cursor = "move";
		overlay.style.cursor = "auto";
		buttonPrev.style.cursor = "pointer";
		buttonNext.style.cursor = "pointer";
	}

	function showNextImage() {
		if (image.style.display !== "none") {
			var imageLink = args.links[Number(imageLinkIndex) + 1];

			if (!imageLink)
				imageLink = args.links[0];

			imageLink.click();
		}
	}

	function showPreviousImage() {
		if (image.style.display !== "none") {
			var imageLink = args.links[Number(imageLinkIndex) - 1];

			if (!imageLink)
				imageLink = args.links[args.links.length - 1];

			imageLink.click();
		}
	}

	function toggleImageSize() {
		if (image.height === image.realHeight) {
			fitImageToScreen();
		} else {
			// tamanho real
			image.removeAttribute("width");
			image.removeAttribute("height");
			image.width = image.realWidth;
			image.height = image.realHeight;
			centerImage();
		}
	}

	function resizeImage() {
		fitImageToScreen();
		resizeOverlay();
		positionNavigationButtons();
	}

	function fitImageToScreen() {
		var ch = document.body.clientHeight,
			cw = document.body.clientWidth;

		image.removeAttribute("width");

		if (image.realHeight > ch) {
			image.height = ch - margin;
		}

		if (image.width > cw) {
			image.removeAttribute("height");
			image.width = cw - margin;
		}

		centerImage();
	}

	function centerImage() {
		image.style.top = (document.body.clientHeight - image.height) / 2;
		image.style.left = (document.body.clientWidth - image.width) / 2;
	}

	function zoom(e) {
		var wheelDelta = event.wheelDelta;

		if (wheelDelta > 0) {
			if (image.width / image.realWidth < sizeLimit) { // limite
				image.width = image.width * (1 + zoomFactor);
				image.removeAttribute("height");
				image.height = image.height;
			}
		} else {
			if (image.realWidth / image.width < sizeLimit) {
				image.width = image.width * (1 - zoomFactor);
				image.removeAttribute("height");
				image.height = image.height;
			}
		}

		centerImage();
	}

	function positionNavigationButtons() {
		var w = 30, h = 90;

		buttonPrev.style.left = 0;
		buttonPrev.style.top = document.body.clientHeight / 2 - h / 2;
		buttonNext.style.left = document.body.clientWidth - w;
		buttonNext.style.top = document.body.clientHeight / 2 - h / 2;
	}

	function resizeOverlay() {
		// overlay
		overlay.style.width = document.body.clientWidth;
		overlay.style.height = document.body.clientHeight;
	}

	function dragImage(e) {
		var target,
			startX = 0,
			startY = 0,
			offsetX = 0,
			offsetY = 0;

		// IE is retarded and doesn't pass the event object
		if (!e) e = window.event;

		// IE uses srcElement, others use target
		target = e.target ? e.target : e.srcElement;

		// for IE, left click === 1
		// for Firefox, left click === 0
		if ((e.button === 1 && window.event !== null || e.button === 0) && target.className === image.className) {
			// grab the mouse position
			startX = e.clientX;
			startY = e.clientY;

			// grab the clicked element's position
			offsetX = getOffset(image.style.left);
			offsetY = getOffset(image.style.top);

			// tell our code to start moving the element with the mouse
			document.onmousemove = function (e) {
				if (!e) e = window.event;

				image.style.left = offsetX + e.clientX - startX;
				image.style.top = offsetY + e.clientY - startY;
			};

			// cancel out any text selections
			document.body.focus();

			// prevent text selection in IE
			document.onselectstart = function() { return false; };

			// prevent IE from trying to drag an image
			image.ondragstart = function() { return false; };

			// prevent text selection (except IE)
			return false;
		}

		function getOffset(value) {
			var offset = parseInt(value);
			return offset === null || isNaN(offset) ? 0 : offset;
		}
	}

	function showScrollBars(show) {
		var overflow = "auto", scroll = "yes";

		if (show !== undefined && show === false) {
			overflow = "hidden";
			scroll = "no";
		}

		document.documentElement.style.overflow = overflow; // firefox, chrome
		document.body.scroll = scroll; // ie only
		document.body.scrollTop = 0;
		document.body.scrollLeft = 0;
	}

	function exit() {
		// oculta os elementos
		overlay.style.display = "none";
		buttonPrev.style.display = "none";
		buttonNext.style.display = "none";
		header.style.display = "none";
		image.style.visibility = "hidden";

		// remove eventos
		removeEvent(window, "resize", resizeOverlay);
		removeEvent(document, "keydown", runActionByKey);

		showScrollBars();
	}

	function addEvent(element, event, func) {
		if (element.addEventListener) // for all major browsers, except IE 8 and earlier
			element.addEventListener(event, func);
		else if (element.attachEvent) // for IE 8 and earlier versions
			element.attachEvent("on" + event, func);
	}

	function removeEvent(element, event, func) {
		if (element.removeEventListener)
			element.removeEventListener(event, func, false);
		else if (element.detachEvent)
			element.detachEvent('on' + event, func);
	}
}
