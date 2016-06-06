/*
	imageViewer 1.0.0
	Descrição: Visualizador de imagens para browser.
	Criado por Janderson Costa em 01/05/2016.

	Uso:
		imageViewer({
			links: document.getElementsByTagName("a"),
			css: "../css/imageviewer.css"
		});
*/

function imageViewer(args) {
	var
	img,
	overlay,
	imgHeader,
	navPrev,
	navNext,
	body = document.getElementsByTagName("body")[0],
	margin = 25,
	imageviewer_imgIndex = 0;

	// CONFIGURAÇÃO
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
		link.href = "javascript:"
		link.onclick = function() {
			img.style.cursor = "wait";
			overlay.style.cursor = "wait";
			imageviewer_imgIndex = this.index;
			show(this.url, this.innerText);
		};
	}

	// FUNÇÕES
	function setImg() {
		img = document.createElement("img");
		img.border = 0;
		img.className = "imageviewer-img";
		img.setAttributeNode(document.createAttribute("realHeight"));
		img.setAttributeNode(document.createAttribute("realWidth"));

		img.onload = afterShow;
		img.onmousewheel = zoom;
		img.onmousedown = drag;
		img.onmouseup = mouseUp;
		img.ondblclick = toggleSize;

		body.appendChild(img);
	}

	function setImgHeader() {
		imgHeader = document.createElement("div");
		imgHeader.className = "imageviewer-img-header";
		imgHeader.innerHTML = '<span id="imageviewer_imgName"></span><span id="imageviewer_closeBtn">✖</span>';
		body.appendChild(imgHeader);

		// botão fechar
		document.getElementById("imageviewer_closeBtn").onclick = exit;
	}

	function setSideNav() {
		navPrev = document.createElement("div");
		navPrev.className = "imageviewer-nav imageviewer-nav-prev";
		navPrev.onclick = prev;
		body.appendChild(navPrev);

		navNext = document.createElement("div");
		navNext.className = "imageviewer-nav imageviewer-nav-next";
		navNext.onclick = next;
		body.appendChild(navNext);

		setNavPosition();
	}

	function setOverlay() {
		overlay = document.createElement("div");
		overlay.id = "imageviewer_overlay";
		overlay.className = "imageviewer-overlay";
		overlay.onmousewheel = zoom;

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
		// próxima
		if (event.keyCode == 39)
			next();

		// anterior
		if (event.keyCode == 37)
			prev();

		// sair
		if (event.keyCode == 27)
			exit();
	}

	function next() {
		if (img.style.display != "none") {
			var link = args.links[Number(imageviewer_imgIndex) + 1];

			if (!link)
				link = args.links[0];

			link.click();
		}
	}

	function prev() {
		if (img.style.display != "none") {
			var link = args.links[Number(imageviewer_imgIndex) - 1];

			if (!link)
				link = args.links[args.links.length - 1];

			link.click();
		}
	}

	function show(imgSrc, imgName) {
		showScrollBars(false);

		// remove/adiciona eventos
		removeEvent(window, "resize", resize);
		removeEvent(document, "keydown", keyCommands);
		addEvent(window, "resize", resize);
		addEvent(document, "keydown", keyCommands);

		overlay.style.display = "block";

		if (args.links.length > 1) {
			navPrev.style.display = "block";
			navNext.style.display = "block";
		}

		imgHeader.style.display = "block";
		document.getElementById("imageviewer_imgName").innerHTML = imgName;

		img.removeAttribute("src");
		img.removeAttribute("height");
		img.removeAttribute("width");
		img.style.top = -img.height;
		img.style.left = -img.width;
		img.style.display = "block";
		img.src = imgSrc;
	}

	function afterShow() {
		img.realHeight = img.height;
		img.realWidth = img.width;
		resize();
		img.style.cursor = "move";
		overlay.style.cursor = "auto";
	}

	function toggleSize() {
		if (img.height == img.realHeight)
			fitToScreen();
		else {
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
		var
		ch = document.body.clientHeight,
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
		var
		zoomFactor = 0.2,
		wheelDelta = event.wheelDelta;

		img.removeAttribute("height");

		if (wheelDelta > 0) {
			if (img.width / img.realWidth < 12)// limite
				img.width = img.width * (1 + zoomFactor);
		} else {
			if (img.realWidth / img.width < 12)
				img.width = img.width * (1 - zoomFactor);
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

	// arrastar
	var _startX = 0, _startY = 0, _offsetX = 0, _offsetY = 0, _dragElement;

	function drag(e) {

		// IE is retarded and doesn't pass the event object
		if (e == null)
			e = window.event;
		
		// IE uses srcElement, others use target
		var target = e.target != null ? e.target : e.srcElement;

		// for IE, left click == 1
		// for Firefox, left click == 0
		if ((e.button == 1 && window.event != null || e.button == 0) && target.className == img.className) {
			// grab the mouse position
			_startX = e.clientX;
			_startY = e.clientY;

			// grab the clicked element's position
			_offsetX = getOffset(target.style.left);
			_offsetY = getOffset(target.style.top);
			
			// we need to access the element in OnMouseMove
			_dragElement = target;

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
			return offset == null || isNaN(offset) ? 0 : offset;
		}
	}

	function mouseMove(e) {
		if (e == null) 
			var e = window.event;

		// dependência para drag
		_dragElement.style.left = (_offsetX + e.clientX - _startX);
		_dragElement.style.top = (_offsetY + e.clientY - _startY);  
	}

	function mouseUp() {
		// dependência para drag
		if (_dragElement != null) {
			document.onmousemove = null;
			document.onselectstart = null;
			_dragElement.ondragstart = null;   
			_dragElement = null;
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
		img.style.display = "none";

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
