document.addEventListener("DOMContentLoaded", () => {
  // DOM要素の取得
  const imageUpload = document.getElementById("imageUpload");
  const stampListContainer = document.getElementById("stamp-list");

  const textInput = document.getElementById("text-input");
  const fontFamilySelect = document.getElementById("font-family");
  const fontSizeInput = document.getElementById("font-size");
  const fontColorInput = document.getElementById("font-color");
  const strokeWidthInput = document.getElementById("stroke-width");
  const strokeColorInput = document.getElementById("stroke-color");
  const imageScale = document.getElementById("image-scale");
  const imageScaleNumber = document.getElementById("image-scale-number");

  const resetImageButton = document.getElementById("reset-image");
  const removeBackgroundButton = document.getElementById("remove-background");

  const applyFontAllButton = document.getElementById("apply-font-all");
  const downloadZipButton = document.getElementById("download-zip");
  const downloadSingleButton = document.getElementById("download-single");
  const clearAllButton = document.getElementById("clear-all-stamps");

  const mainImageCanvasEl = document.getElementById("main-image-canvas");
  const tabImageCanvasEl = document.getElementById("tab-image-canvas");
  const dragOverlay = document.getElementById("drag-overlay");
  const loadingOverlay = document.getElementById("loading-overlay");

  // カスタム確認モーダル
  const confirmModal = document.getElementById("confirm-modal");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmOkBtn = document.getElementById("confirm-ok");
  const confirmCancelBtn = document.getElementById("confirm-cancel");

  // --- グローバル変数 ---
  let fabricCanvas;
  let stamps = [];
  let activeStampIndex = -1;
  let mainImageIndex = -1;
  let tabImageIndex = -1;
  let selfieSegmentation;
  let isApplyingChanges = false; // UI更新の無限ループを防ぐフラグ
  const DB_NAME = "line-stamp-editor";
  const DB_STORE = "session";
  const DB_VERSION = 1;
  const MAIN_EXPORT_SIZE = { width: 240, height: 240 };
  const TAB_EXPORT_SIZE = { width: 96, height: 74 };
  let dbPromise;
  let persistTimer;
  let draggedIndex = null; // ドラッグ中のアイテムのインデックス

  // --- 初期化 ---
  async function initialize() {
    dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE);
        }
      },
    });

    fabricCanvas = new fabric.Canvas("main-canvas", {
      backgroundColor: "#374151", // 背景色を少し明るく
      preserveObjectStacking: true,
    });

    initializeMediaPipe();
    setupEventListeners();
    setupFabricListeners();
    await restoreSession();
  }

  function initializeMediaPipe() {
    selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });
    selfieSegmentation.setOptions({
      modelSelection: 1,
    });
  }

  function setupEventListeners() {
    imageUpload.addEventListener("change", handleImageUpload);
    document.body.addEventListener("dragenter", showDragOverlay);
    document.body.addEventListener("dragover", showDragOverlay);
    dragOverlay.addEventListener("dragleave", hideDragOverlay);
    dragOverlay.addEventListener("drop", handleDrop);

    // Text controls
    textInput.addEventListener("input", (e) =>
      updateActiveObjectProperty("text", e.target.value)
    );
    fontFamilySelect.addEventListener("change", (e) =>
      updateActiveObjectProperty("fontFamily", e.target.value)
    );
    fontSizeInput.addEventListener("input", (e) =>
      updateActiveObjectProperty("fontSize", parseInt(e.target.value, 10))
    );
    fontColorInput.addEventListener("input", (e) =>
      updateActiveObjectProperty("fill", e.target.value)
    );
    strokeWidthInput.addEventListener("input", (e) =>
      updateActiveObjectProperty("strokeWidth", parseInt(e.target.value, 10))
    );
    strokeColorInput.addEventListener("input", (e) =>
      updateActiveObjectProperty("stroke", e.target.value)
    );

    // Image controls
    imageScale.addEventListener("input", (e) => {
      if (isApplyingChanges) return;
      const imageObject = fabricCanvas.getObjects("image")[0];
      if (imageObject) {
        const value = parseFloat(e.target.value);
        imageObject.scale(value);
        imageScaleNumber.value = value;
        fabricCanvas.renderAll();
        saveState();
      }
    });

    // 数値入力でのスケール変更
    imageScaleNumber.addEventListener("input", (e) => {
      if (isApplyingChanges) return;
      const imageObject = fabricCanvas.getObjects("image")[0];
      if (imageObject) {
        let value = parseFloat(e.target.value);
        // 範囲外の値を制限
        if (value < 0.1) value = 0.1;
        if (value > 3) value = 3;
        imageObject.scale(value);
        imageScale.value = value;
        fabricCanvas.renderAll();
        saveState();
      }
    });

    // キーボード矢印キーで選択中のオブジェクトを1px移動
    document.addEventListener("keydown", (e) => {
      const activeObject = fabricCanvas.getActiveObject();
      if (!activeObject) return;

      // テキスト入力中は無視
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      let moved = false;
      const step = 1; // 1ピクセル移動

      switch (e.key) {
        case "ArrowUp":
          activeObject.set("top", activeObject.top - step);
          moved = true;
          break;
        case "ArrowDown":
          activeObject.set("top", activeObject.top + step);
          moved = true;
          break;
        case "ArrowLeft":
          activeObject.set("left", activeObject.left - step);
          moved = true;
          break;
        case "ArrowRight":
          activeObject.set("left", activeObject.left + step);
          moved = true;
          break;
      }

      if (moved) {
        e.preventDefault();
        activeObject.setCoords();
        fabricCanvas.renderAll();
        saveState();
      }
    });

    // Action buttons
    resetImageButton.addEventListener("click", resetActiveStamp);
    applyFontAllButton.addEventListener("click", applyFontToAllStamps);
    downloadSingleButton.addEventListener("click", downloadSingleStamp);
    downloadZipButton.addEventListener("click", downloadAsZip);
    removeBackgroundButton.addEventListener("click", removeBackground);
    clearAllButton.addEventListener("click", (e) => {
      e.preventDefault();
      clearAllStamps();
    });
  }

  function setupFabricListeners() {
    fabricCanvas.on({
      "selection:created": updateUIControls,
      "selection:updated": updateUIControls,
      "selection:cleared": clearUIControls,
      "object:modified": (e) => {
        saveState();
        // Update UI controls if the modified object is the currently active one
        if (e.target === fabricCanvas.getActiveObject()) {
          updateUIControls(e);
        }
      },
      "object:scaling": (e) => {
        if (e.target.type === "image") {
          isApplyingChanges = true;
          imageScale.value = e.target.scaleX;
          imageScaleNumber.value = e.target.scaleX;
          isApplyingChanges = false;
        }
      },
    });
  }

  function schedulePersist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistSession, 400);
  }

  async function persistSession() {
    if (!dbPromise) return;
    try {
      const db = await dbPromise;
      await db.put(
        DB_STORE,
        {
          stamps,
          mainImageIndex,
          tabImageIndex,
          activeStampIndex,
        },
        "state"
      );
    } catch (error) {
      console.error("Failed to persist session", error);
    }
  }

  async function restoreSession() {
    try {
      const db = await dbPromise;
      const state = await db.get(DB_STORE, "state");
      if (!state || !state.stamps || state.stamps.length === 0) return;
      stamps = state.stamps;
      mainImageIndex = state.mainImageIndex ?? -1;
      tabImageIndex = state.tabImageIndex ?? -1;
      activeStampIndex = -1;
      await redrawStampList();
      const targetIndex =
        typeof state.activeStampIndex === "number" &&
        stamps[state.activeStampIndex]
          ? state.activeStampIndex
          : 0;
      setActiveStamp(targetIndex);
    } catch (error) {
      console.error("Failed to restore session", error);
    }
  }

  function saveState() {
    if (activeStampIndex !== -1 && stamps[activeStampIndex]) {
      stamps[activeStampIndex].fabricState = fabricCanvas.toJSON();
      if (
        activeStampIndex === mainImageIndex ||
        activeStampIndex === tabImageIndex
      ) {
        redrawSpecialCanvases();
      }
      schedulePersist();
    }
  }

  // --- Image Actions ---
  async function resetActiveStamp() {
    if (activeStampIndex === -1) return;
    const confirmed = await showConfirmDialog(
      "現在のスタンプへの変更をリセットしますか？"
    );
    if (confirmed) {
      stamps[activeStampIndex].fabricState = null;
      // Re-load the stamp to reset its state on the canvas
      const currentIndex = activeStampIndex;
      activeStampIndex = -1; // Force reload
      setActiveStamp(currentIndex);
    }
  }

  async function removeBackground() {
    if (!selfieSegmentation) {
      alert("背景透過モデルの読み込みが完了していません。");
      return;
    }
    const activeObject = fabricCanvas.getObjects("image")[0];
    if (!activeObject) {
      alert("キャンバスに画像がありません。");
      return;
    }

    loadingOverlay.classList.remove("hidden");

    const imageElement = activeObject.getElement();

    selfieSegmentation.onResults((results) => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = results.image.width;
      tempCanvas.height = results.image.height;
      const tempCtx = tempCanvas.getContext("2d");

      tempCtx.drawImage(
        results.image,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );
      tempCtx.globalCompositeOperation = "destination-in";
      tempCtx.drawImage(
        results.segmentationMask,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );

      const newImg = new Image();
      newImg.onload = () => {
        const newFabricImg = new fabric.Image(newImg, {
          left: activeObject.left,
          top: activeObject.top,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
          angle: activeObject.angle,
        });
        fabricCanvas.remove(activeObject);
        fabricCanvas.add(newFabricImg);
        fabricCanvas.renderAll();
        saveState();
        loadingOverlay.classList.add("hidden");
      };
      newImg.src = tempCanvas.toDataURL("image/png");
    });

    await selfieSegmentation.send({ image: imageElement });
  }

  async function applyFontToAllStamps() {
    if (activeStampIndex === -1) {
      alert("基準となるスタンプを選択してください。");
      return;
    }
    const fontConfirmed = await showConfirmDialog(
      "現在のフォント設定をすべてのスタンプに適用しますか？この操作は元に戻せません。"
    );
    if (!fontConfirmed) {
      return;
    }

    loadingOverlay.classList.remove("hidden");

    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject || activeObject.type !== "i-text") {
      alert("テキストを選択してください。");
      loadingOverlay.classList.add("hidden");
      return;
    }

    const fontProps = {
      fontFamily: activeObject.fontFamily,
      fontSize: activeObject.fontSize,
      fill: activeObject.fill,
      stroke: activeObject.stroke,
      strokeWidth: activeObject.strokeWidth,
      paintFirst: "stroke",
    };

    // Save current state before modifying others
    saveState();

    const tempCanvas = new fabric.StaticCanvas(null, {
      width: 370,
      height: 320,
    });

    for (let i = 0; i < stamps.length; i++) {
      if (i === activeStampIndex) continue;

      const stamp = stamps[i];

      if (stamp.fabricState) {
        // Logic for already-edited stamps
        await new Promise((resolve) => {
          tempCanvas.loadFromJSON(stamp.fabricState, () => {
            const textObject = tempCanvas.getObjects("i-text")[0];
            if (textObject) {
              textObject.set(fontProps);
            }
            tempCanvas.renderAll();
            stamp.fabricState = tempCanvas.toJSON();
            tempCanvas.clear();
            resolve();
          });
        });
      } else {
        // Logic for pristine, un-edited stamps
        await new Promise((resolve) => {
          fabric.Image.fromURL(
            stamp.originalImageSrc,
            (fabricImage) => {
              const canvasAspect = tempCanvas.width / tempCanvas.height;
              const imageAspect = fabricImage.width / fabricImage.height;
              let scale =
                imageAspect > canvasAspect
                  ? tempCanvas.width / fabricImage.width
                  : tempCanvas.height / fabricImage.height;

              fabricImage.scale(scale * 0.9);
              tempCanvas.add(fabricImage);
              fabricImage.center();

              const text = new fabric.IText("テキストを入力", {
                top: tempCanvas.height * 0.8,
                left: tempCanvas.width / 2,
                originX: "center",
                ...fontProps,
              });
              tempCanvas.add(text);

              tempCanvas.renderAll();
              stamp.fabricState = tempCanvas.toJSON();
              tempCanvas.clear();
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      }
    }

    schedulePersist();
    redrawSpecialCanvases();
    loadingOverlay.classList.add("hidden");
    alert("すべてのスタンプにフォント設定を適用しました。");
  }

  // --- UI更新 ---
  function updateUIControls(e) {
    if (!e.target) return;
    const activeObject = e.target;
    isApplyingChanges = true;
    if (activeObject.type === "i-text") {
      textInput.value = activeObject.text;
      fontFamilySelect.value = activeObject.fontFamily;
      fontSizeInput.value = activeObject.fontSize;
      fontColorInput.value = activeObject.fill;
      strokeWidthInput.value = activeObject.strokeWidth;
      strokeColorInput.value = activeObject.stroke;
    } else if (activeObject.type === "image") {
      imageScale.value = activeObject.scaleX;
      imageScaleNumber.value = activeObject.scaleX;
    }
    isApplyingChanges = false;
  }

  function clearUIControls() {
    isApplyingChanges = true;
    textInput.value = "";
    fontFamilySelect.value = "'M PLUS Rounded 1c', sans-serif";
    fontSizeInput.value = 40;
    fontColorInput.value = "#FFFFFF";
    strokeWidthInput.value = 2;
    strokeColorInput.value = "#000000";
    imageScale.value = 1;
    imageScaleNumber.value = 1;
    isApplyingChanges = false;
  }

  function updateActiveObjectProperty(prop, value) {
    if (isApplyingChanges) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && activeObject.type === "i-text") {
      activeObject.set(prop, value);
      fabricCanvas.renderAll();
      saveState();
    }
  }

  // --- 画像の読み込みと管理 ---
  function handleImageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // 既存の画像を削除せず、追加する（ドラッグ&ドロップと同じ動作）
    appendImages(files);
    // inputをリセットして同じファイルを再選択できるようにする
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    dragOverlay.classList.add("hidden");
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      appendImages(files);
    }
  }

  function appendImages(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newStamp = {
            originalImageSrc: img.src,
            fabricState: null,
          };
          stamps.push(newStamp);
          createThumbnail(img, stamps.length - 1);
          if (stamps.length === 1) {
            setActiveStamp(0);
          }
          schedulePersist();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // --- スタンプの選択と状態保存 ---
  function setActiveStamp(index) {
    if (index === activeStampIndex || !stamps[index]) return;

    saveState();

    activeStampIndex = index;
    const activeStamp = stamps[index];

    document.querySelectorAll(".stamp-item").forEach((item) => {
      item.classList.toggle(
        "border-emerald-400",
        parseInt(item.dataset.index, 10) === index
      );
    });

    fabricCanvas.clear();
    clearUIControls();

    const synchronizeUI = () => {
      fabricCanvas.renderAll();
      fabricCanvas.forEachObject((obj) => (obj.selectable = true));

      const imageObject = fabricCanvas.getObjects("image")[0];
      if (imageObject) {
        isApplyingChanges = true;
        imageScale.value = imageObject.scaleX;
        imageScaleNumber.value = imageObject.scaleX;
        isApplyingChanges = false;
      }

      const textObject = fabricCanvas.getObjects("i-text")[0];
      if (textObject) {
        fabricCanvas.setActiveObject(textObject);
      }
      // The 'selection:created' event will fire here, calling updateUIControls
      saveState();
      schedulePersist();
    };

    if (activeStamp.fabricState) {
      fabricCanvas.loadFromJSON(activeStamp.fabricState, synchronizeUI);
    } else {
      fabric.Image.fromURL(
        activeStamp.originalImageSrc,
        (fabricImage) => {
          const canvasAspect = fabricCanvas.width / fabricCanvas.height;
          const imageAspect = fabricImage.width / fabricImage.height;
          let scale =
            imageAspect > canvasAspect
              ? fabricCanvas.width / fabricImage.width
              : fabricCanvas.height / fabricImage.height;

          fabricImage.scale(scale * 0.9);
          fabricCanvas.add(fabricImage);
          fabricImage.center();

          const text = new fabric.IText("テキストを入力", {
            top: fabricCanvas.height * 0.8,
            left: fabricCanvas.width / 2,
            originX: "center",
            fontSize: 40,
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fill: "#FFFFFF",
            stroke: "#000000",
            strokeWidth: 2,
            paintFirst: "stroke",
          });
          fabricCanvas.add(text);

          synchronizeUI();
        },
        { crossOrigin: "anonymous" }
      );
    }
  }

  // --- サムネイル、削除、ダウンロード ---
  function createThumbnail(image, index) {
    const item = document.createElement("div");
    item.className =
      "stamp-item relative aspect-square flex items-center justify-center bg-gray-700 rounded-md cursor-pointer border-2 border-transparent";
    item.dataset.index = index;
    item.draggable = true; // ドラッグ可能に設定

    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = 96;
    thumbCanvas.height = 74;
    const thumbCtx = thumbCanvas.getContext("2d");

    const fit = fitImageToCanvas(image, thumbCanvas);
    thumbCtx.drawImage(
      image,
      fit.offset.x,
      fit.offset.y,
      fit.width,
      fit.height
    );

    // 番号を表示
    const numberBadge = document.createElement("div");
    numberBadge.className =
      "absolute bottom-0 left-0 mb-1 ml-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold";
    numberBadge.textContent = index + 1;
    item.appendChild(numberBadge);

    item.appendChild(thumbCanvas);

    const deleteBtn = document.createElement("div");
    deleteBtn.className =
      "absolute top-0 right-0 -mt-1 -mr-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-red-700 opacity-50 hover:opacity-100 transition-opacity";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteStamp(index);
    };
    item.appendChild(deleteBtn);

    stampListContainer.appendChild(item);
    item.addEventListener("click", () => setActiveStamp(index));
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, index);
    });

    // ドラッグ＆ドロップイベント（スタンプ並び替え用）
    item.addEventListener("dragstart", handleStampDragStart);
    item.addEventListener("dragover", handleStampDragOver);
    item.addEventListener("dragenter", handleStampDragEnter);
    item.addEventListener("dragleave", handleStampDragLeave);
    item.addEventListener("drop", handleStampDrop);
    item.addEventListener("dragend", handleStampDragEnd);
  }

  // --- ドラッグ＆ドロップ処理（スタンプ並び替え用）---
  function handleStampDragStart(e) {
    draggedIndex = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.classList.add("opacity-50");
    e.dataTransfer.effectAllowed = "move";
  }

  function handleStampDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleStampDragEnter(e) {
    e.preventDefault();
    const target = e.currentTarget;
    if (parseInt(target.dataset.index, 10) !== draggedIndex) {
      target.classList.add("border-blue-400", "border-dashed");
    }
  }

  function handleStampDragLeave(e) {
    e.currentTarget.classList.remove("border-blue-400", "border-dashed");
  }

  function handleStampDrop(e) {
    e.preventDefault();
    e.stopPropagation(); // ファイルアップロードのドロップイベントと競合しないように
    const targetIndex = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.classList.remove("border-blue-400", "border-dashed");

    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderStamps(draggedIndex, targetIndex);
    }
  }

  function handleStampDragEnd(e) {
    e.currentTarget.classList.remove("opacity-50");
    document.querySelectorAll(".stamp-item").forEach((item) => {
      item.classList.remove("border-blue-400", "border-dashed");
    });
    draggedIndex = null;
  }

  function reorderStamps(fromIndex, toIndex) {
    // 編集状態を含むオブジェクト全体を移動
    const [movedStamp] = stamps.splice(fromIndex, 1);
    stamps.splice(toIndex, 0, movedStamp);

    // インデックスの更新
    if (activeStampIndex === fromIndex) {
      activeStampIndex = toIndex;
    } else if (fromIndex < activeStampIndex && toIndex >= activeStampIndex) {
      activeStampIndex--;
    } else if (fromIndex > activeStampIndex && toIndex <= activeStampIndex) {
      activeStampIndex++;
    }

    // メイン画像とタブ画像のインデックス更新
    mainImageIndex = updateIndexAfterReorder(
      mainImageIndex,
      fromIndex,
      toIndex
    );
    tabImageIndex = updateIndexAfterReorder(tabImageIndex, fromIndex, toIndex);

    redrawStampList();
    schedulePersist();
  }

  function updateIndexAfterReorder(currentIndex, fromIndex, toIndex) {
    if (currentIndex === -1) return -1;
    if (currentIndex === fromIndex) {
      return toIndex;
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
      return currentIndex - 1;
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
      return currentIndex + 1;
    }
    return currentIndex;
  }

  function deleteStamp(index) {
    stamps.splice(index, 1);

    if (mainImageIndex === index) mainImageIndex = -1;
    else if (mainImageIndex > index) mainImageIndex--;

    if (tabImageIndex === index) tabImageIndex = -1;
    else if (tabImageIndex > index) tabImageIndex--;

    if (activeStampIndex === index) {
      activeStampIndex = -1;
      fabricCanvas.clear();
      clearUIControls();
    } else if (activeStampIndex > index) {
      activeStampIndex--;
    }

    redrawStampList();
    schedulePersist();
  }

  async function clearAllStamps() {
    const confirmed = await showConfirmDialog(
      "アップロードした画像と編集内容をすべて削除します。よろしいですか？"
    );
    if (!confirmed) return;

    stamps = [];
    activeStampIndex = -1;
    mainImageIndex = -1;
    tabImageIndex = -1;
    stampListContainer.innerHTML = "";
    fabricCanvas.clear();
    clearUIControls();
    redrawSpecialCanvases();
    await persistSession();
  }

  async function redrawStampList() {
    stampListContainer.innerHTML = "";
    if (stamps.length === 0) {
      fabricCanvas.clear();
      clearUIControls();
      redrawSpecialCanvases();
      return;
    }
    for (let index = 0; index < stamps.length; index++) {
      const stamp = stamps[index];
      const img = new Image();
      try {
        const previewSrc = stamp.fabricState
          ? await getStampPreviewDataURL(index, 96, 74)
          : stamp.originalImageSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = previewSrc;
        });
      } catch (error) {
        console.error("Failed to build thumbnail", error);
        img.src = stamp.originalImageSrc;
      }

      createThumbnail(img, index);
      if (index === activeStampIndex) {
        const activeItem = stampListContainer.querySelector(
          `[data-index="${index}"]`
        );
        if (activeItem) activeItem.classList.add("border-emerald-400");
      }
    }
    redrawSpecialCanvases();
  }

  async function downloadSingleStamp() {
    if (activeStampIndex === -1) {
      alert("ダウンロードするスタンプを選択してください。");
      return;
    }
    saveState();

    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      multiplier: 370 / fabricCanvas.width,
    });
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `stamp_${activeStampIndex + 1}.png`;
    link.click();
  }

  async function downloadAsZip() {
    if (stamps.length === 0) {
      alert("スタンプ画像がありません。");
      return;
    }

    loadingOverlay.classList.remove("hidden");
    saveState(); // 現在の作業を保存

    const zip = new JSZip();

    for (let i = 0; i < stamps.length; i++) {
      const canvas = await getStampCanvasFromState(stamps[i]);
      const dataURL = canvas.toDataURL({ format: "png" });
      zip.file(`${String(i + 1).padStart(2, "0")}.png`, dataURL.split(",")[1], {
        base64: true,
      });
    }

    // メイン・タブ画像が設定されている場合のみZIPに含める
    if (mainImageIndex !== -1) {
      const mainDataURL = await getStampPreviewDataURL(
        mainImageIndex,
        MAIN_EXPORT_SIZE.width,
        MAIN_EXPORT_SIZE.height
      );
      zip.file("main.png", mainDataURL.split(",")[1], { base64: true });
    }
    if (tabImageIndex !== -1) {
      const tabDataURL = await getStampPreviewDataURL(
        tabImageIndex,
        TAB_EXPORT_SIZE.width,
        TAB_EXPORT_SIZE.height
      );
      zip.file("tab.png", tabDataURL.split(",")[1], { base64: true });
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "line_stamps.zip";
    link.click();
    URL.revokeObjectURL(link.href);
    loadingOverlay.classList.add("hidden");
  }

  // --- ユーティリティ ---
  function fitImageToCanvas(image, canvas) {
    const canvasAspect = canvas.width / canvas.height;
    const imageAspect = image.width / image.height;
    let width, height, x, y;
    if (imageAspect > canvasAspect) {
      width = canvas.width;
      height = width / imageAspect;
    } else {
      height = canvas.height;
      width = height * imageAspect;
    }
    x = (canvas.width - width) / 2;
    y = (canvas.height - height) / 2;
    return { width, height, offset: { x, y } };
  }

  async function getStampCanvasFromState(stamp) {
    const tempCanvas = new fabric.StaticCanvas(null, {
      width: 370,
      height: 320,
    });
    if (stamp.fabricState) {
      await new Promise((resolve) => {
        tempCanvas.loadFromJSON(stamp.fabricState, () => {
          tempCanvas.renderAll();
          resolve();
        });
      });
    } else {
      await new Promise((resolve) => {
        fabric.Image.fromURL(
          stamp.originalImageSrc,
          (fabricImage) => {
            const canvasAspect = tempCanvas.width / tempCanvas.height;
            const imageAspect = fabricImage.width / fabricImage.height;
            let scale =
              imageAspect > canvasAspect
                ? tempCanvas.width / fabricImage.width
                : tempCanvas.height / fabricImage.height;

            fabricImage.scale(scale * 0.9);
            tempCanvas.add(fabricImage);
            fabricImage.center();

            const text = new fabric.IText("テキストを入力", {
              top: tempCanvas.height * 0.8,
              left: tempCanvas.width / 2,
              originX: "center",
              fontSize: 40,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fill: "#FFFFFF",
              stroke: "#000000",
              strokeWidth: 2,
              paintFirst: "stroke",
            });
            tempCanvas.add(text);
            tempCanvas.renderAll();
            resolve();
          },
          { crossOrigin: "anonymous" }
        );
      });
      stamp.fabricState = tempCanvas.toJSON();
      schedulePersist();
    }
    return tempCanvas;
  }

  async function getStampPreviewDataURL(index, targetWidth, targetHeight) {
    const stamp = stamps[index];
    const canvas = await getStampCanvasFromState(stamp);
    const baseDataURL = canvas.toDataURL({ format: "png" });
    if (!targetWidth || !targetHeight) return baseDataURL;

    const resizeCanvas = document.createElement("canvas");
    resizeCanvas.width = targetWidth;
    resizeCanvas.height = targetHeight;
    const ctx = resizeCanvas.getContext("2d");
    const img = await loadImage(baseDataURL);
    const fit = fitImageToCanvas(img, resizeCanvas);
    ctx.drawImage(img, fit.offset.x, fit.offset.y, fit.width, fit.height);
    return resizeCanvas.toDataURL("image/png");
  }

  async function redrawSpecialCanvases() {
    await Promise.all([
      drawStampPreview(mainImageIndex, mainImageCanvasEl),
      drawStampPreview(tabImageIndex, tabImageCanvasEl),
    ]);
  }

  async function drawStampPreview(stampIndex, targetCanvas) {
    const ctx = targetCanvas.getContext("2d");
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    if (stampIndex === -1 || !stamps[stampIndex]) return;
    try {
      const dataURL = await getStampPreviewDataURL(
        stampIndex,
        targetCanvas.width,
        targetCanvas.height
      );
      const img = await loadImage(dataURL);
      const fit = fitImageToCanvas(img, targetCanvas);
      ctx.drawImage(img, fit.offset.x, fit.offset.y, fit.width, fit.height);
    } catch (error) {
      console.error("Failed to draw stamp preview", error);
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function showContextMenu(x, y, index) {
    const existingMenu = document.querySelector(".context-menu");
    if (existingMenu) document.body.removeChild(existingMenu);

    const menu = document.createElement("div");
    menu.className =
      "context-menu absolute bg-white text-gray-800 rounded-md shadow-lg py-1 z-50";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const closeMenu = () => {
      if (document.body.contains(menu)) document.body.removeChild(menu);
      window.removeEventListener("click", closeMenu);
    };

    const setMain = document.createElement("div");
    setMain.className = "px-4 py-2 hover:bg-gray-200 cursor-pointer";
    setMain.innerText = "メイン画像に設定";
    setMain.onclick = (e) => {
      e.stopPropagation();
      mainImageIndex = index;
      redrawSpecialCanvases();
      schedulePersist();
      closeMenu();
    };

    const setTab = document.createElement("div");
    setTab.className = "px-4 py-2 hover:bg-gray-200 cursor-pointer";
    setTab.innerText = "タブ画像に設定";
    setTab.onclick = (e) => {
      e.stopPropagation();
      tabImageIndex = index;
      redrawSpecialCanvases();
      schedulePersist();
      closeMenu();
    };

    menu.appendChild(setMain);
    menu.appendChild(setTab);
    document.body.appendChild(menu);

    setTimeout(() => window.addEventListener("click", closeMenu), 0);
  }

  function showDragOverlay(e) {
    e.preventDefault();
    // スタンプリスト内でのドラッグ（並び替え操作）の場合はオーバーレイを表示しない
    if (draggedIndex !== null) return;
    // スタンプリスト内からのドラッグの場合もオーバーレイを表示しない
    if (e.target.closest && e.target.closest("#stamp-list")) return;
    dragOverlay.classList.remove("hidden");
  }

  function hideDragOverlay(e) {
    e.preventDefault();
    dragOverlay.classList.add("hidden");
  }

  // --- カスタム確認ダイアログ ---
  function showConfirmDialog(message) {
    return new Promise((resolve) => {
      confirmMessage.textContent = message;
      confirmModal.classList.remove("hidden");
      confirmModal.classList.add("flex");

      const cleanup = () => {
        confirmModal.classList.add("hidden");
        confirmModal.classList.remove("flex");
        confirmOkBtn.removeEventListener("click", onOk);
        confirmCancelBtn.removeEventListener("click", onCancel);
      };

      const onOk = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      confirmOkBtn.addEventListener("click", onOk);
      confirmCancelBtn.addEventListener("click", onCancel);
    });
  }

  // --- 初期化実行 ---
  initialize();
});
