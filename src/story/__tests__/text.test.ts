import { stripNarrationCues } from '../text';

describe('stripNarrationCues', () => {
  it('saca la forma canonica', () => {
    expect(stripNarrationCues('Primera parte. (pausa) Segunda parte.')).toBe(
      'Primera parte. Segunda parte.'
    );
  });

  it.each([
    '(Pausa)',
    '[PAUSA]',
    '( pausa )',
    '{pausa}',
    '(pausa breve)',
    '(pausa larga)',
    '[Pausa...]',
    '—pausa—',
    '(pausas)',
  ])('saca la variante %s', (cue) => {
    expect(stripNarrationCues(`Antes ${cue} despues.`)).toBe('Antes despues.');
  });

  it('no toca la palabra suelta ni parentesis legitimos', () => {
    const texto = 'Tomi hizo una pausa y siguio. El raton (que era chiquito) corrio.';
    expect(stripNarrationCues(texto)).toBe(texto);
  });

  it('no se come una oracion larga entre parentesis que empieza con la palabra', () => {
    const texto = '(pausa muy muy larga, casi una oracion entera dentro del parentesis)';
    expect(stripNarrationCues(texto)).toBe(texto);
  });

  it('normaliza los espacios que deja la marca al irse', () => {
    expect(stripNarrationCues('Dijo (pausa) , y se fue.')).toBe('Dijo, y se fue.');
  });

  it('aguanta marcas seguidas', () => {
    expect(stripNarrationCues('Una. (pausa) (pausa) Dos.')).toBe('Una. Dos.');
  });

  it('devuelve string vacio con entrada vacia', () => {
    expect(stripNarrationCues('')).toBe('');
  });
});
