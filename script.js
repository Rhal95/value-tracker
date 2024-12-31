let tableBody = document.getElementById("valueTable").querySelector("tbody");
function getLastValue() {
  return tableBody.querySelector("tr:last-child>td>data")?.value;
}
function create(el, attributes, ...children) {
  const element = document.createElement(el);
  if (attributes) {
    for (const key in attributes) {
      element.setAttribute(key, attributes[key]);
    }
  }
  if (children) {
    for (const child of children) {
      element.appendChild(child);
    }
  }
  return element;
}
function createRowWithValueAndTime(value, time) {
  const lastValue = getLastValue();
  const rowToInsert = create(
    "tr",
    null,
    create(
      "td",
      null,
      create(
        "time",
        { datetime: time.toISOString() },
        document.createTextNode(time.toLocaleString()),
      ),
    ),
    create(
      "td",
      null,
      create(
        "data",
        { value: value.toString() },
        document.createTextNode(value.toString()),
      ),
    ),
    create(
      "td",
      null,
      document.createTextNode(
        lastValue != null ? value - Number(lastValue) : "-",
      ),
    ),
  );
  tableBody.appendChild(rowToInsert);
}
function createRowWithValue(value) {
  const now = new Date();
  createRowWithValueAndTime(value, now);
}

document.getElementById("valueForm").onsubmit = function (ev) {
  ev.preventDefault();
  ev.stopPropagation();
  createRowWithValue(document.getElementById("valueInput").valueAsNumber);
  saveToLocalStorage(activeSlot);
};

function saveToLocalStorage(slot) {
  const tableRows = Array.from(
    document.querySelectorAll("table#valueTable>tbody>tr")
      .entries()
      .map(([_, row]) => {
        const time = new Date(row.querySelector("td>time").dateTime);
        const value = Number(row.querySelector("td>data").value);
        return [time, value];
      }),
  );
  localStorage.setItem(`data_${slot}`, JSON.stringify(tableRows));
  const slotName = document.getElementById("slotName").value;
  if (slotName && slotName !== "" && tableRows.length > 0) {
    localStorage.setItem(`name_${slot}`, slotName);
  } else if (tableRows.length > 0) {
    localStorage.setItem(
      `name_${slot}`,
      document.getElementById("slotName").placeholder,
    );
  }
  updateSlotNames();
}
function updateSlotNames() {
  document.querySelectorAll("menu#saveSlots label").forEach((el, i) => {
    const slotName = localStorage.getItem(`name_${i}`);
    el.textContent = slotName ?? `<empty>`;
  });
}
function loadFromLocalStorage(slot) {
  const storedValues = localStorage.getItem(`data_${slot}`);
  const tableRows = JSON.parse(storedValues);
  const newTableBody = create("tbody");
  tableBody.replaceWith(newTableBody);
  tableBody = newTableBody;
  if (tableRows) {
    tableRows.forEach(([time, value]) =>
      createRowWithValueAndTime(value, new Date(time))
    );
  }
  const slotName = localStorage.getItem(`name_${slot}`);
  if (slotName) {
    document.getElementById("slotName").value = slotName;
  } else {
    const el = document.getElementById("slotName");
    el.value = "";
    el.placeholder = `${slot}`;
  }
  const downloadButton = document.getElementById("downloadButton");
  let csvData = "data:text/csv;charset=utf-8,";
  csvData += "time,value\r\n";
  if (tableRows) {
    tableRows.forEach((rowArray) => {
      const row = rowArray.join(",");
      csvData += row + "\r\n";
    });
  }
  downloadButton.href = encodeURI(csvData);
  downloadButton.download = slotName ? slotName + ".csv" : `slot${slot}.csv`;
}

let activeSlot =
  Array.from(document.querySelectorAll("menu#saveSlots input")).indexOf(
    document.querySelector("menu#saveSlots input:checked"),
  ) ?? 0;
Array.from(document.querySelectorAll("menu#saveSlots input")).forEach(
  (button, i) => {
    button.onchange = function () {
      saveToLocalStorage(activeSlot);
      loadFromLocalStorage(i);
      activeSlot = i;
    };
  },
);

document.getElementById("slotForm").onsubmit = function (ev) {
  ev.preventDefault();
  ev.stopPropagation();
  saveToLocalStorage(activeSlot);
};

updateSlotNames();
loadFromLocalStorage(activeSlot);
