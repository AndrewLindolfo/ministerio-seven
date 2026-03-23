import { exportBackupJson } from "../services/backup-service.js";
import { restoreBackupJson } from "../services/restore-service.js";

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  const exportButton = document.getElementById("backup-export-button");
  const restoreButton = document.getElementById("backup-restore-button");
  const input = document.getElementById("backup-restore-input");
  const fileName = document.getElementById("backup-file-name");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    if (fileName) {
      fileName.textContent = file ? file.name : "Nenhum arquivo selecionado";
    }
  });

  exportButton?.addEventListener("click", async () => {
    try {
      exportButton.disabled = true;
      const data = await exportBackupJson();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      downloadJsonFile(data, `ministerio-seven-backup-${stamp}.json`);
    } catch (error) {
      console.error("Erro ao fazer backup:", error);
      alert("Não foi possível gerar o backup.");
    } finally {
      exportButton.disabled = false;
    }
  });

  restoreButton?.addEventListener("click", async () => {
    try {
      const file = input?.files?.[0];
      if (!file) {
        alert("Selecione um arquivo de backup primeiro.");
        return;
      }

      if (!confirm("Deseja recuperar este backup? Isso vai restaurar os itens do arquivo no Firebase.")) {
        return;
      }

      restoreButton.disabled = true;

      const text = await file.text();
      const json = JSON.parse(text);
      await restoreBackupJson(json);

      alert("Backup restaurado com sucesso.");
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      alert("Não foi possível restaurar o backup.");
    } finally {
      restoreButton.disabled = false;
    }
  });
});
