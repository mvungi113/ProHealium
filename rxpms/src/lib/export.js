import api from "./api";

export async function exportData(type, format = "excel", params = {}) {
  try {
    const response = await api.get(`/export/${type}`, {
      params: { format, ...params },
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const ext = format === "pdf" ? "pdf" : "xlsx";
    const filename = `${type}.${ext}`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error("Export failed:", err);
    return false;
  }
}
