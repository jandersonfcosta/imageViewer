/*
	Image Viewer
	Descrição: Visualizador de imagens para browser.
	Criado por Janderson Costa.

	Uso: ver demo.html

	Histórico:
		1.1.0 [12/11/2016]: Refatoração de código e melhorias no zoom e transição de imagens.
		1.0.0 [01/05/2016]: Primeiro lançamento.
*/

function imageViewer(args) {
	var body = document.body,
		img,
		overlay,
		imgHeader,
		navPrev,
		navNext,
		margin = 25,
		imgIndex = 0,
		zoomFactor = 0.2,
		sizeLimit = 12,

		// drag
		startX = 0,
		startY = 0,
		offsetX = 0,
		offsetY = 0,
		dragElement;


	// CONFIGURAÇÃO

	config();


	// FUNÇÕES

	function config() {
		setImg();
		setImgHeader();
		setOverlay();
		setSideNav();
		setCSS(args.css);

		// links
		for (var i = 0; i < args.links.length; i++) {
			var link = args.links[i];

			link.setAttributeNode(document.createAttribute("url"));
			link.setAttributeNode(document.createAttribute("index"));
			link.url = link.href;
			link.index = i;
			link.href = "javascript:";
			link.onclick = function() {
				img.style.cursor = "wait";
				overlay.style.cursor = "wait";
				navPrev.style.cursor = "wait";
				navNext.style.cursor = "wait";
				imgIndex = this.index;

				var fileExt = this.url.substr(this.url.lastIndexOf("."));
				show(this.url, this.innerText + (fileExt ? fileExt.toLowerCase() : ""));
			};
		}
	}

	function setImg() {
		img = document.createElement("img");
		img.border = 0;
		img.className = "iv-img";
		img.setAttributeNode(document.createAttribute("realHeight"));
		img.setAttributeNode(document.createAttribute("realWidth"));

		body.appendChild(img);

		img.onload = afterShow;
		img.onmousewheel = zoom;
		img.onmousedown = drag;
		img.onmouseup = mouseUp;
		img.ondblclick = toggleSize;
	}

	function setImgHeader() {
		imgHeader = document.createElement("div");
		imgHeader.className = "iv-img-header";
		imgHeader.style.display = "none";
		imgHeader.innerHTML = '<span id="iv-image-name"></span><span id="iv-button-close">✖</span>';
		body.appendChild(imgHeader);

		// botão fechar
		document.getElementById("iv-button-close").onclick = exit;
	}

	function setSideNav() {
		navPrev = document.createElement("div");
		navPrev.className = "iv-nav iv-nav-prev";
		navPrev.style.display = "none";
		navPrev.onclick = prev;
		navPrev.onmouseover = function() { navPrev.style.filter = "alpha(opacity=80)"; }; // IE5
		navPrev.onmouseout = function() { navPrev.style.filter = "alpha(opacity=60)"; };
		body.appendChild(navPrev);

		navNext = document.createElement("div");
		navNext.className = "iv-nav iv-nav-next";
		navNext.style.display = "none";
		navNext.onclick = next;
		navNext.onmouseover = function() { navNext.style.filter = "alpha(opacity=80)"; }; // IE5
		navNext.onmouseout = function() { navNext.style.filter = "alpha(opacity=60)"; };
		body.appendChild(navNext);
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

	function setCSS(href) {
		var link = document.createElement("link");
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = href;

		document.getElementsByTagName("head")[0].appendChild(link);
	}

	function keyCommands() {
		try {
			// próxima
			if (event.keyCode === 39)
				next();

			// anterior
			if (event.keyCode === 37)
				prev();

			// sair
			if (event.keyCode === 27)
				exit();
		} catch(ex) {}
	}

	function show(imgSrc, imgName) {
		showScrollBars(false);

		if (args.links.length > 1) {
			navPrev.style.display = "block";
			navNext.style.display = "block";
			setNavPosition();
		}

		overlay.style.display = "block";
		resizeOverlay();

		imgHeader.style.display = "block";
		document.getElementById("iv-image-name").innerHTML = imgName;

		img.removeAttribute("src");
		img.removeAttribute("height");
		img.removeAttribute("width");
		img.style.top = -img.height;
		img.style.left = -img.width;
		img.style.visibility = "hidden";
		img.src = imgSrc;

		// remove/adiciona eventos
		removeEvent(window, "resize", resize);
		removeEvent(document, "keydown", keyCommands);
		addEvent(window, "resize", resize);
		addEvent(document, "keydown", keyCommands);
	}

	function next() {
		if (img.style.display !== "none") {
			var link = args.links[Number(imgIndex) + 1];

			if (!link)
				link = args.links[0];

			link.click();
		}
	}

	function prev() {
		if (img.style.display !== "none") {
			var link = args.links[Number(imgIndex) - 1];

			if (!link)
				link = args.links[args.links.length - 1];

			link.click();
		}
	}

	function afterShow() {
		img.realHeight = img.height;
		img.realWidth = img.width;
		resize();

		img.style.visibility = "visible";
		img.style.cursor = "move";
		overlay.style.cursor = "auto";
		navPrev.style.cursor = "pointer";
		navNext.style.cursor = "pointer";
	}

	function toggleSize() {
		if (img.height === img.realHeight) {
			fitToScreen();
		} else {
			// tamanho real
			img.removeAttribute("width");
			img.removeAttribute("height");
			img.width = img.realWidth;
			img.height = img.realHeight;
			center();
		}
	}

	function resize() {
		fitToScreen();
		resizeOverlay();
		setNavPosition();
	}

	function fitToScreen() {
		var ch = document.body.clientHeight,
			cw = document.body.clientWidth;

		img.removeAttribute("width");

		if (img.realHeight > ch) {
			img.height = ch - margin;
		}

		if (img.width > cw) {
			img.removeAttribute("height");
			img.width = cw - margin;
		}

		center();
	}

	function center() {
		img.style.top = (document.body.clientHeight - img.height) / 2;
		img.style.left = (document.body.clientWidth - img.width) / 2;
	}

	function zoom(e) {
		var wheelDelta = event.wheelDelta;

		if (wheelDelta > 0) {
			if (img.width / img.realWidth < sizeLimit) { // limite
				img.width = img.width * (1 + zoomFactor);
				img.removeAttribute("height");
				img.height = img.height;
			}
		} else {
			if (img.realWidth / img.width < sizeLimit) {
				img.width = img.width * (1 - zoomFactor);
				img.removeAttribute("height");
				img.height = img.height;
			}
		}

		center();
	}

	function setNavPosition() {
		var w = 30, h = 90;

		navPrev.style.left = 0;
		navPrev.style.top = document.body.clientHeight / 2 - h / 2;
		navNext.style.left = document.body.clientWidth - w;
		navNext.style.top = document.body.clientHeight / 2 - h / 2;
	}

	function resizeOverlay() {
		// overlay
		overlay.style.width = document.body.clientWidth;
		overlay.style.height = document.body.clientHeight;
	}

	function drag(e) {

		// IE is retarded and doesn't pass the event object
		if (!e) e = window.event;

		// IE uses srcElement, others use target
		var target = e.target ? e.target : e.srcElement;

		// for IE, left click === 1
		// for Firefox, left click === 0
		if ((e.button === 1 && window.event !== null || e.button === 0) && target.className === img.className) {
			// grab the mouse position
			startX = e.clientX;
			startY = e.clientY;

			// grab the clicked element's position
			offsetX = getOffset(target.style.left);
			offsetY = getOffset(target.style.top);

			// we need to access the element in OnMouseMove
			dragElement = target;

			// tell our code to start moving the element with the mouse
			document.onmousemove = mouseMove;

			// cancel out any text selections
			document.body.focus();

			// prevent text selection in IE
			document.onselectstart = function() { return false; };

			// prevent IE from trying to drag an image
			target.ondragstart = function() { return false; };

			// prevent text selection (except IE)
			return false;
		}

		function getOffset(value) {
			var offset = parseInt(value);
			return offset === null || isNaN(offset) ? 0 : offset;
		}
	}

	function mouseMove(e) {
		if (!e) e = window.event;

		// dependência para drag
		dragElement.style.left = (offsetX + e.clientX - startX);
		dragElement.style.top = (offsetY + e.clientY - startY);
	}

	function mouseUp() {
		// dependência para drag
		if (dragElement !== null) {
			document.onmousemove = null;
			document.onselectstart = null;
			dragElement.ondragstart = null;
			dragElement = null;
		}
	}

	function showScrollBars(display) {
		var overflow = "auto", scroll = "yes";

		if (display !== undefined && display === false) {
			overflow = "hidden";
			scroll = "no";
		}

		document.documentElement.style.overflow = overflow;// firefox, chrome
		document.body.scroll = scroll;// ie only
		document.body.scrollTop = 0;
		document.body.scrollLeft = 0;
	}

	function exit() {
		// oculta os elementos
		overlay.style.display = "none";
		navPrev.style.display = "none";
		navNext.style.display = "none";
		imgHeader.style.display = "none";
		img.style.visibility = "hidden";

		// remove eventos
		removeEvent(window, "resize", resizeOverlay);
		removeEvent(document, "keydown", keyCommands);

		showScrollBars();
	}

	function addEvent(element, event, f) {
		if (element.addEventListener) // for all major browsers, except IE 8 and earlier
			element.addEventListener(event, f);
		else if (element.attachEvent) // for IE 8 and earlier versions
			element.attachEvent("on" + event, f);
	}

	function removeEvent(element, event, f) {
		if (element.removeEventListener)
			element.removeEventListener(event, f, false);
		else if (element.detachEvent)
			element.detachEvent('on' + event, f);
	}
}
