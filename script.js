const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRGficGpTkygC-LtXsHvNScXEQ1t1yLffocy-y8XqVOApmPcPOSUEP8zybjeG1aiH4MIsy5gyAmaWx/pub?output=csv";
const imageMap = {};
const categoryMap = {};

async function loadData() {
    const res = await fetch(dataUrl);
    const text = await res.text();
    const rows = text.split('\n').map(row => row.split(',",'));

    const headers = rows.shift();
    const idx = {};
    headers.forEach((h, i) => idx[h.trim()] = i);

    rows.forEach(row => {
        const category = row[idx["Category"]];
        const itemCode = row[idx["Item Code"]];
        const itemName = row[idx["Item Name"]];
        const specs = row[idx["Specs"]];
        const variantCode = row[idx["Variant Code"]];
        const description = row[idx["Description"]];
        const price = row[idx["Price/Unit"]];
        const unit = row[idx["Unit"]];

        if (!categoryMap[category]) categoryMap[category] = {};
        if (!categoryMap[category][itemCode]) {
            categoryMap[category][itemCode] = {
                name: itemName,
                specs: specs,
                variants: []
            };
        }
        categoryMap[category][itemCode].variants.push({
            code: variantCode,
            description,
            price,
            unit
        });
    });

    populateDropdown();
}

function populateDropdown() {
    const select = document.getElementById("categorySelect");
    select.innerHTML = "<option value=''>-- Select Category --</option>";
    Object.keys(categoryMap).forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });

    select.addEventListener("change", e => renderCatalogue(e.target.value));
}

function renderCatalogue(category) {
    const container = document.getElementById("catalogue");
    container.innerHTML = "";
    if (!categoryMap[category]) return;

    Object.entries(categoryMap[category]).forEach(([itemCode, item]) => {
        const block = document.createElement("div");
        block.className = "item-block";

        const title = document.createElement("h3");
        title.textContent = `${item.name} (${itemCode})`;

        const img = document.createElement("img");
        img.src = imageMap[itemCode] || "";
        img.alt = item.name;

        const spec = document.createElement("p");
        spec.textContent = item.specs;

        const table = document.createElement("table");
        table.className = "variant-table";
        const thead = document.createElement("thead");
        thead.innerHTML = "<tr><th>Variant Code</th><th>Description</th><th>Price/Unit</th><th>Unit</th></tr>";
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        item.variants.forEach(v => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${v.code}</td><td>${v.description}</td><td>${v.price}</td><td>${v.unit}</td>`;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        block.appendChild(title);
        block.appendChild(img);
        block.appendChild(spec);
        block.appendChild(table);
        container.appendChild(block);
    });
}

async function loadImageMap() {
    const imgRes = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vRRGficGpTkygC-LtXsHvNScXEQ1t1yLffocy-y8XqVOApmPcPOSUEP8zybjeG1aiH4MIsy5gyAmaWx/pub?gid=Images&single=true&output=csv");
    const text = await imgRes.text();
    const lines = text.split('\n');
    lines.forEach(line => {
        const [code, url] = line.split(',');
        if (code && url) {
            let fileId = url.match(/[-\w]{25,}/);
            if (fileId) {
                imageMap[code.trim()] = `https://drive.google.com/uc?id=${fileId[0]}`;
            }
        }
    });
}

(async function() {
    await loadImageMap();
    await loadData();
})();
