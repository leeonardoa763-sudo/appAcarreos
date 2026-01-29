// src/utils/statsReportTemplate.js

import { colors } from "../config/colors";
import { statsColors } from "../config/statsColors";

/**
 * Genera HTML para el reporte ejecutivo de estadísticas
 * Diseñado para ser convertido a PDF profesional
 */
export const generateStatsReportHTML = ({
  periodo,
  fecha,
  totales,
  materialPieData,
  costoPieData,
  topOperadores,
  obraInfo,
  hasFilters,
  filters,
}) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // Calcular ahorros
  const tiempoAhorrado = (totales.totalViajes * 42) / 60; // horas
  const hojasAhorradas = totales.totalViajes;
  const erroresEvitados = Math.round(totales.totalViajes * 0.08);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Ejecutivo - ${periodo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F5F6FA;
      padding: 20px;
      color: #2C3E50;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 3px solid ${colors.primary};
    }

    .logo-section {
      margin-bottom: 20px;
    }

    .app-title {
      font-size: 28px;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 5px;
    }

    .report-title {
      font-size: 24px;
      font-weight: 600;
      color: #2C3E50;
      margin-top: 15px;
      margin-bottom: 8px;
    }

    .report-subtitle {
      font-size: 16px;
      color: #7F8C8D;
    }

    .report-date {
      font-size: 14px;
      color: #95A5A6;
      margin-top: 10px;
    }

    /* Obra Info */
    .obra-info {
      background: #F8F9FA;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid ${colors.accent};
    }

    .obra-info-title {
      font-size: 14px;
      font-weight: 600;
      color: #7F8C8D;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .obra-name {
      font-size: 18px;
      font-weight: bold;
      color: #2C3E50;
    }

    /* Filtros activos */
    .filters-section {
      background: #FFF3E0;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #F77F00;
    }

    .filters-title {
      font-size: 14px;
      font-weight: 600;
      color: #E65100;
      margin-bottom: 10px;
    }

    .filter-item {
      font-size: 13px;
      color: #5D4037;
      margin-bottom: 5px;
      padding-left: 15px;
      position: relative;
    }

    .filter-item:before {
      content: "•";
      position: absolute;
      left: 0;
    }

    /* Section */
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #2C3E50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ECF0F1;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .kpi-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 12px;
      color: white;
      text-align: center;
    }

    .kpi-card.primary {
      background: linear-gradient(135deg, ${colors.primary} 0%, #FF8C42 100%);
    }

    .kpi-card.secondary {
      background: linear-gradient(135deg, ${colors.secondary} 0%, #0077B6 100%);
    }

    .kpi-card.accent {
      background: linear-gradient(135deg, ${colors.accent} 0%, #88D498 100%);
    }

    .kpi-card.success {
      background: linear-gradient(135deg, #1A936F 0%, #88D498 100%);
    }

    .kpi-icon {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.9;
    }

    .kpi-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .kpi-label {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
    }

    /* Savings Card */
    .savings-card {
      background: linear-gradient(135deg, #1A936F 0%, #88D498 100%);
      padding: 30px;
      border-radius: 12px;
      color: white;
      margin-bottom: 30px;
    }

    .savings-header {
      text-align: center;
      margin-bottom: 25px;
    }

    .savings-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .savings-subtitle {
      font-size: 14px;
      opacity: 0.9;
    }

    .savings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .savings-metric {
      background: rgba(255,255,255,0.15);
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .savings-metric-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .savings-metric-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .savings-metric-label {
      font-size: 12px;
      opacity: 0.9;
    }

    /* Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    .data-table th {
      background: #34495E;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #ECF0F1;
      font-size: 14px;
    }

    .data-table tr:nth-child(even) {
      background: #F8F9FA;
    }

    .rank-badge {
      display: inline-block;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      text-align: center;
      line-height: 30px;
      font-weight: bold;
      font-size: 14px;
      margin-right: 10px;
    }

    .rank-1 { background: #FFD700; color: #000; }
    .rank-2 { background: #C0C0C0; color: #000; }
    .rank-3 { background: #CD7F32; color: #fff; }
    .rank-other { background: #ECF0F1; color: #7F8C8D; }

    /* Material Distribution */
    .material-list {
      list-style: none;
    }

    .material-item {
      padding: 12px;
      margin-bottom: 8px;
      background: #F8F9FA;
      border-radius: 8px;
      border-left: 4px solid ${colors.primary};
    }

    .material-name {
      font-weight: 600;
      color: #2C3E50;
      margin-bottom: 5px;
    }

    .material-stats {
      font-size: 13px;
      color: #7F8C8D;
    }

    .material-bar {
      height: 8px;
      background: #ECF0F1;
      border-radius: 4px;
      margin-top: 8px;
      overflow: hidden;
    }

    .material-bar-fill {
      height: 100%;
      background: ${colors.primary};
      border-radius: 4px;
    }

    /* Footer */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ECF0F1;
      text-align: center;
      color: #95A5A6;
      font-size: 12px;
    }

    .footer-info {
      margin-bottom: 5px;
    }

    .page-break {
      page-break-after: always;
    }

    /* Print styles */
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .page {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- PÁGINA 1: RESUMEN EJECUTIVO -->
    
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="app-title">Control de Acarreos</div>
      </div>
      <div class="report-title">Reporte Ejecutivo de Vales</div>
      <div class="report-subtitle">Periodo: ${periodo}</div>
      <div class="report-date">Generado: ${fecha}</div>
    </div>

    <!-- Obra Info -->
    ${
      obraInfo
        ? `
    <div class="obra-info">
      <div class="obra-info-title">Obra</div>
      <div class="obra-name">${obraInfo.obra || "N/A"}</div>
    </div>
    `
        : ""
    }

    <!-- Filtros activos -->
    ${
      hasFilters
        ? `
    <div class="filters-section">
      <div class="filters-title">Filtros Aplicados:</div>
      ${
        filters.materiales?.length > 0
          ? `
        <div class="filter-item">${filters.materiales.length} material(es) seleccionado(s)</div>
      `
          : ""
      }
      ${
        filters.sindicatos?.length > 0
          ? `
        <div class="filter-item">${filters.sindicatos.length} sindicato(s) seleccionado(s)</div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- KPIs Principales -->
    <div class="section">
      <div class="section-title">Resumen General</div>
      <div class="kpi-grid">
        <div class="kpi-card primary">
          <div class="kpi-icon">📦</div>
          <div class="kpi-value">${formatNumber(totales.totalM3, 1)} m³</div>
          <div class="kpi-label">Material Movido</div>
        </div>
        <div class="kpi-card secondary">
          <div class="kpi-icon">⏱️</div>
          <div class="kpi-value">${formatNumber(totales.totalHoras, 1)} hrs</div>
          <div class="kpi-label">Horas de Renta</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-icon">🚚</div>
          <div class="kpi-value">${totales.totalViajes}</div>
          <div class="kpi-label">Viajes Totales</div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-icon">💰</div>
          <div class="kpi-value">${formatCurrency(totales.costoTotal)}</div>
          <div class="kpi-label">Costo Total</div>
        </div>
      </div>
    </div>

    <!-- Impacto Digital -->
    <div class="section">
      <div class="section-title">Impacto de la Digitalización</div>
      <div class="savings-card">
        <div class="savings-header">
          <div class="savings-title">Ahorro vs Vales Físicos</div>
          <div class="savings-subtitle">Basado en ${totales.totalViajes} vales procesados</div>
        </div>
        <div class="savings-grid">
          <div class="savings-metric">
            <div class="savings-metric-icon">⚡</div>
            <div class="savings-metric-value">${formatNumber(tiempoAhorrado, 0)} hrs</div>
            <div class="savings-metric-label">Tiempo Ahorrado</div>
          </div>
          <div class="savings-metric">
            <div class="savings-metric-icon">📄</div>
            <div class="savings-metric-value">${hojasAhorradas}</div>
            <div class="savings-metric-label">Hojas Ahorradas</div>
          </div>
          <div class="savings-metric">
            <div class="savings-metric-icon">✓</div>
            <div class="savings-metric-value">${erroresEvitados}</div>
            <div class="savings-metric-label">Errores Evitados</div>
          </div>
          <div class="savings-metric">
            <div class="savings-metric-icon">📈</div>
            <div class="savings-metric-value">93%</div>
            <div class="savings-metric-label">Más Eficiente</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-break"></div>

    <!-- PÁGINA 2: DISTRIBUCIONES -->
    
    <!-- Distribución por Material -->
    <div class="section">
      <div class="section-title">Distribución por Tipo de Material</div>
      <ul class="material-list">
        ${materialPieData
          .slice(0, 5)
          .map((material, index) => {
            const total = materialPieData.reduce((sum, m) => sum + m.value, 0);
            const percentage = ((material.value / total) * 100).toFixed(1);
            return `
            <li class="material-item">
              <div class="material-name">${material.name}</div>
              <div class="material-stats">
                ${formatNumber(material.value, 1)} m³ (${percentage}%)
              </div>
              <div class="material-bar">
                <div class="material-bar-fill" style="width: ${percentage}%"></div>
              </div>
            </li>
          `;
          })
          .join("")}
      </ul>
    </div>

    <!-- Distribución de Costos -->
    <div class="section">
      <div class="section-title">Distribución de Costos</div>
      <div class="kpi-grid">
        ${costoPieData
          .map(
            (item, index) => `
          <div class="kpi-card ${index === 0 ? "primary" : "secondary"}">
            <div class="kpi-icon">${index === 0 ? "📦" : "🚜"}</div>
            <div class="kpi-value">${formatCurrency(item.value)}</div>
            <div class="kpi-label">${item.name}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <!-- Top Operadores -->
    <div class="section">
      <div class="section-title">Top 5 Operadores Más Activos</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Ranking</th>
            <th>Operador</th>
            <th style="text-align: center;">Viajes</th>
          </tr>
        </thead>
        <tbody>
          ${topOperadores
            .slice(0, 5)
            .map(
              (operador, index) => `
            <tr>
              <td>
                <span class="rank-badge rank-${index < 3 ? index + 1 : "other"}">
                  ${index + 1}
                </span>
              </td>
              <td>${operador.nombre}</td>
              <td style="text-align: center; font-weight: bold;">${operador.viajes}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-info">Control de Acarreos - Sistema de Gestión de Vales Digitales</div>
      <div class="footer-info">Reporte generado el ${fecha}</div>
      <div class="footer-info">Este documento es confidencial y está destinado únicamente para uso interno</div>
    </div>
  </div>
</body>
</html>
  `;
};
