let wshelper = {

    activePart: 0,
    parts: [],

    newCanvas: (parent) => {
        let canvas = document.createElement("canvas");
        canvas.height = "512";
        canvas.width = "512";
        canvas.id = "c";
        parent.appendChild(canvas);
    },

    apply_part: (worksheetId) => {
        const worksheet = wshelper.parts[worksheetId];
        let panel = document.getElementById("panel");
        panel.innerHTML = '';

        

        if (worksheet.header){
            const header = document.createElement("h1");
            header.classList.add("mb-4");
            header.innerHTML = worksheet.header;
            panel.appendChild(header);
        }

        const row = document.createElement("div");
        row.classList.add("row");
        panel.appendChild(row);

        if (worksheet.hasCanvas){
            const canvasCol = document.createElement("div");
            canvasCol.classList.add("col-md-6");
            wshelper.newCanvas(canvasCol);
            row.appendChild(canvasCol);
        }

        if (worksheet.description){
            const descriptionCol = document.createElement("div");
            descriptionCol.classList.add("col-md-6");
            const description = document.createElement("div");
            description.innerHTML = worksheet.description;
            descriptionCol.appendChild(description);
            row.appendChild(descriptionCol);
        }

        if (worksheet.init) {
            worksheet.init();
        }


    },


    init: (initParts) => {
        wshelper.parts = initParts;
        activePart = initParts.length-1;

        for (let i = 0; i < initParts.length; i++) {
            const part = initParts[i];
            wshelper.createPartRow(part, i);
        }

        wshelper.apply_part(activePart);


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
        buttonA.classList.add("btn", "btn-success", "btn-shadow" ,"px-3", "my-0", "ml-3", "text-left");
        buttonA.title = "Download Theme";
        buttonA.href = "#";
        buttonA.onclick = () => wshelper.apply_part(i);
        buttonA.innerText = "Apply";
        buttonTd.appendChild(buttonA);
        tr.appendChild(buttonTd);

        document.getElementById("table-body").appendChild(tr);
    }

}