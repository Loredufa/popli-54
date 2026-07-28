// src/lib/useRotatingMessage.ts
import * as React from 'react';

/**
 * Rota entre varios mensajes mientras dura una espera larga.
 *
 * Generar la narración o las ilustraciones puede tardar minutos (el worker de TTS
 * arranca en frío y después genera el cuento por pedazos). Un texto fijo que no se
 * mueve durante dos minutos parece que la app se colgó; ir alternando "Generando la
 * narración..." con "Esto puede tardar un poquito..." muestra que sigue trabajando.
 *
 * Cuando `active` es false vuelve al primer mensaje, así el próximo intento arranca
 * desde el principio y no desde donde había quedado.
 */
export function useRotatingMessage(
  messages: string[],
  active: boolean,
  intervalMs = 4000,
): string {
  const [index, setIndex] = React.useState(0);

  // Sin ref, un array literal en el JSX del padre (identidad nueva en cada render)
  // reiniciaría el intervalo en cada render y el mensaje no cambiaría nunca.
  const messagesRef = React.useRef(messages);
  React.useEffect(() => { messagesRef.current = messages; }, [messages]);

  React.useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => {
        const total = messagesRef.current.length;
        return total ? (i + 1) % total : 0;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  if (!messages.length) return '';
  return messages[Math.min(index, messages.length - 1)];
}
