// src/hooks/useSectionPagination.js
import { useState, useCallback } from "react";

const PAGE_SIZE = 20;

/**
 * useSectionPagination
 *
 * Paginación visual por sección. El array completo ya está en memoria,
 * solo controla cuántos items se muestran en pantalla.
 *
 * RETORNA por cada sección:
 * - items: array paginado listo para renderizar
 * - hayMas: boolean si quedan items sin mostrar
 * - cargarMas: función para mostrar los siguientes 20
 * - reset: función para volver a página 1
 * - total: total real de items en la sección
 */
export const useSectionPagination = (secciones) => {
  // secciones: { enProceso, emitidos, verificados, conciliados, cancelados }
  const claves = Object.keys(secciones);

  const estadoInicial = {};
  claves.forEach((clave) => {
    estadoInicial[clave] = PAGE_SIZE;
  });

  const [limites, setLimites] = useState(estadoInicial);

  const cargarMas = useCallback((clave) => {
    setLimites((prev) => ({
      ...prev,
      [clave]: prev[clave] + PAGE_SIZE,
    }));
  }, []);

  const resetear = useCallback(() => {
    const nuevo = {};
    claves.forEach((clave) => {
      nuevo[clave] = PAGE_SIZE;
    });
    setLimites(nuevo);
  }, []);

  const resultado = {};
  claves.forEach((clave) => {
    const todos = secciones[clave] || [];
    const limite = limites[clave] ?? PAGE_SIZE;
    resultado[clave] = {
      items: todos.slice(0, limite),
      hayMas: todos.length > limite,
      total: todos.length,
      cargarMas: () => cargarMas(clave),
    };
  });

  return { secciones: resultado, resetear };
};
