import ExcelJS from 'exceljs';
import { api, type Asistencia } from '../api/client.js';
import { formatColombiaDateTime } from './date.js';

async function fetchSignatureAsPngBase64(asistenciaId: string): Promise<string | null> {
  try {
    const url = api.firmas.getUrl(asistenciaId);
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();

    return await new Promise<string | null>((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || 300;
          const height = img.naturalHeight || 120;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            return resolve(null);
          }

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };

      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

export interface ExportProgress {
  actual: number;
  total: number;
  mensaje: string;
}

export async function exportarAsistenciasExcel(
  asistencias: Asistencia[],
  nombreArchivo?: string,
  onProgress?: (progreso: ExportProgress) => void
): Promise<void> {
  if (asistencias.length === 0) {
    throw new Error('No hay asistencias registradas para exportar.');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'S3A - Sistema de Asistencia Amigo Académico';
  workbook.lastModifiedBy = 'S3A';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Lista de Asistencia', {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  worksheet.columns = [
    { header: 'N° REGISTRO', key: 'numero', width: 14 },
    { header: 'CÓDIGO MATERIA', key: 'codigoMateria', width: 18 },
    { header: 'NOMBRE MATERIA', key: 'nombreMateria', width: 34 },
    { header: 'NOMBRE Y APELLIDO ESTUDIANTE', key: 'nombreEstudiante', width: 34 },
    { header: 'CÓDIGO ESTUDIANTE', key: 'codigoEstudiante', width: 22 },
    { header: 'TEMAS', key: 'motivo', width: 38 },
    { header: 'FECHA Y HORA', key: 'fechaHora', width: 25 },
    { header: 'FIRMA', key: 'firma', width: 28 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC62828' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF8E0000' } },
      left: { style: 'thin', color: { argb: 'FF8E0000' } },
      bottom: { style: 'medium', color: { argb: 'FF8E0000' } },
      right: { style: 'thin', color: { argb: 'FF8E0000' } },
    };
  });

  for (let i = 0; i < asistencias.length; i++) {
    const a = asistencias[i];
    if (onProgress) {
      onProgress({
        actual: i + 1,
        total: asistencias.length,
        mensaje: `Procesando firma ${i + 1} de ${asistencias.length}...`,
      });
    }

    const rowNumber = i + 2;
    const row = worksheet.addRow({
      numero: i + 1,
      codigoMateria: a.materiaCodigo || 'N/A',
      nombreMateria: a.materiaNombre || 'Asesoría Académica',
      nombreEstudiante: a.nombreEstudiante,
      codigoEstudiante: a.codigoEstudiante,
      motivo: a.motivo,
      fechaHora: formatColombiaDateTime(a.fechaHora),
      firma: '',
    });

    row.height = 58;

    row.eachCell((cell, colNumber) => {
      cell.font = { size: 10, name: 'Calibri' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      if (i % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' },
        };
      }

      if (colNumber === 1 || colNumber === 2 || colNumber === 5 || colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });

    const base64 = await fetchSignatureAsPngBase64(a.id);
    if (base64) {
      try {
        const imageId = workbook.addImage({
          base64: base64,
          extension: 'png',
        });

        worksheet.addImage(imageId, {
          tl: { col: 7 + 0.12, row: rowNumber - 1 + 0.1 },
          ext: { width: 140, height: 46 },
          editAs: 'oneCell',
        });
      } catch {
        row.getCell(8).value = '(Firma registrada)';
      }
    } else {
      row.getCell(8).value = '(Sin firma)';
    }
  }

  if (onProgress) {
    onProgress({
      actual: asistencias.length,
      total: asistencias.length,
      mensaje: 'Generando archivo Excel...',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const fechaHoy = new Date().toISOString().slice(0, 10);
  const nombreFinal = nombreArchivo || `asistencias_amigo_academico_${fechaHoy}.xlsx`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nombreFinal;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
