
let wshelper = {

    activePart: 0,
    activeWorksheet: 0,
    parts: [],
    md: null,

    newCanvas: (parent) => {
        let canvas = document.createElement("canvas");
        canvas.height = "512";
        canvas.width = "512";
        canvas.id = "c";
        parent.appendChild(canvas);
    },

    RGBToHex: (r,g,b) => {
        return "#" + Math.round(r).toString(16).padStart(2, '0') + Math.round(g).toString(16).padStart(2, '0') + Math.round(b).toString(16).padStart(2, '0');
    },

    hexToRGB: (h) => {
        let r = 0, g = 0, b = 0;
        if (h.length == 4) {
          r = "0x" + h[1] + h[1];
          g = "0x" + h[2] + h[2];
          b = "0x" + h[3] + h[3];
        } else if (h.length == 7) {
          r = "0x" + h[1] + h[2];
          g = "0x" + h[3] + h[4];
          b = "0x" + h[5] + h[6];
        }
        return vec3(parseInt(r),parseInt(g),parseInt(b));
    },

    apply_part: (worksheetId, partId) => {
        const part = wshelper.parts[partId];
        let panel = document.getElementById("panel");
        panel.innerHTML = '';

        

        if (part.header){
            const header = document.createElement("h1");
            header.classList.add("mb-4");
            header.innerHTML = part.header;
            panel.appendChild(header);
            const javascriptLink = document.createElement("a");
            javascriptLink.classList.add("btn", "btn-success", "btn-shadow" ,"px-3", "my-0", "ml-3", "text-left");
            javascriptLink.title = "Download Theme";
            javascriptLink.href = "W"+worksheetId+"P"+(partId+1)+".js";
            javascriptLink.innerText = "JS Code";
            javascriptLink.target = "_blank";
            header.appendChild(javascriptLink);
        }

        const row = document.createElement("div");
        row.classList.add("row");
        panel.appendChild(row);

        if (part.hasCanvas){
            const canvasCol = document.createElement("div");
            canvasCol.classList.add("col-md-6");
            wshelper.newCanvas(canvasCol);
            row.appendChild(canvasCol);

            if (part.loadControls){
                canvasCol.appendChild(part.loadControls());
            }
        }

        if (part.description){
            const descriptionCol = document.createElement("div");
            descriptionCol.classList.add("col-md-6");
            const description = document.createElement("div");
            description.innerHTML = wshelper.md.render(part.description);
            description.querySelectorAll('pre code').forEach((el) => {
                hljs.highlightElement(el);
              });
            descriptionCol.appendChild(description);
            row.appendChild(descriptionCol);
        }
        if (part.loadShaders){
            part.loadShaders();
        }
        if (part.init) {
            part.init();
        }


    },


    init: (worksheetId,initParts) => {
        wshelper.parts = initParts;
        wshelper.activePart = initParts.length-1;
        wshelper.activeWorksheet = worksheetId;
        wshelper.md = markdownit().use(texmath, { engine: katex,
            delimiters: 'dollars',
            katexOptions: { macros: {"\\RR": "\\mathbb{R}"} } });
        wshelper.md.highlight = function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
              try {
                return hljs.highlight(str, { language: lang }).value;
              } catch (__) {}
            }
        
            return ''; // use external default escaping
          };


        for (let i = 0; i < initParts.length; i++) {
            const part = initParts[i];
            wshelper.createPartRow(part, i);
        }

        wshelper.apply_part(wshelper.activeWorksheet,wshelper.activePart);


    },

    createPartRow: (part, i) => {
        const tr = document.createElement("tr");

        const num = document.createElement("th");
        num.scope= "row";
        num.innerText = i+1;
        tr.appendChild(num);
        
        const title = document.createElement("td")
        if (part.header) {
            title.innerText = part.header
        } else{
            title.innerText = "no part title";
        }
        tr.appendChild(title)

        const buttonTd = document.createElement("td");
        const buttonA = document.createElement("a");
        buttonA.classList.add("btn", "btn-success", "btn-shadow" ,"px-3", "my-0", "ml-0", "text-right");
        buttonA.title = "Download Theme";
        buttonA.href = "#";
        buttonA.onclick = () => wshelper.apply_part(wshelper.activeWorksheet,i);
        buttonA.innerText = "Apply";
        buttonTd.appendChild(buttonA);
        tr.appendChild(buttonTd);

        document.getElementById("table-body").appendChild(tr);
    }

}

